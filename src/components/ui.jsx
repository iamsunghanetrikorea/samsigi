import { useEffect, useRef } from 'react';
import { NUTRIENTS, round } from '../lib/nutrition';
import { t } from '../i18n';

// 모달이 겹쳐 열릴 때 Esc는 맨 위 모달만 닫음
const modalStack = [];

export function Modal({ title, onClose, children, wide }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement;
    const token = {};
    modalStack.push(token);
    ref.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape' && modalStack[modalStack.length - 1] === token) closeRef.current(); };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      modalStack.splice(modalStack.indexOf(token), 1);
      if (!modalStack.length) document.body.classList.remove('modal-open');
      prev?.focus?.();
    };
  }, []);
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn ghost icon" onClick={onClose} aria-label={t('닫기')}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// 목표 대비 막대 — 나트륨은 '상한' 개념
export function NutrientBar({ label, value, target, unit, max }) {
  const pct = target ? (value / target) * 100 : 0;
  let tone = 'ok';
  if (max) tone = pct > 100 ? 'bad' : 'ok';
  else if (pct < 85) tone = 'low';
  else if (pct > 115) tone = 'high';
  const status = t(max ? (pct > 100 ? '초과' : '적정') : pct < 85 ? '부족' : pct > 115 ? '많음' : '적정');
  return (
    <div className="nbar">
      <div className="nbar-label">
        <span>{label}</span>
        <span><b>{round(value).toLocaleString()}</b> / {round(target).toLocaleString()}{unit} <em className={`tag ${tone}`}>{status}</em></span>
      </div>
      <div className="nbar-track" role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`nbar-fill ${tone}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        {max ? null : <div className="nbar-mark" />}
      </div>
    </div>
  );
}

export function NutrientBars({ totals, targets, keys }) {
  return (
    <div className="nbars">
      {NUTRIENTS.filter((n) => !keys || keys.includes(n.key)).map((n) => (
        <NutrientBar key={n.key} label={t(n.label)} unit={n.unit} max={n.max} value={totals[n.key]} target={n.key === 'sodium' ? targets.sodium : targets.meals[n.key]} />
      ))}
    </div>
  );
}

export function Seg({ value, options, onChange, label }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Estimate() {
  return <span className="est" title={t('식품성분표 기반 계산 추정치')}>{t('추정치')}</span>;
}

// 사진을 길게 누르면(0.6초) onLong 실행. 길게 누른 뒤 손을 떼며 생기는 클릭은 무시.
// 키보드: Delete·Backspace 키로도 같은 동작.
let lastLong = 0; // 화면이 다시 그려져도 '길게 누른 직후 클릭'을 막도록 바깥에 둠
export function longPress(onLong, ms = 600) {
  let timer = null;
  let start = null;
  const cancel = () => { clearTimeout(timer); timer = null; };
  return {
    onPointerDown: (e) => {
      if (e.button > 0) return;
      start = [e.clientX, e.clientY];
      cancel();
      timer = setTimeout(() => { timer = null; lastLong = Date.now(); navigator.vibrate?.(30); onLong(); lastLong = Date.now(); }, ms);
    },
    onPointerMove: (e) => { if (start && Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 10) cancel(); },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e) => e.preventDefault(),
    onClickCapture: (e) => { if (Date.now() - lastLong < 1500) { e.preventDefault(); e.stopPropagation(); lastLong = 0; } },
    onKeyDown: (e) => { if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); onLong(); } },
  };
}
