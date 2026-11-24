import { useRef, useState } from 'react';
import { useStore } from '../store';
import { t, getLang } from '../i18n';

// 말로 입력 (Web Speech API — 크롬·사파리 등 지원 브라우저에서만)
const Speech = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const SPEECH_LANG = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN' };

// 마이크를 눌러 말하면 들은 말을 onText로 넘김 (다시 누르면 멈춤)
export function useSpeech(onText) {
  const { notify } = useStore();
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const toggle = () => {
    if (!Speech) { notify(t('이 기기·브라우저는 음성 입력을 지원하지 않아요')); return; }
    if (listening) { recRef.current?.stop(); return; }
    const rec = new Speech();
    rec.lang = SPEECH_LANG[getLang()] || 'ko-KR';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => { const said = e.results[0]?.[0]?.transcript?.trim().replace(/[.。!?]$/, ''); if (said) onText(said); };
    rec.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') notify(t('마이크 사용을 허용해 주세요')); };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
  };
  return { listening, toggle };
}

// 마이크 버튼 (식당 찾기의 큰 마이크, 메뉴 추가 칸의 작은 마이크 모두 같은 모양)
export function MicButton({ listening, onClick, className = 'mic-btn' }) {
  return (
    <button type="button" className={`${className} ${listening ? 'on' : ''}`} onClick={onClick} aria-pressed={listening}
      aria-label={listening ? t('음성 입력 멈추기') : t('말로 입력하기')} title={listening ? t('음성 입력 멈추기') : t('말로 입력하기')}>
      <svg viewBox="4.6 1.6 14.8 19.8" aria-hidden><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" /></svg>
    </button>
  );
}
