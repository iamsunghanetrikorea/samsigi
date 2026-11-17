import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { RECIPE_BY_ID, MEAL_LABEL, DIFFICULTY_LABEL, recipeAllergens, RECIPE_SOURCE_NOTE, menuNo } from '../data/recipes';
import { ING, formatAmount } from '../data/ingredients';
import { mealItems, sumItems, round, won } from '../lib/nutrition';
import { fmtDate, today } from '../lib/date';
import { Estimate } from '../components/ui';
import { go } from '../router';
import { PHOTOS } from '../data/photos';
import SendToGpt from '../components/SendToGpt';
import { youtubeSuggestions } from '../lib/youtube';
import { recipeRefs } from '../data/recipePack';
import { MyTableButton } from '../components/MyTable';
import { linkTarget } from './Restaurants';
import { recipeText, GPT_RECIPE_PROMPT } from '../lib/share';

const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
function speak(text) {
  if (!canSpeak) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR'; u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.4, 0.8].forEach((t) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.3, ctx.currentTime + t);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.25);
    });
  } catch { /* 소리 불가 */ }
  navigator.vibrate?.([300, 150, 300]);
}

function Timer({ minutes }) {
  const [left, setLeft] = useState(null);
  const ref = useRef(null);
  useEffect(() => () => clearInterval(ref.current), []);
  const start = () => {
    clearInterval(ref.current);
    const end = Date.now() + minutes * 60000;
    setLeft(minutes * 60);
    ref.current = setInterval(() => {
      const s = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) { clearInterval(ref.current); beep(); speak('타이머가 끝났어요.'); }
    }, 500);
  };
  const stop = () => { clearInterval(ref.current); setLeft(null); };
  if (left === null) return <button className="btn small" onClick={start}>⏱ {minutes}분 타이머</button>;
  const mm = Math.floor(left / 60); const ss = String(left % 60).padStart(2, '0');
  return (
    <span className="timer" role="timer" aria-live="off">
      <b className={left === 0 ? 'done' : ''}>{left === 0 ? '완료!' : `${mm}:${ss}`}</b>
      <button className="btn small ghost" onClick={stop}>{left === 0 ? '닫기' : '멈춤'}</button>
    </span>
  );
}

export default function RecipePage({ id, query }) {
  const { state, targets, setEntry, update, notify } = useStore();
  const recipe = RECIPE_BY_ID[id];
  const { date, meal } = query;
  const entry = date && meal ? state.plans[date]?.[meal] : null;
  const linked = entry && entry.recipeId === id;
  const [localServ, setLocalServ] = useState(state.profile.people || 1);
  const [localSubs, setLocalSubs] = useState({});
  const [sending, setSending] = useState(false);
  if (!recipe) return <div className="card">레시피를 찾을 수 없어요. <a href="#/recipes">레시피 모음으로</a></div>;

  const servings = linked ? entry.servings || 1 : localServ;
  const subs = linked ? entry.subs || {} : localSubs;
  const isSnack = recipe.meals.includes('snack');
  const mealKcal = isSnack ? undefined : targets.perMeal[meal || recipe.meals[0]]?.kcal;
  const { items, factor } = mealItems(recipe, { kcal: mealKcal, subs });
  const n = sumItems(items.map((i) => [i.id, i.g]));
  const allergens = recipeAllergens(recipe, subs);
  const warnAllergy = allergens.filter((a) => state.profile.allergies.includes(a));
  const fav = state.profile.favorites.includes(id);

  const setServings = (s) => (linked ? setEntry(date, meal, { ...entry, servings: s }) : setLocalServ(s));
  const setSub = (orig, to) => {
    const next = { ...subs };
    if (to === orig) delete next[orig]; else next[orig] = to;
    if (linked) setEntry(date, meal, { ...entry, subs: next }); else setLocalSubs(next);
  };

  const addMissing = () => {
    const missing = items.filter((i) => ING[i.id].cat !== '양념' && (state.pantry[i.id] || 0) < i.g * servings);
    update('shopping', (sh) => {
      const extras = [...sh.extras];
      for (const i of missing) {
        const need = i.g * servings - (state.pantry[i.id] || 0);
        const ex = extras.find((x) => x.id === i.id);
        if (ex) ex.grams += need; else extras.push({ id: i.id, grams: need, from: recipe.title, checked: false });
      }
      return { ...sh, extras };
    });
    notify(missing.length ? `없는 재료 ${missing.length}가지를 장보기 목록에 담았어요` : '필요한 재료가 모두 있어요');
  };

  const readAll = () => speak(`${recipe.title}. ${recipe.steps.map((s, i) => `${i + 1}단계. ${s[0]}`).join(' ')}`);

  return (
    <article className="stack recipe">
      <button className="btn ghost small no-print" onClick={() => history.back()}>← 뒤로</button>
      {PHOTOS[id] ? (
        <figure className="recipe-photo">
          <img src={`./photos/${id}.webp`} alt={`${recipe.title} 예시 사진`} />
          <figcaption>예시 사진 · <a href={PHOTOS[id].page} target="_blank" rel="noopener noreferrer">{PHOTOS[id].artist || '작성자 미상'}</a>, {PHOTOS[id].licenseUrl ? <a href={PHOTOS[id].licenseUrl} target="_blank" rel="noopener noreferrer">{PHOTOS[id].license}</a> : PHOTOS[id].license} (Wikimedia Commons)</figcaption>
        </figure>
      ) : <div className="recipe-hero" aria-hidden>{recipe.emoji}</div>}
      <div>
        {linked && <p className="muted">{fmtDate(date)} {MEAL_LABEL[meal]}</p>}
        <h1><span className="menu-no big" aria-label={`메뉴 ${menuNo(recipe)}번`}>{menuNo(recipe)}</span>{recipe.title}</h1>
        <div className="badges">
          <span className="badge">난이도 {DIFFICULTY_LABEL[recipe.difficulty]}</span>
          <span className="badge">준비 {recipe.prep}분 · 조리 {recipe.cook}분</span>
          {recipe.soft && <span className="badge">부드러움</span>}
          {recipe.tags.map((t) => <span key={t} className="badge light">{t}</span>)}
        </div>
      </div>
      {warnAllergy.length > 0 && <p className="warn">⚠️ 알레르기 성분이 들어 있어요: {warnAllergy.join(', ')}</p>}

      <div className="row wrap no-print">
        <button className={`btn ${fav ? 'on' : 'ghost'}`} aria-pressed={fav} onClick={() => update('profile', (p) => ({ ...p, favorites: fav ? p.favorites.filter((x) => x !== id) : [...p.favorites, id] }))}>{fav ? '♥ 즐겨찾기됨' : '♡ 즐겨찾기'}</button>
        <MyTableButton id={id} />
        {canSpeak && <button className="btn ghost" onClick={readAll}>🔊 조리법 읽어 주기</button>}
        <button className="btn ghost" onClick={() => window.print()}>인쇄</button>
        <button className="btn soft full-narrow" onClick={() => setSending(true)}>📤 GPT로 보내기</button>
        {isSnack && <button className="btn full-narrow" onClick={() => { update('snacks', (x) => ({ ...x, [today()]: [...(x[today()] || []), { name: recipe.title, kcal: Math.round(n.kcal * servings) }] })); notify(`오늘 간식에 '${recipe.title}'(${Math.round(n.kcal * servings)}kcal)을 기록했어요`); }}>🥛 오늘 간식으로 기록</button>}
      </div>
      {sending && (
        <SendToGpt title="이 레시피 ChatGPT로 보내기" onClose={() => setSending(false)}
          initialText={`${GPT_RECIPE_PROMPT}\n\n${recipeText({ recipe, items, servings, nutrition: n, mealLabel: linked ? MEAL_LABEL[meal] : '', dateLabel: linked ? fmtDate(date) : '' })}`} />
      )}

      <section className="card">
        <h2>몇 인분 만들까요?</h2>
        <div className="seg" role="radiogroup" aria-label="인분">
          {[1, 2, 3, 4].map((s) => <button key={s} role="radio" aria-checked={servings === s} className={servings === s ? 'on' : ''} onClick={() => setServings(s)}>{s}인분</button>)}
        </div>
        {!linked && date === undefined && <p className="muted small">식단에서 열면 인분·재료 변경이 식단과 장보기에 함께 반영돼요.</p>}
      </section>

      <section className="card">
        <h2>재료 ({servings}인분)</h2>
        {factor !== 1 && <p className="muted small">목표 열량에 맞춰 밥·면 양을 {factor < 1 ? '줄였어요' : '늘렸어요'} (기본의 {Math.round(factor * 100)}%).</p>}
        <ul className="ingredients">
          {items.map((i) => {
            const ing = ING[i.id];
            const alts = recipe.subs[i.orig];
            const have = (state.pantry[i.id] || 0) >= i.g * servings;
            return (
              <li key={i.orig}>
                <div className="ing-row">
                  <span>{have && <span className="have" title="보유 중">✓ </span>}{ing.name}</span>
                  <b>{formatAmount(i.id, i.g * servings)}</b>
                </div>
                {alts && (
                  <label className="sub-select">
                    <span className="muted small">대체 재료</span>
                    <select value={i.id} onChange={(e) => setSub(i.orig, e.target.value)}>
                      {[i.orig, ...alts].map((a) => <option key={a} value={a}>{ING[a].name}{a === i.orig ? ' (기본)' : ''}</option>)}
                    </select>
                  </label>
                )}
              </li>
            );
          })}
        </ul>
        {allergens.length > 0 && <p className="muted small">알레르기 유발 성분: {allergens.join(', ')}</p>}
        <button className="btn no-print" onClick={addMissing}>🛒 없는 재료만 장보기에 담기</button>
      </section>

      <section className="card">
        <h2>1인분 영양정보 <Estimate /></h2>
        <table className="ntable">
          <tbody>
            <tr><th>열량</th><td>{round(n.kcal)} kcal</td><td className="muted">{isSnack ? `간식 목표 ${targets.snackKcal}` : `목표 ${round(mealKcal)}`}</td></tr>
            <tr><th>탄수화물</th><td>{round(n.carb)} g</td><td className="muted">{round(n.carb * 4 / n.kcal * 100)}%</td></tr>
            <tr><th>단백질</th><td>{round(n.protein)} g</td><td className="muted">{round(n.protein * 4 / n.kcal * 100)}%</td></tr>
            <tr><th>지방</th><td>{round(n.fat)} g</td><td className="muted">{round(n.fat * 9 / n.kcal * 100)}%</td></tr>
            <tr><th>나트륨</th><td>{round(n.sodium)} mg</td><td className="muted">하루 상한 {targets.sodium}</td></tr>
            <tr><th>예상 재료비</th><td>{won(n.cost)}</td><td className="muted">{servings}인분 {won(n.cost * servings)}</td></tr>
          </tbody>
        </table>
        <p className="muted small">{RECIPE_SOURCE_NOTE}. 재료 중량 기준 계산값이며 실제와 다를 수 있습니다.</p>
      </section>

      <section className="card">
        <h2>만드는 법</h2>
        <ol className="steps">
          {recipe.steps.map(([text, min], i) => (
            <li key={i}>
              <span className="step-n" aria-hidden>{i + 1}</span>
              <div className="step-body">
                <p>{text}{min ? <span className="muted"> (약 {min}분)</span> : null}</p>
                <div className="row wrap no-print">
                  {canSpeak && <button className="btn small ghost" onClick={() => speak(`${i + 1}단계. ${text}`)}>🔊 읽기</button>}
                  {min ? <Timer minutes={min} /> : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
        {recipe.tip && <p className="notice">💡 {recipe.tip}</p>}
        <p className="muted small">출처: {recipe.source}</p>
        {(recipe.isNew || recipe.isCustom || recipe.refs) && (
          <p className="small">참고 자료: {recipeRefs(recipe).map((x, i) => <span key={x.url}>{i > 0 && ' · '}<a href={x.url} {...linkTarget()}>{x.label}</a></span>)}</p>
        )}
      </section>

      <section className="card no-print">
        <h2><span aria-hidden>▶️</span> 유튜브 추천 영상</h2>
        <p className="muted small">누르면 지금 창에서 유튜브 조리 영상이 열려요. 다 보신 뒤 <b>뒤로 가기</b>를 누르면 이 레시피로 돌아와요.</p>
        <ul className="yt-list">
          {youtubeSuggestions(recipe).map((y) => (
            <li key={y.q}>
              <a href={y.url} rel="noreferrer">
                <span className="yt-ico" aria-hidden>▶</span>
                <span className="yt-body"><b>{y.label}</b><span className="muted small">{y.desc}</span></span>
                <span aria-hidden>›</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="row wrap no-print">
        {linked && <button className="btn" onClick={() => go(`/plan?view=week&d=${date}`)}>식단으로 돌아가기</button>}
      </div>
    </article>
  );
}
