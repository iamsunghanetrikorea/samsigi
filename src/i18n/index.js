// 다국어: 한국어 원문을 열쇠로 쓰는 사전. t('한국어 문장') → 지금 언어의 문장 (없으면 한국어 그대로)
// 변수는 {이름} 자리표시로: t('{n}가지를 담았어요', { n: 3 })
// 사전은 ./dict/*.js 파일마다 { '한국어': { zh, ja, en } } 꼴로 나눠 둠 (자동으로 모두 합침)

export const LANGS = ['ko', 'zh', 'ja', 'en'];
export const LANG_NAMES = { ko: '한국어', zh: '中文', ja: '日本語', en: 'English' };
export const HTML_LANG = { ko: 'ko', zh: 'zh-CN', ja: 'ja', en: 'en' };

const DICT = {};
const mods = import.meta.glob('./dict/*.js', { eager: true });
for (const m of Object.values(mods)) Object.assign(DICT, m.default || {});

let cur = 'ko';
export function getLang() { return cur; }
export function setLang(l) {
  cur = LANGS.includes(l) ? l : 'ko';
  if (typeof document !== 'undefined') document.documentElement.lang = HTML_LANG[cur];
}
export function nextLang(l) { return LANGS[(LANGS.indexOf(l) + 1) % LANGS.length]; }

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m)) : s);

export function t(ko, vars) {
  if (ko == null || ko === '') return ko;
  const s = String(ko);
  if (cur === 'ko') return fill(s, vars);
  const e = DICT[s];
  return fill((e && e[cur]) || s, vars);
}

// 사전에 있는지 (테스트·점검용)
export function hasT(ko, lang) { return !!DICT[ko]?.[lang]; }
export function allKeys() { return Object.keys(DICT); }
