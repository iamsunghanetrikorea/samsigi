import { useEffect, useState } from 'react';

// 해시 라우팅 — GitHub Pages 등 정적 호스팅에서 새로고침해도 동작
export function go(path) { window.location.hash = path; }

export function parseHash(hash) {
  const raw = (hash || '').replace(/^#/, '') || '/';
  const [p, q = ''] = raw.split('?');
  const parts = p.split('/').filter(Boolean);
  return { path: '/' + parts.join('/'), parts, query: Object.fromEntries(new URLSearchParams(q)) };
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const f = () => { setRoute(parseHash(window.location.hash)); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return route;
}
