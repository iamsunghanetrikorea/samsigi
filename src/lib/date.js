import { getLang } from '../i18n';

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
// 요일 짧은 이름 (언어별). WD[n]은 읽을 때마다 지금 언어로 돌려줌
const WD_BY_LANG = {
  ko: ['일', '월', '화', '수', '목', '금', '토'],
  zh: ['日', '一', '二', '三', '四', '五', '六'],
  ja: ['日', '月', '火', '水', '木', '金', '土'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
const WD_FULL = {
  ko: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  zh: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  ja: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
const wdList = () => WD_BY_LANG[getLang()] || WD_BY_LANG.ko;
export const WD = new Proxy(WD_BY_LANG.ko.slice(), {
  get(target, prop, recv) {
    if (typeof prop === 'string' && /^\d+$/.test(prop)) return wdList()[prop];
    return Reflect.get(target, prop, recv);
  },
});
// 요일 전체 이름 ('월요일' / 'Monday' …)
export const wdFull = (n) => (WD_FULL[getLang()] || WD_FULL.ko)[n];
export const weekday = (s) => parse(s).getDay();
const EN_MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// 월/일만 ('5월 3일' / '5月3日' / 'May 3')
export const fmtMD = (s) => {
  const d = parse(s); const m = d.getMonth() + 1; const day = d.getDate();
  const l = getLang();
  if (l === 'zh' || l === 'ja') return `${m}月${day}日`;
  if (l === 'en') return `${EN_MON[m - 1]} ${day}`;
  return `${m}월 ${day}일`;
};
export const fmtDate = (s) => {
  const d = parse(s); const w = wdList()[d.getDay()];
  const l = getLang();
  if (l === 'zh') return `${fmtMD(s)}（周${w}）`;
  if (l === 'ja') return `${fmtMD(s)}（${w}）`;
  if (l === 'en') return `${w}, ${fmtMD(s)}`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${w})`;
};
export const fmtMonth = (ym) => {
  const [y, m] = ym.split('-');
  const l = getLang();
  if (l === 'zh' || l === 'ja') return `${y}年${Number(m)}月`;
  if (l === 'en') return `${EN_MON[Number(m) - 1]} ${y}`;
  return `${y}년 ${Number(m)}월`;
};
