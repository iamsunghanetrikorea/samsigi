import { useStore } from '../store';
import { ING } from '../data/ingredients';
import { EXTRA_BY, shortName } from '../lib/market';
import { googleAiUrl, breakfastAiPrompt, copyText } from '../lib/share';

// 인공지능 레시피추천: 구글 AI 모드가 인터넷을 찾아 아침 재료·메뉴를 추천 (같은 창, 뒤로 가기로 돌아옴)
// 장보기에서 골라 둔 재료가 있으면 질문에 함께 넣음
export default function AiBreakfast() {
  const { state } = useStore();
  const m = state.market || { picked: [], custom: [] };
  const names = m.picked.map((id) => (ING[id] ? shortName(ING[id].name) : EXTRA_BY[id]?.name || m.custom.find((c) => c.id === id)?.name)).filter(Boolean);
  const ask = async () => {
    const q = breakfastAiPrompt(names);
    await copyText(q);
    window.location.assign(googleAiUrl(q));
  };
  return (
    <section className="card ai-box no-print" aria-labelledby="ai-h">
      <h2 id="ai-h">🤖 인공지능 레시피추천</h2>
      <p className="muted small">{names.length ? `장보기에서 고른 재료(${names.join(', ')})로` : '재료를 고르지 않아도'} 아침에 가볍게 먹을 재료와 메뉴를 3~4가지씩, 구글 AI가 인터넷 정보를 찾아 추천해 드려요.</p>
      <button type="button" className="btn ai-btn" onClick={ask}>🤖 인공지능 레시피추천</button>
    </section>
  );
}
