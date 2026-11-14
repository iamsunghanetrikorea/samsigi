// 날짜 유틸 — 모두 로컬 시간 'YYYY-MM-DD' 문자열 사용 (시간대 문제 방지)
export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const today = () => ymd(new Date());
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
export const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
export const weekStart = (s) => { const d = parse(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ymd(d); };
export const weekDates = (s) => { const st = weekStart(s); return Array.from({ length: 7 }, (_, i) => addDays(st, i)); };
export const monthKey = (s) => s.slice(0, 7);
export const addMonths = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
export const daysInMonth = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); };
export const monthDates = (ym) => Array.from({ length: daysInMonth(ym) }, (_, i) => `${ym}-${pad(i + 1)}`);
export const rangeDates = (a, b) => { const out = []; for (let d = a; d <= b; d = addDays(d, 1)) out.push(d); return out; };
export const WD = ['일', '월', '화', '수', '목', '금', '토'];
export const weekday = (s) => parse(s).getDay();
export const fmtDate = (s) => { const d = parse(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]})`; };
export const fmtMonth = (ym) => { const [y, m] = ym.split('-'); return `${y}년 ${Number(m)}월`; };
