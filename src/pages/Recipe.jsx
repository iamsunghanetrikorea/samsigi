import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { RECIPE_BY_ID, MEAL_LABEL, DIFFICULTY_LABEL, recipeAllergens, menuNo } from '../data/recipes';
import { ING, formatAmount, NUTRITION_SOURCE } from '../data/ingredients';
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
import { recipeText, gptRecipePrompt } from '../lib/share';
import { t, getLang } from '../i18n';

const SPEECH_LANG = { ko: 'ko-KR', zh: 'zh-CN', ja: 'ja-JP', en: 'en-US' };

const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
function speak(text) {
  if (!canSpeak) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = SPEECH_LANG[getLang()] || 'ko-KR'; u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.4, 0.8].forEach((d) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.3, ctx.currentTime + d);
      o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + 0.25);
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
      if (s === 0) { clearInterval(ref.current); beep(); speak(t('타이머가 끝났어요.')); }
    }, 500);
  };
  const stop = () => { clearInterval(ref.current); setLeft(null); };
  if (left === null) return <button className="btn small" onClick={start}>⏱ {t('{n}분 타이머', { n: minutes })}</button>;
  const mm = Math.floor(left / 60); const ss = String(left % 60).padStart(2, '0');
  return (
    <span className="timer" role="timer" aria-live="off">
      <b className={left === 0 ? 'done' : ''}>{left === 0 ? t('완료!') : `${mm}:${ss}`}</b>
      <button className="btn small ghost" onClick={stop}>{left === 0 ? t('닫기') : t('멈춤')}</button>
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
  if (!recipe) return <div className="card">{t('레시피를 찾을 수 없어요.')} <a href="#/recipes">{t('레시피 모음으로')}</a></div>;

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
    notify(missing.length ? t('없는 재료 {n}가지를 장보기 목록에 담았어요', { n: missing.length }) : t('필요한 재료가 모두 있어요'));
  };

  const stepSay = (i, text) => t('{n}단계. {text}', { n: i + 1, text: t(text) });
  const readAll = () => speak(`${t(recipe.title)}. ${recipe.steps.map((s, i) => stepSay(i, s[0])).join(' ')}`);

  return (
    <article className="stack recipe">
      <button className="btn ghost small no-print" onClick={() => history.back()}>← {t('뒤로')}</button>
      {PHOTOS[id] ? (
        <figure className="recipe-photo">
          <img src={`./photos/${id}.webp`} alt={t('{title} 예시 사진', { title: t(recipe.title) })} />
          <figcaption>{t('예시 사진')} · <a href={PHOTOS[id].page} target="_blank" rel="noopener noreferrer">{PHOTOS[id].artist || t('작성자 미상')}</a>, {PHOTOS[id].licenseUrl ? <a href={PHOTOS[id].licenseUrl} target="_blank" rel="noopener noreferrer">{PHOTOS[id].license}</a> : PHOTOS[id].license} (Wikimedia Commons)</figcaption>
        </figure>
      ) : <div className="recipe-hero" aria-hidden>{recipe.emoji}</div>}
      <div>
        {linked && <p className="muted">{fmtDate(date)} {t(MEAL_LABEL[meal])}</p>}
        <h1><span className="menu-no big" aria-label={t('메뉴 {n}번', { n: menuNo(recipe) })}>{menuNo(recipe)}</span>{t(recipe.title)}</h1>
        <div className="badges">
          <span className="badge">{t('난이도 {level}', { level: t(DIFFICULTY_LABEL[recipe.difficulty]) })}</span>
          <span className="badge">{t('준비 {prep}분 · 조리 {cook}분', { prep: recipe.prep, cook: recipe.cook })}</span>
          {recipe.soft && <span className="badge">{t('부드러움')}</span>}
          {recipe.tags.map((tag) => <span key={tag} className="badge light">{t(tag)}</span>)}
        </div>
      </div>
      {warnAllergy.length > 0 && <p className="warn">⚠️ {t('알레르기 성분이 들어 있어요:')} {warnAllergy.map((a) => t(a)).join(', ')}</p>}

      <div className="row wrap no-print">
        {/* 즐겨찾기·후보요리는 휴대폰에서도 한 줄에 나란히 */}
        <div className="pair-btns">
          <button className={`btn ${fav ? 'on' : 'ghost'}`} aria-pressed={fav} onClick={() => update('profile', (p) => ({ ...p, favorites: fav ? p.favorites.filter((x) => x !== id) : [...p.favorites, id] }))}>{fav ? `♥ ${t('즐겨찾기됨')}` : `♡ ${t('즐겨찾기')}`}</button>
          <MyTableButton id={id} />
        </div>
        {canSpeak && <button className="btn ghost" onClick={readAll}>🔊 {t('조리법 읽어 주기')}</button>}
        <button className="btn ghost" onClick={() => window.print()}>{t('인쇄')}</button>
        <button className="btn soft full-narrow" onClick={() => setSending(true)}>📤 {t('GPT로 보내기')}</button>
        {isSnack && <button className="btn full-narrow" onClick={() => { update('snacks', (x) => ({ ...x, [today()]: [...(x[today()] || []), { name: recipe.title, kcal: Math.round(n.kcal * servings) }] })); notify(t("오늘 간식에 '{title}'({kcal}kcal)을 기록했어요", { title: t(recipe.title), kcal: Math.round(n.kcal * servings) })); }}>🥛 {t('오늘 간식으로 기록')}</button>}
      </div>
      {sending && (
        <SendToGpt title={t('이 레시피 ChatGPT로 보내기')} onClose={() => setSending(false)}
          initialText={`${gptRecipePrompt()}\n\n${recipeText({ recipe, items, servings, nutrition: n, mealLabel: linked ? t(MEAL_LABEL[meal]) : '', dateLabel: linked ? fmtDate(date) : '' })}`} />
      )}

      <section className="card">
        <h2>{t('몇 인분 만들까요?')}</h2>
        <div className="seg" role="radiogroup" aria-label={t('인분')}>
          {[1, 2, 3, 4].map((s) => <button key={s} role="radio" aria-checked={servings === s} className={servings === s ? 'on' : ''} onClick={() => setServings(s)}>{t('{n}인분', { n: s })}</button>)}
        </div>
        {!linked && date === undefined && <p className="muted small">{t('식단에서 열면 인분·재료 변경이 식단과 장보기에 함께 반영돼요.')}</p>}
      </section>

      <section className="card">
        <h2>{t('재료 ({n}인분)', { n: servings })}</h2>
        {factor !== 1 && <p className="muted small">{factor < 1 ? t('목표 열량에 맞춰 밥·면 양을 줄였어요 (기본의 {p}%).', { p: Math.round(factor * 100) }) : t('목표 열량에 맞춰 밥·면 양을 늘렸어요 (기본의 {p}%).', { p: Math.round(factor * 100) })}</p>}
        <ul className="ingredients">
          {items.map((i) => {
            const ing = ING[i.id];
            const alts = recipe.subs[i.orig];
            const have = (state.pantry[i.id] || 0) >= i.g * servings;
            return (
              <li key={i.orig}>
                <div className="ing-row">
                  <span>{have && <span className="have" title={t('보유 중')}>✓ </span>}{t(ing.name)}</span>
                  <b>{formatAmount(i.id, i.g * servings)}</b>
                </div>
                {alts && (
                  <label className="sub-select">
                    <span className="muted small">{t('대체 재료')}</span>
                    <select value={i.id} onChange={(e) => setSub(i.orig, e.target.value)}>
                      {[i.orig, ...alts].map((a) => <option key={a} value={a}>{t(ING[a].name)}{a === i.orig ? ` (${t('기본')})` : ''}</option>)}
                    </select>
                  </label>
                )}
              </li>
            );
          })}
        </ul>
        {allergens.length > 0 && <p className="muted small">{t('알레르기 유발 성분:')} {allergens.map((a) => t(a)).join(', ')}</p>}
        <button className="btn no-print" onClick={addMissing}>🛒 {t('없는 재료만 장보기에 담기')}</button>
      </section>

      <section className="card">
        <h2>{t('1인분 영양정보')} <Estimate /></h2>
        <table className="ntable">
          <tbody>
            <tr><th>{t('열량')}</th><td>{round(n.kcal)} kcal</td><td className="muted">{isSnack ? t('간식 목표 {n}', { n: targets.snackKcal }) : t('목표 {n}', { n: round(mealKcal) })}</td></tr>
            <tr><th>{t('탄수화물')}</th><td>{round(n.carb)} g</td><td className="muted">{round(n.carb * 4 / n.kcal * 100)}%</td></tr>
            <tr><th>{t('단백질')}</th><td>{round(n.protein)} g</td><td className="muted">{round(n.protein * 4 / n.kcal * 100)}%</td></tr>
            <tr><th>{t('지방')}</th><td>{round(n.fat)} g</td><td className="muted">{round(n.fat * 9 / n.kcal * 100)}%</td></tr>
            <tr><th>{t('나트륨')}</th><td>{round(n.sodium)} mg</td><td className="muted">{t('하루 상한 {n}', { n: targets.sodium })}</td></tr>
            <tr><th>{t('예상 재료비')}</th><td>{won(n.cost)}</td><td className="muted">{t('{n}인분', { n: servings })} {won(n.cost * servings)}</td></tr>
          </tbody>
        </table>
        <p className="muted small">{t('영양정보: {src} (갱신 {date})', { src: t(NUTRITION_SOURCE.name), date: NUTRITION_SOURCE.updatedAt })}. {t('재료 중량 기준 계산값이며 실제와 다를 수 있습니다.')}</p>
      </section>

      <section className="card">
        <h2>{t('만드는 법')}</h2>
        <ol className="steps">
          {recipe.steps.map(([text, min], i) => (
            <li key={i}>
              <span className="step-n" aria-hidden>{i + 1}</span>
              <div className="step-body">
                <p>{t(text)}{min ? <span className="muted">{t(' (약 {min}분)', { min })}</span> : null}</p>
                <div className="row wrap no-print">
                  {canSpeak && <button className="btn small ghost" onClick={() => speak(stepSay(i, text))}>🔊 {t('읽기')}</button>}
                  {min ? <Timer minutes={min} /> : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
        {recipe.tip && <p className="notice">💡 {t(recipe.tip)}</p>}
        <p className="muted small">{t('출처:')} {t(recipe.source)}</p>
        {(recipe.isNew || recipe.isCustom || recipe.refs) && (
          <p className="small">{t('참고 자료:')} {recipeRefs(recipe).map((x, i) => <span key={x.url}>{i > 0 && ' · '}<a href={x.url} {...linkTarget()}>{t(x.label)}</a></span>)}</p>
        )}
      </section>

      <section className="card no-print">
        <h2><span aria-hidden>▶️</span> {t('유튜브 추천 영상')}</h2>
        <p className="muted small">{t('누르면 지금 창에서 유튜브 조리 영상이 열려요. 다 보신 뒤 ‘뒤로 가기’를 누르면 이 레시피로 돌아와요.')}</p>
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
        {linked && <button className="btn back-plan" onClick={() => go(`/plan?view=week&d=${date}`)}>{t('식단으로 돌아가기')}</button>}
      </div>
    </article>
  );
}
