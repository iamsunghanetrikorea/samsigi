import { useState } from 'react';
import { useStore } from '../store';
import { createCode, fetchDoc, normCode, fmtCode } from '../lib/sync';

const timeAgo = (t) => {
  if (!t) return '';
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return '방금';
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  return new Date(t).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

// 다른 기기와 '내가 추가한 메뉴'를 동기화 코드로 자동으로 맞춤
export default function SyncPanel() {
  const { state, connectSync, disconnectSync, runSync, notify } = useStore();
  const { sync } = state;
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      const code = await createCode();
      const err = await connectSync(code);
      notify(err ? `동기화 오류: ${err}` : '동기화 코드를 만들었어요. 다른 기기에서 이 코드를 넣어 주세요.');
    } catch (e) {
      notify(`코드를 만들지 못했어요: ${e.message}`);
    } finally { setBusy(false); }
  };
  const join = async (e) => {
    e.preventDefault();
    const code = normCode(input);
    if (code.length !== 10) { notify('동기화 코드 10자리를 입력해 주세요'); return; }
    setBusy(true);
    try {
      await fetchDoc(code); // 있는 코드인지 먼저 확인
      const err = await connectSync(code);
      if (err) notify(`동기화 오류: ${err}`);
      else { notify('연결했어요. 두 기기의 레시피를 합쳤어요.'); setInput(''); }
    } catch (e2) {
      notify(e2.status === 404 ? '없는 동기화 코드예요. 다시 확인해 주세요.' : `연결하지 못했어요: ${e2.message}`);
    } finally { setBusy(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(fmtCode(sync.code)); notify('코드를 복사했어요'); } catch { notify('복사하지 못했어요. 코드를 직접 적어 주세요.'); }
  };
  const now = async () => { setBusy(true); await runSync(); setBusy(false); };

  if (!sync.code) {
    return (
      <div className="sync-panel">
        <h3>📱 다른 기기와 레시피 맞추기</h3>
        <p className="muted small">동기화 코드로 연결하면 ‘내가 추가한 메뉴’가 휴대폰·태블릿·컴퓨터에서 자동으로 똑같이 보여요. 레시피만 보내고 프로필·건강 정보·식단은 보내지 않아요.</p>
        <button type="button" className="btn primary" onClick={start} disabled={busy}>{busy ? '만드는 중…' : '새 동기화 코드 만들기'}</button>
        <form className="row wrap" onSubmit={join}>
          <input aria-label="다른 기기의 동기화 코드" placeholder="다른 기기의 코드 (예: ABCDE-23456)" value={input} onChange={(e) => setInput(e.target.value)} autoCapitalize="characters" autoComplete="off" spellCheck={false} style={{ flex: '1 1 12rem' }} />
          <button type="submit" className="btn" disabled={busy}>연결</button>
        </form>
      </div>
    );
  }

  return (
    <div className="sync-panel">
      <h3>📱 다른 기기와 레시피 맞추기 <span className="sync-on">연결됨</span></h3>
      <div className="row wrap">
        <span className="sync-code" aria-label="동기화 코드">{fmtCode(sync.code)}</span>
        <button type="button" className="btn small ghost" onClick={copy}>코드 복사</button>
      </div>
      <p className="muted small">다른 기기의 ‘레시피 → 추천 메뉴 입력’ 또는 ‘설정’에서 이 코드를 넣으면 연결돼요. 코드를 아는 사람은 내 레시피를 볼 수 있으니 가족끼리만 나눠 주세요.</p>
      <p className="small" role="status">
        {sync.error ? <span className="bad-text">⚠️ {sync.error}</span> : sync.dirty ? '보내는 중…' : sync.lastSync ? `✓ ${timeAgo(sync.lastSync)} 맞춤 · 레시피 ${state.customRecipes.length}개` : '맞추는 중…'}
      </p>
      <div className="row wrap">
        <button type="button" className="btn small" onClick={now} disabled={busy}>지금 맞추기</button>
        {!confirmOff
          ? <button type="button" className="btn small ghost" onClick={() => setConfirmOff(true)}>연결 끊기</button>
          : (
            <>
              <span className="small">이 기기만 연결을 끊어요. 레시피는 남아요.</span>
              <button type="button" className="btn small danger" onClick={() => { disconnectSync(); setConfirmOff(false); notify('이 기기의 동기화 연결을 끊었어요'); }}>끊기</button>
              <button type="button" className="btn small ghost" onClick={() => setConfirmOff(false)}>취소</button>
            </>
          )}
      </div>
    </div>
  );
}
