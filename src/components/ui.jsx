import { useEffect, useRef } from 'react';
import { NUTRIENTS, round } from '../lib/nutrition';

export function Modal({ title, onClose, children, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open'); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn ghost icon" onClick={onClose} aria-label="닫기">✕</button>
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
  const status = max ? (pct > 100 ? '초과' : '적정') : pct < 85 ? '부족' : pct > 115 ? '많음' : '적정';
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
        <NutrientBar key={n.key} label={n.label} unit={n.unit} max={n.max} value={totals[n.key]} target={n.key === 'sodium' ? targets.sodium : targets.meals[n.key]} />
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
  return <span className="est" title="식품성분표 기반 계산 추정치">추정치</span>;
}
