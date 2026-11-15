import { useRef, useState } from 'react';
import { useStore } from '../store';
import ProfileForm from '../components/ProfileForm';
import SyncPanel from '../components/SyncPanel';
import { Modal, Seg } from '../components/ui';
import { download } from '../lib/exporter';
import { today, WD } from '../lib/date';
import { RECIPE_BY_ID, MEAL_LABEL } from '../data/recipes';
import { NUTRITION_SOURCE } from '../data/ingredients';

export default function Settings() {
  const { state, update, notify, resetAll, replaceAll } = useStore();
  const [confirmDel, setConfirmDel] = useState(false);
  const fileRef = useRef(null);
  const s = state.settings;

  const exportJSON = () => {
    const data = { app: 'samsigi', version: 1, exportedAt: new Date().toISOString(), ...state };
    download(`건강한세끼_백업_${today()}.json`, JSON.stringify(data, null, 2), 'application/json');
  };
  const importJSON = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data.app !== 'samsigi' || !data.profile) throw new Error('형식 오류');
      replaceAll(data);
      notify('백업을 불러왔어요');
    } catch { notify('백업 파일을 읽을 수 없어요. 이 앱에서 내보낸 파일인지 확인해 주세요.'); }
    e.target.value = '';
  };

  return (
    <div className="stack">
      <h1>설정</h1>

      <section className="card stack">
        <h2>화면</h2>
        <div className="field"><span>글자 크기</span>
          <Seg label="글자 크기" value={s.fontSize} onChange={(v) => update('settings', { ...s, fontSize: v })} options={[18, 20, 22, 24, 26].map((n) => ({ value: n, label: { 18: '보통', 20: '크게', 22: '더크게', 24: '아주', 26: '최대' }[n] }))} />
        </div>
        <label className="check big"><input type="checkbox" checked={!!s.contrast} onChange={(e) => update('settings', { ...s, contrast: e.target.checked })} /> 고대비 모드 (글자를 더 진하게)</label>
      </section>

      <ProfileForm initial={state.profile} onSave={(p) => { update('profile', { ...p, completed: true }); notify('설정을 저장했어요. 새로 만드는 식단부터 반영돼요.'); }} submitLabel="프로필·목표 저장" />

      {state.profile.rules?.length > 0 && (
        <section className="card">
          <h2>매주 고정한 메뉴</h2>
          <ul className="plain">
            {state.profile.rules.map((r, i) => (
              <li key={i} className="row between"><span>{WD[r.weekday]}요일 {MEAL_LABEL[r.meal]} · {RECIPE_BY_ID[r.recipeId]?.title}</span>
                <button className="btn small ghost" onClick={() => update('profile', (p) => ({ ...p, rules: p.rules.filter((_, j) => j !== i) }))}>해제</button></li>
            ))}
          </ul>
        </section>
      )}

      <section className="card stack">
        <SyncPanel />
      </section>

      <section className="card stack">
        <h2>데이터 백업·삭제</h2>
        <p className="muted small">모든 정보는 이 기기(브라우저)에만 저장됩니다(레시피 동기화를 연결하면 직접 추가한 메뉴만 동기화 서버에도 저장돼요). 기기를 바꾸거나 브라우저 데이터를 지우기 전에 백업해 두세요.</p>
        <div className="row wrap">
          <button className="btn" onClick={exportJSON}>백업 파일 내보내기</button>
          <button className="btn ghost" onClick={() => fileRef.current?.click()}>백업 불러오기</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importJSON} />
        </div>
        {state.consent.location && <button className="btn ghost" onClick={() => update('consent', (c) => ({ ...c, location: false }))}>위치 정보 전송 동의 철회</button>}
        <button className="btn danger" onClick={() => setConfirmDel(true)}>모든 데이터 삭제</button>
      </section>

      <section className="card">
        <h2>데이터 출처</h2>
        <p className="small">{NUTRITION_SOURCE.name}</p>
        <p className="muted small">갱신일 {NUTRITION_SOURCE.updatedAt} · {NUTRITION_SOURCE.note}</p>
      </section>

      {confirmDel && (
        <Modal title="모든 데이터 삭제" onClose={() => setConfirmDel(false)}>
          <p>프로필, 건강 정보, 식단, 장보기, 저장한 식당이 <b>모두 지워지고 되돌릴 수 없습니다.</b></p>
          <div className="row">
            <button className="btn danger" onClick={async () => { await resetAll(); setConfirmDel(false); window.location.hash = '/'; }}>삭제하기</button>
            <button className="btn ghost" onClick={() => setConfirmDel(false)}>취소</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
