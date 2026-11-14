import { useState } from 'react';
import { ACTIVITY, bmr, maintenanceKcal, computeTargets, MEAL_KEYS, round } from '../lib/nutrition';
import { ALLERGENS } from '../data/ingredients';
import { PREFERENCE_TAGS, MEAL_LABEL } from '../data/recipes';
import { allowedRecipes } from '../lib/planner';
import { Seg } from './ui';

const num = (v) => (v === '' ? '' : Number(v));

export default function ProfileForm({ initial, onSave, submitLabel = '저장하기', short }) {
  const [p, setP] = useState(initial);
  const [exText, setExText] = useState((initial.exclusions || []).join(', '));
  const set = (patch) => setP((x) => ({ ...x, ...patch }));
  const toggle = (key, v) => set({ [key]: p[key].includes(v) ? p[key].filter((x) => x !== v) : [...p[key], v] });

  const valid = p.age >= 40 && p.age <= 110 && p.height >= 120 && p.height <= 210 && p.weight >= 30 && p.weight <= 200;
  const pctSum = Number(p.carbPct) + Number(p.proteinPct) + Number(p.fatPct);
  const splitSum = MEAL_KEYS.reduce((s, k) => s + Number(p.split[k] || 0), 0);
  const t = valid ? computeTargets(p) : null;
  const cond = p.conditions || {};
  const okCount = valid ? MEAL_KEYS.map((k) => allowedRecipes({ ...p, exclusions: parseEx(exText) }, k).length) : [];

  const submit = (e) => {
    e.preventDefault();
    if (!valid || pctSum !== 100 || splitSum !== 100) return;
    onSave({ ...p, exclusions: parseEx(exText) });
  };

  return (
    <form className="form stack" onSubmit={submit}>
      <fieldset className="card">
        <legend>기본 정보</legend>
        <p className="muted small">열량 추정에만 쓰이며, 이 기기에만 저장됩니다.</p>
        <div className="grid2">
          <label className="field"><span>나이 (세)</span><input type="number" inputMode="numeric" min={40} max={110} value={p.age} onChange={(e) => set({ age: num(e.target.value) })} required /></label>
          <div className="field"><span>성별 (열량 추정식 선택용)</span>
            <Seg label="성별" value={p.sex} onChange={(v) => set({ sex: v })} options={[{ value: 'female', label: '여성' }, { value: 'male', label: '남성' }]} />
          </div>
          <label className="field"><span>키 (cm)</span><input type="number" inputMode="decimal" min={120} max={210} value={p.height} onChange={(e) => set({ height: num(e.target.value) })} required /></label>
          <label className="field"><span>몸무게 (kg)</span><input type="number" inputMode="decimal" min={30} max={200} value={p.weight} onChange={(e) => set({ weight: num(e.target.value) })} required /></label>
        </div>
        {!valid && <p className="warn">나이(40~110세), 키(120~210cm), 몸무게(30~200kg)를 확인해 주세요.</p>}
        <label className="field"><span>평소 활동량</span>
          <select value={p.activity} onChange={(e) => set({ activity: e.target.value })}>
            {ACTIVITY.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
          </select>
        </label>
        <div className="field"><span>함께 식사하는 인원 (기본 인분)</span>
          <Seg label="인원" value={p.people} onChange={(v) => set({ people: v })} options={[1, 2, 3, 4].map((n) => ({ value: n, label: `${n}명` }))} />
        </div>
      </fieldset>

      <fieldset className="card">
        <legend>알레르기·못 드시는 음식</legend>
        <div className="field-label">알레르기 (해당 재료가 든 메뉴는 추천하지 않아요)</div>
        <div className="chips">
          {ALLERGENS.map((a) => <button type="button" key={a} className={`chip ${p.allergies.includes(a) ? 'on' : ''}`} aria-pressed={p.allergies.includes(a)} onClick={() => toggle('allergies', a)}>{a}</button>)}
        </div>
        <label className="field"><span>빼고 싶은 재료 (쉼표로 구분)</span><input value={exText} onChange={(e) => setExText(e.target.value)} placeholder="예: 가지, 고춧가루" /></label>
        <div className="field"><span>씹기·삼키기</span>
          <Seg label="씹기" value={p.chewing} onChange={(v) => set({ chewing: v })} options={[{ value: 'none', label: '불편 없음' }, { value: 'some', label: '조금 불편' }, { value: 'hard', label: '많이 불편' }]} />
          {p.chewing === 'hard' && <p className="muted small">부드러운 메뉴(죽·찜·국 등)만 추천합니다. 삼킴 곤란이 있으면 의료진·영양사 상담을 권합니다.</p>}
        </div>
      </fieldset>

      <fieldset className="card">
        <legend>요리 조건과 입맛</legend>
        <div className="grid2">
          <div className="field"><span>조리 난이도</span>
            <Seg label="난이도" value={p.difficulty} onChange={(v) => set({ difficulty: v })} options={[{ value: 1, label: '쉬운 것만' }, { value: 2, label: '보통까지' }, { value: 3, label: '상관없음' }]} />
          </div>
          <label className="field"><span>한 끼 조리 가능 시간: {p.cookTime}분</span>
            <input type="range" min={10} max={60} step={5} value={p.cookTime} onChange={(e) => set({ cookTime: Number(e.target.value) })} />
          </label>
          <label className="field"><span>1인 한 끼 식비 (원)</span><input type="number" inputMode="numeric" step={500} min={0} value={p.budget} onChange={(e) => set({ budget: num(e.target.value) })} /></label>
        </div>
        <div className="field-label">좋아하는 음식 (자주 추천해요)</div>
        <div className="chips">
          {PREFERENCE_TAGS.map((a) => <button type="button" key={a} className={`chip ${p.likes.includes(a) ? 'on' : ''}`} aria-pressed={p.likes.includes(a)} onClick={() => toggle('likes', a)}>{a}</button>)}
        </div>
        {valid && <p className={okCount.some((c) => c < 3) ? 'warn' : 'muted small'}>조건에 맞는 메뉴: {MEAL_KEYS.map((k, i) => `${MEAL_LABEL[k]} ${okCount[i]}개`).join(' · ')}</p>}
      </fieldset>

      <fieldset className="card">
        <legend>건강 상태 (선택)</legend>
        <p className="muted small">민감한 건강정보입니다. 이 기기에만 저장되고 외부로 전송되지 않으며, 언제든 삭제할 수 있습니다.</p>
        <label className="check big"><input type="checkbox" checked={!!p.conditionsConsent} onChange={(e) => set({ conditionsConsent: e.target.checked, conditions: e.target.checked ? cond : { diabetes: false, hypertension: false, kidney: false } })} /> 위 내용에 동의하고 건강 상태를 입력합니다</label>
        {p.conditionsConsent && (
          <div className="stack">
            {[['diabetes', '당뇨병 (탄수화물 과다 메뉴를 덜 추천)'], ['hypertension', '고혈압 (나트륨 기준을 더 엄격히 적용)'], ['kidney', '신장질환 (나트륨 엄격 적용)']].map(([k, label]) => (
              <label key={k} className="check big"><input type="checkbox" checked={!!cond[k]} onChange={(e) => set({ conditions: { ...cond, [k]: e.target.checked } })} /> {label}</label>
            ))}
            {(cond.kidney || cond.diabetes) && (
              <p className="notice">⚠️ {cond.kidney ? '신장질환은 단백질·칼륨·인 제한이 필요할 수 있어 반드시 주치의·임상영양사와 상담해 목표를 정해 주세요. ' : ''}{cond.diabetes ? '당뇨병 식사요법은 혈당 약과 함께 전문가 안내를 따라 주세요. ' : ''}이 앱의 수치는 의료적 식이처방이 아닙니다.</p>
            )}
          </div>
        )}
      </fieldset>

      {!short && t && (
        <fieldset className="card">
          <legend>영양 목표</legend>
          <p className="muted small">기초대사량(Mifflin–St Jeor) {round(bmr(p)).toLocaleString()}kcal × 활동계수 = 유지 열량 약 <b>{maintenanceKcal(p).toLocaleString()}kcal</b> (추정치)</p>
          <label className="field"><span>하루 목표 열량 (비우면 자동: {t.auto.toLocaleString()}kcal)</span>
            <input type="number" inputMode="numeric" min={1000} max={3500} step={50} value={p.targetKcal ?? ''} placeholder={String(t.auto)} onChange={(e) => set({ targetKcal: e.target.value === '' ? null : Number(e.target.value) })} />
          </label>
          <div className="grid3">
            <label className="field"><span>탄수화물 %</span><input type="number" min={20} max={70} value={p.carbPct} onChange={(e) => set({ carbPct: num(e.target.value) })} /></label>
            <label className="field"><span>단백질 %</span><input type="number" min={10} max={40} value={p.proteinPct} onChange={(e) => set({ proteinPct: num(e.target.value) })} /></label>
            <label className="field"><span>지방 %</span><input type="number" min={15} max={45} value={p.fatPct} onChange={(e) => set({ fatPct: num(e.target.value) })} /></label>
          </div>
          {pctSum !== 100 ? <p className="warn">비율 합계가 {pctSum}%입니다. 100%가 되도록 맞춰 주세요.</p> : (
            <p className="muted small">교차 검증: 탄수화물 {round(t.carb)}g×4 + 단백질 {round(t.protein)}g×4 + 지방 {round(t.fat)}g×9 = {round(t.carb * 4 + t.protein * 4 + t.fat * 9).toLocaleString()}kcal</p>
          )}
          <div className="grid2">
            <label className="field"><span>나트륨 하루 상한 (mg)</span><input type="number" step={100} min={1000} max={4000} value={p.sodium} onChange={(e) => set({ sodium: num(e.target.value) })} /></label>
            <label className="field"><span>간식·음료 열량 (kcal, 별도 관리)</span><input type="number" step={10} min={0} max={600} value={p.snackKcal} onChange={(e) => set({ snackKcal: num(e.target.value) })} /></label>
          </div>
          <div className="field-label">끼니별 열량 배분 (%)</div>
          <div className="grid3">
            {MEAL_KEYS.map((k) => (
              <label key={k} className="field"><span>{MEAL_LABEL[k]}</span><input type="number" min={10} max={60} value={p.split[k]} onChange={(e) => set({ split: { ...p.split, [k]: num(e.target.value) } })} /></label>
            ))}
          </div>
          {splitSum !== 100 && <p className="warn">끼니 배분 합계가 {splitSum}%입니다. 100%로 맞춰 주세요.</p>}
          <label className="field"><span>같은 주메뉴 반복 금지 기간: {p.repetitionWindow}일</span>
            <input type="range" min={1} max={6} value={p.repetitionWindow} onChange={(e) => set({ repetitionWindow: Number(e.target.value) })} />
          </label>
          <p className="muted small">나이만으로 일률적인 기준을 적용하지 않습니다. 체중 변화·건강 상태에 따라 목표를 조정해 주세요.</p>
        </fieldset>
      )}

      <button className="btn primary big" type="submit" disabled={!valid || pctSum !== 100 || splitSum !== 100}>{submitLabel}</button>
    </form>
  );
}

function parseEx(s) { return s.split(/[,，、\n]/).map((x) => x.trim()).filter(Boolean); }
