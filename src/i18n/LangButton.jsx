import { FLAGS } from './flags';
import { LANG_NAMES, nextLang } from './index';

// 헤더 언어 버튼: 지금 언어의 국기·이름, 누를 때마다 한국어 → 中文 → 日本語 → English → 한국어
export default function LangButton({ lang, onChange }) {
  const order = ['ko', 'zh', 'ja', 'en'].map((l) => LANG_NAMES[l]).join(' → ');
  return (
    <button type="button" className="lang-btn" onClick={() => onChange(nextLang(lang))} title={`Language: ${order}`} aria-label={`Language: ${LANG_NAMES[lang]}`}>
      {FLAGS[lang]}
      <span className="nm">{LANG_NAMES[lang]}</span>
    </button>
  );
}
