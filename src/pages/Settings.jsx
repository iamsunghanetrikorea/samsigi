import { useRef, useState } from 'react';
import { useStore } from '../store';
import ProfileForm from '../components/ProfileForm';
import { Modal, Seg } from '../components/ui';
import { download } from '../lib/exporter';
import { today, wdFull } from '../lib/date';
import { t, getLang } from '../i18n';
import { RECIPE_BY_ID, MEAL_LABEL } from '../data/recipes';
import { NUTRITION_SOURCE } from '../data/ingredients';

export default function Settings() {
  const { state, update, notify, resetAll, replaceAll } = useStore();
  const [confirmDel, setConfirmDel] = useState(false);
  const fileRef = useRef(null);
  const s = state.settings;

  const exportJSON = () => {
    const data = { app: 'samsigi', version: 1, exportedAt: new Date().toISOString(), ...state };
    download(`삼식이家_레시피백업_${today()}.json`, JSON.stringify(data, null, 2), 'application/json');
    notify(t('지금 저장된 레시피·식단을 백업 파일로 저장했어요'));
  };
  const importJSON = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data.app !== 'samsigi' || !data.profile) throw new Error('형식 오류');
      replaceAll(data);
      notify(t('백업레시피를 불러왔어요'));
    } catch { notify(t('백업 파일을 읽을 수 없어요. 이 앱에서 내보낸 파일인지 확인해 주세요.')); }
    e.target.value = '';
  };

  return (
    <div className="stack">
      <h1>{t('설정')}</h1>

      <section className="card stack">
        <h2>{t('화면')}</h2>
        <div className="field"><span>{t('글자 크기')}</span>
          <Seg label={t('글자 크기')} value={s.fontSize} onChange={(v) => update('settings', { ...s, fontSize: v })} options={[18, 20, 22, 24, 26].map((n) => ({ value: n, label: getLang() === 'ko' ? { 18: '보통', 20: '크게', 22: '더크게', 24: '아주', 26: '최대' }[n] : String(n) }))} />
        </div>
        <label className="check big"><input type="checkbox" checked={!!s.contrast} onChange={(e) => update('settings', { ...s, contrast: e.target.checked })} /> {t('고대비 모드 (글자를 더 진하게)')}</label>
      </section>

      <ProfileForm initial={state.profile} onSave={(p) => { update('profile', { ...p, completed: true }); notify(t('설정을 저장했어요. 새로 만드는 식단부터 반영돼요.')); }} submitLabel={t('프로필·목표 저장')} />

      {state.profile.rules?.length > 0 && (
        <section className="card">
          <h2>{t('매주 고정한 메뉴')}</h2>
          <ul className="plain">
            {state.profile.rules.map((r, i) => (
              <li key={i} className="row between"><span>{wdFull(r.weekday)} {t(MEAL_LABEL[r.meal])} · {t(RECIPE_BY_ID[r.recipeId]?.title)}</span>
                <button className="btn small ghost" onClick={() => update('profile', (p) => ({ ...p, rules: p.rules.filter((_, j) => j !== i) }))}>{t('해제')}</button></li>
            ))}
          </ul>
        </section>
      )}

      <section className="card stack">
        <h2>{t('데이터 백업·삭제')}</h2>
        <p className="muted small">{t('모든 정보는 이 기기(브라우저)에만 저장됩니다. 기기를 바꾸거나 브라우저 데이터를 지우기 전에 백업해 두세요.')}</p>
        <div className="row wrap">
          <button className="btn" onClick={exportJSON}>{t('레시피백업파일 저장하기')}</button>
          <button className="btn ghost" onClick={() => fileRef.current?.click()}>{t('백업레시피 불러오기')}</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importJSON} />
        </div>
        {state.consent.location && <button className="btn ghost" onClick={() => update('consent', (c) => ({ ...c, location: false }))}>{t('위치 정보 전송 동의 철회')}</button>}
        <button className="btn danger" onClick={() => setConfirmDel(true)}>{t('모든 데이터 삭제')}</button>
      </section>

      <section className="card">
        <h2>{t('데이터 출처')}</h2>
        <p className="small">{t(NUTRITION_SOURCE.name)}</p>
        <p className="muted small">{t('갱신일')} {NUTRITION_SOURCE.updatedAt} · {t(NUTRITION_SOURCE.note)}</p>
      </section>

      {confirmDel && (
        <Modal title={t('모든 데이터 삭제')} onClose={() => setConfirmDel(false)}>
          <p>{t('프로필, 건강 정보, 식단, 장보기, 저장한 식당이')} <b>{t('모두 지워지고 되돌릴 수 없습니다.')}</b></p>
          <div className="row">
            <button className="btn danger" onClick={async () => { await resetAll(); setConfirmDel(false); window.location.hash = '/'; }}>{t('삭제하기')}</button>
            <button className="btn ghost" onClick={() => setConfirmDel(false)}>{t('취소')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
