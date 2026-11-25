import { useEffect } from 'react';
import { go } from '../router';

// 휴대폰에서 화면을 좌우로 밀면 아래 메뉴 차례대로 옆 화면으로 넘어감
// (왼쪽으로 밀면 다음 메뉴, 오른쪽으로 밀면 이전 메뉴)
const MIN_X = 70; // 이만큼(px)은 밀어야 넘어감 — 살짝 스친 것은 무시
const MAX_Y = 70; // 위아래로 많이 움직였으면 글 읽으려고 민 것으로 봄
const MAX_MS = 800; // 천천히 끌고 있는 것(선택·스크롤)은 화면 넘김으로 보지 않음
const EDGE = 24; // 화면 양 끝에서 시작한 밀기는 기기 자체의 '뒤로 가기'에 맡김
const WIDE = 1100; // 이보다 넓으면 위쪽 메뉴를 쓰는 큰 화면이라 밀기를 쓰지 않음

// 가로로 밀어 보는 상자(표·사진 줄) 안에서 시작했으면 그 상자 몫으로 둠
function inSideScroller(el) {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    if (n.scrollWidth > n.clientWidth + 4) {
      const ox = getComputedStyle(n).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
    }
  }
  return false;
}

export function useSwipeNav(paths, index, enabled = true) {
  useEffect(() => {
    if (!enabled || index < 0) return undefined;
    let from = null;
    const start = (e) => {
      from = null;
      if (e.touches.length !== 1 || window.innerWidth >= WIDE) return;
      if (document.body.classList.contains('modal-open')) return; // 창이 열려 있으면 그 창이 먼저
      const touch = e.touches[0];
      if (touch.clientX < EDGE || touch.clientX > window.innerWidth - EDGE) return;
      const el = e.target instanceof Element ? e.target : null;
      if (!el || el.closest('input, textarea, select, [contenteditable="true"]')) return; // 글 쓰는 칸은 그대로
      if (inSideScroller(el)) return;
      from = { x: touch.clientX, y: touch.clientY, at: Date.now() };
    };
    const end = (e) => {
      const s = from;
      from = null;
      if (!s) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - s.x;
      const dy = touch.clientY - s.y;
      if (Date.now() - s.at > MAX_MS) return;
      if (Math.abs(dx) < MIN_X || Math.abs(dy) > MAX_Y || Math.abs(dx) < Math.abs(dy) * 2) return;
      const next = index + (dx < 0 ? 1 : -1); // 왼쪽으로 밀면 다음 화면
      if (next < 0 || next >= paths.length) return;
      go(paths[next]);
    };
    const cancel = () => { from = null; };
    document.addEventListener('touchstart', start, { passive: true });
    document.addEventListener('touchend', end, { passive: true });
    document.addEventListener('touchcancel', cancel, { passive: true });
    return () => {
      document.removeEventListener('touchstart', start);
      document.removeEventListener('touchend', end);
      document.removeEventListener('touchcancel', cancel);
    };
  }, [paths, index, enabled]);
}
