import { useEffect, useRef, useState } from 'react';
import { ACTIVITY, bmr, maintenanceKcal, computeTargets, MEAL_KEYS, round } from '../lib/nutrition';
import { ALLERGENS } from '../data/ingredients';
import { PREFERENCE_TAGS, MEAL_LABEL } from '../data/recipes';
import { allowedRecipes } from '../lib/planner';
import { Seg } from './ui';
import { t } from '../i18n';

const num = (v) => (v === '' ? '' : Number(v));

// wizard: 처음 설정용 단계별 화면(한 화면에 한 묶음, 언제든 '기본값으로 바로 시작' 가능)
export default function ProfileForm({ initial, onSave, submitLabel, short, wizard, initialStep = 0, initialExText, onDraft }) {
  const [p, setP] = useState(initial);
  const [exText, setExText] = useState(initialExText ?? (initial.exclusions || []).join(', '));
  const [step, setStep] = useState(initialStep);
  const top = useRef(null);
  // 입력하는 대로 임시 저장 → 중간에 나갔다 와도 이어서 입력
  useEffect(() => { onDraft?.({ p, exText, step }); }, [p, exText, step]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (patch) => setP((x) => ({ ...x, ...patch }));
  const toggle = (key, v) => set({ [key]: p[key].includes(v) ? p[key].filter((x) => x !== v) : [...p[key], v] });

  const valid = p.age >= 20 && p.age <= 110 && p.height >= 120 && p.height <= 210 && p.weight >= 30 && p.weight <= 200;
  const pctSum = Number(p.carbPct) + Number(p.proteinPct) + Number(p.fatPct);
  const splitSum = MEAL_KEYS.reduce((s, k) => s + Number(p.split[k] || 0), 0);
  const tg = valid ? computeTargets(p) : null;
  const cond = p.conditions || {};
  const okCount = valid ? MEAL_KEYS.map((k) => allowedRecipes({ ...p, exclusions: parseEx(exText) }, k).filter((r) => !r.noAuto).length) : [];

  const blocker = !valid ? t('나이(20~110세), 키(120~210cm), 몸무게(30~200kg)를 확인해 주세요.')
    : pctSum !== 100 ? t('영양 비율 합계가 {n}%예요. 100%로 맞춰 주세요.', { n: pctSum })
    : splitSum !== 100 ? t('끼니 배분 합계가 {n}%예요. 100%로 맞춰 주세요.', { n: splitSum }) : null;
  const finish = () => { if (!blocker) onSave({ ...p, exclusions: parseEx(exText) }); };
  const submit = (e) => { e.preventDefault(); finish(); };
  const go = (n) => { setStep(n); setTimeout(() => top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0); };

  const sections = [
      <fieldset className="card" key="basic">
        <legend>{t('기본 정보')}</legend>
        <p className="muted small">{t('열량 추정에만 쓰이며, 이 기기에만 저장됩니다.')}</p>
        <label className="field"><span>{t('부르실 이름 (선택)')}</span><input value={p.name || ''} maxLength={20} onChange={(e) => set({ name: e.target.value })} placeholder={t('예: 홍길동')} /></label>
        <div className="grid2">
          <label className="field"><span>{t('나이 (세)')}</span><input type="number" inputMode="numeric" min={20} max={110} value={p.age} onChange={(e) => set({ age: num(e.target.value) })} required /></label>
          <div className="field"><span>{t('성별 (열량 추정식 선택용)')}</span>
            <Seg label={t('성별')} value={p.sex} onChange={(v) => set({ sex: v })} options={[{ value: 'female', label: t('여성') }, { value: 'male', label: t('남성') }]} />
          </div>
          <label className="field"><span>{t('키 (cm)')}</span><input type="number" inputMode="decimal" min={120} max={210} value={p.height} onChange={(e) => set({ height: num(e.target.value) })} required /></label>
          <label className="field"><span>{t('몸무게 (kg)')}</span><input type="number" inputMode="decimal" min={30} max={200} value={p.weight} onChange={(e) => set({ weight: num(e.target.value) })} required /></label>
        </div>
        <label className="field"><span>{t('평소 활동량')}</span>
          <select value={p.activity} onChange={(e) => set({ activity: e.target.value })}>
            {ACTIVITY.map((a) => <option key={a.key} value={a.key}>{t(a.label)}</option>)}
          </select>
        </label>
        <div className="field"><span>{t('함께 식사하는 인원 (기본 인분)')}</span>
          <Seg label={t('인원')} value={p.people} onChange={(v) => set({ people: v })} options={[1, 2, 3, 4].map((n) => ({ value: n, label: t('{n}명', { n }) }))} />
        </div>
      </fieldset>,

      <fieldset className="card" key="allergy">
        <legend>{t('알레르기·못 드시는 음식')}</legend>
        <div className="field-label">{t('알레르기 (해당 재료가 든 메뉴는 추천하지 않아요)')}</div>
        <div className="chips">
          {ALLERGENS.map((a) => <button type="button" key={a} className={`chip ${p.allergies.includes(a) ? 'on' : ''}`} aria-pressed={p.allergies.includes(a)} onClick={() => toggle('allergies', a)}>{t(a)}</button>)}
        </div>
        <label className="field"><span>{t('빼고 싶은 재료 (쉼표로 구분)')}</span><input value={exText} onChange={(e) => setExText(e.target.value)} placeholder={t('예: 가지, 고춧가루')} /></label>
        <div className="field"><span>{t('씹기·삼키기')}</span>
          <Seg label={t('씹기')} value={p.chewing} onChange={(v) => set({ chewing: v })} options={[{ value: 'none', label: t('불편 없음') }, { value: 'some', label: t('조금 불편') }, { value: 'hard', label: t('많이 불편') }]} />
          {p.chewing === 'hard' && <p className="muted small">{t('부드러운 메뉴(죽·찜·국 등)만 추천합니다. 삼킴 곤란이 있으면 의료진·영양사 상담을 권합니다.')}</p>}
        </div>
      </fieldset>,

      <fieldset className="card" key="cook">
        <legend>{t('요리 조건과 입맛')}</legend>
        <div className="grid2">
          <div className="field"><span>{t('조리 난이도')}</span>
            <Seg label={t('난이도')} value={p.difficulty} onChange={(v) => set({ difficulty: v })} options={[{ value: 1, label: t('쉬운 것만') }, { value: 2, label: t('보통까지') }, { value: 3, label: t('상관없음') }]} />
          </div>
          <label className="field"><span>{t('한 끼 조리 가능 시간: {n}분', { n: p.cookTime })}</span>
            <input type="range" min={10} max={60} step={5} value={p.cookTime} onChange={(e) => set({ cookTime: Number(e.target.value) })} />
          </label>
          <label className="field"><span>{t('1인 한 끼 식비 (원)')}</span><input type="number" inputMode="numeric" step={500} min={0} value={p.budget} onChange={(e) => set({ budget: num(e.target.value) })} /></label>
        </div>
        <div className="field-label">{t('좋아하는 음식 (자주 추천해요)')}</div>
        <div className="chips">
          {PREFERENCE_TAGS.map((a) => <button type="button" key={a} className={`chip ${p.likes.includes(a) ? 'on' : ''}`} aria-pressed={p.likes.includes(a)} onClick={() => toggle('likes', a)}>{t(a)}</button>)}
        </div>
        {valid && <p className={okCount.some((c) => c < 3) ? 'warn' : 'muted small'}>{t('조건에 맞는 메뉴:')} {MEAL_KEYS.map((k, i) => t('{meal} {n}개', { meal: t(MEAL_LABEL[k]), n: okCount[i] })).join(' · ')}</p>}
      </fieldset>,

      <fieldset className="card" key="health">
        <legend>{t('건강 상태 (선택)')}</legend>
        <p className="muted small">{t('민감한 건강정보입니다. 이 기기에만 저장되고 외부로 전송되지 않으며, 언제든 삭제할 수 있습니다.')}</p>
        <label className="check big"><input type="checkbox" checked={!!p.conditionsConsent} onChange={(e) => set({ conditionsConsent: e.target.checked, conditions: e.target.checked ? cond : { diabetes: false, hypertension: false, kidney: false } })} /> {t('위 내용에 동의하고 건강 상태를 입력합니다')}</label>
        {p.conditionsConsent && (
          <div className="stack">
            {[['diabetes', '당뇨병 (탄수화물 과다 메뉴를 덜 추천)'], ['hypertension', '고혈압 (나트륨 기준을 더 엄격히 적용)'], ['kidney', '신장질환 (나트륨 엄격 적용)']].map(([k, label]) => (
              <label key={k} className="check big"><input type="checkbox" checked={!!cond[k]} onChange={(e) => set({ conditions: { ...cond, [k]: e.target.checked } })} /> {t(label)}</label>
            ))}
            {(cond.kidney || cond.diabetes) && (
              <p className="notice">⚠️ {cond.kidney ? t('신장질환은 단백질·칼륨·인 제한이 필요할 수 있어 반드시 주치의·임상영양사와 상담해 목표를 정해 주세요.') + ' ' : ''}{cond.diabetes ? t('당뇨병 식사요법은 혈당 약과 함께 전문가 안내를 따라 주세요.') + ' ' : ''}{t('이 앱의 수치는 의료적 식이처방이 아닙니다.')}</p>
            )}
          </div>
        )}
      </fieldset>,

      !short && tg && (
        <fieldset className="card" key="goals">
          <legend>{t('영양 목표')}</legend>
          <p className="muted small">{t('기초대사량(Mifflin–St Jeor) {a}kcal × 활동계수 = 유지 열량 약', { a: round(bmr(p)).toLocaleString() })} <b>{maintenanceKcal(p).toLocaleString()}kcal</b> ({t('추정치')})</p>
          <label className="field"><span>{t('하루 목표 열량 (비우면 자동: {n}kcal)', { n: tg.auto.toLocaleString() })}</span>
            <input type="number" inputMode="numeric" min={1000} max={3500} step={50} value={p.targetKcal ?? ''} placeholder={String(tg.auto)} onChange={(e) => set({ targetKcal: e.target.value === '' ? null : Number(e.target.value) })} />
          </label>
          <div className="grid3">
            <label className="field"><span>{t('탄수화물')} %</span><input type="number" min={20} max={70} value={p.carbPct} onChange={(e) => set({ carbPct: num(e.target.value) })} /></label>
            <label className="field"><span>{t('단백질')} %</span><input type="number" min={10} max={40} value={p.proteinPct} onChange={(e) => set({ proteinPct: num(e.target.value) })} /></label>
            <label className="field"><span>{t('지방')} %</span><input type="number" min={15} max={45} value={p.fatPct} onChange={(e) => set({ fatPct: num(e.target.value) })} /></label>
          </div>
          {pctSum !== 100 ? <p className="warn">{t('비율 합계가 {n}%입니다. 100%가 되도록 맞춰 주세요.', { n: pctSum })}</p> : (
            <p className="muted small">{t('교차 검증: 탄수화물 {c}g×4 + 단백질 {p}g×4 + 지방 {f}g×9 = {k}kcal', { c: round(tg.carb), p: round(tg.protein), f: round(tg.fat), k: round(tg.carb * 4 + tg.protein * 4 + tg.fat * 9).toLocaleString() })}</p>
          )}
          <div className="grid2">
            <label className="field"><span>{t('나트륨 하루 상한 (mg)')}</span><input type="number" step={100} min={1000} max={4000} value={p.sodium} onChange={(e) => set({ sodium: num(e.target.value) })} /></label>
            <label className="field"><span>{t('간식·음료 열량 (kcal, 별도 관리)')}</span><input type="number" step={10} min={0} max={600} value={p.snackKcal} onChange={(e) => set({ snackKcal: num(e.target.value) })} /></label>
          </div>
          <div className="field-label">{t('끼니별 열량 배분 (%)')}</div>
          <div className="grid3">
            {MEAL_KEYS.map((k) => (
              <label key={k} className="field"><span>{t(MEAL_LABEL[k])}</span><input type="number" min={10} max={60} value={p.split[k]} onChange={(e) => set({ split: { ...p.split, [k]: num(e.target.value) } })} /></label>
            ))}
          </div>
          {splitSum !== 100 && <p className="warn">{t('끼니 배분 합계가 {n}%입니다. 100%로 맞춰 주세요.', { n: splitSum })}</p>}
          <label className="field"><span>{t('같은 주메뉴 반복 금지 기간: {n}일', { n: p.repetitionWindow })}</span>
            <input type="range" min={1} max={6} value={p.repetitionWindow} onChange={(e) => set({ repetitionWindow: Number(e.target.value) })} />
          </label>
          <p className="muted small">{t('나이만으로 일률적인 기준을 적용하지 않습니다. 체중 변화·건강 상태에 따라 목표를 조정해 주세요.')}</p>
        </fieldset>
      ),
  ].filter(Boolean);

  if (!wizard) {
    return (
      <form className="form stack" onSubmit={submit}>
        {sections}
        {blocker && <p className="warn">{blocker}</p>}
        <button className="btn primary big" type="submit" disabled={!!blocker}>{submitLabel || t('저장하기')}</button>
      </form>
    );
  }

  const last = sections.length - 1;
  const cur = Math.min(step, last);
  const titles = ['기본 정보', '알레르기·못 드시는 음식', '요리 조건과 입맛', '건강 상태'];
  return (
    <form className="form stack" onSubmit={(e) => { e.preventDefault(); if (cur < last) { if (!blocker) go(cur + 1); } else finish(); }}>
      <div className="wiz-head" ref={top}>
        <div className="wiz-steps" aria-hidden>
          {sections.map((_, i) => <span key={i} className={i < cur ? 'done' : i === cur ? 'now' : ''} />)}
        </div>
        <p className="wiz-label"><b>{t('{a} / {b} 단계', { a: cur + 1, b: sections.length })}</b> · {t(titles[cur])}{cur > 0 && ` ${t('(건너뛰어도 돼요)')}`}</p>
      </div>
      {sections[cur]}
      {blocker && <p className="warn" role="alert">{blocker}</p>}
      <div className="wiz-nav">
        {cur > 0 && <button type="button" className="btn ghost" onClick={() => go(cur - 1)}>← {t('이전')}</button>}
        {cur < last
          ? <button type="submit" className="btn primary big" disabled={!!blocker}>{t('다음')} →</button>
          : <button type="submit" className="btn primary big" disabled={!!blocker}>{submitLabel || t('저장하기')}</button>}
      </div>
      {cur < last && (
        <button type="button" className="btn soft wiz-skip" onClick={finish} disabled={!!blocker}>
          {t('나머지는 기본값으로 바로 시작하기')}
        </button>
      )}
      {cur < last && <p className="muted small center">{t('나머지 항목은 나중에 ‘내 정보’에서 언제든 바꿀 수 있어요.')}</p>}
    </form>
  );
}

function parseEx(s) { return s.split(/[,，、\n]/).map((x) => x.trim()).filter(Boolean); }
