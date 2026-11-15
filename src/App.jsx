import { useStore } from './store';
import { useRoute } from './router';
import Home from './pages/Home';
import Plan from './pages/Plan';
import RecipePage from './pages/Recipe';
import RecipeList from './pages/RecipeList';
import Shopping from './pages/Shopping';
import Restaurants from './pages/Restaurants';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import More from './pages/More';
import Onboarding from './pages/Onboarding';

const TOP_NAV = [
  { path: '/', label: '홈', icon: '🏠' },
  { path: '/plan', label: '식단 계획', icon: '📅' },
  { path: '/recipes', label: '레시피', icon: '🍴' },
  { path: '/shopping', label: '장보기', icon: '🛒' },
  { path: '/eat-out', label: '주변 식당', icon: '📍' },
  { path: '/stats', label: '내 건강', icon: '💙' },
];
const SIDE_NAV = [
  TOP_NAV[0],
  { ...TOP_NAV[1], sub: [{ href: '/plan?view=week', label: '주간 식단표' }, { href: '/plan?view=month', label: '월간 식단표' }] },
  ...TOP_NAV.slice(2),
  { path: '/settings', label: '설정', icon: '⚙️' },
];
const TAB_NAV = [
  { path: '/', label: '홈', icon: '🏠' },
  { path: '/plan', label: '식단', icon: '📅' },
  { path: '/recipes', label: '레시피', icon: '🍴' },
  { path: '/eat-out', label: '식당', icon: '📍' },
  { path: '/more', label: '더보기', icon: '☰' },
];
const MORE_PATHS = ['/more', '/stats', '/settings', '/shopping', '/help'];
const FONT_STEPS = [18, 20, 22, 24, 26];

export default function App() {
  const { state, toast, update } = useStore();
  const route = useRoute();

  if (!state.profile?.completed) return <><Onboarding /><Toast toast={toast} /></>;

  const p = route.path;
  let page;
  if (p === '/') page = <Home />;
  else if (p.startsWith('/plan')) page = <Plan route={route} />;
  else if (p.startsWith('/recipe/')) page = <RecipePage id={route.parts[1]} query={route.query} />;
  else if (p === '/recipes') page = <RecipeList />;
  else if (p === '/shopping') page = <Shopping />;
  else if (p === '/eat-out') page = <Restaurants />;
  else if (p === '/stats') page = <Stats />;
  else if (p === '/settings') page = <Settings />;
  else if (p === '/more' || p === '/help') page = <More route={route} />;
  else page = <Home />;

  const isOn = (path) => (path === '/' ? p === '/' : path === '/recipes' ? p === '/recipes' || p.startsWith('/recipe/') : p.startsWith(path));
  const tabOn = (n) => (n.path === '/more' ? MORE_PATHS.includes(p) : isOn(n.path));
  const fs = state.settings.fontSize || 20;
  const setFont = (dir) => {
    const i = Math.max(0, Math.min(FONT_STEPS.length - 1, FONT_STEPS.indexOf(fs) + dir));
    update('settings', (s) => ({ ...s, fontSize: FONT_STEPS[i] }));
  };
  const name = state.profile.name?.trim();

  return (
    <div className="app">
      <a className="skip" href="#main">본문으로 건너뛰기</a>
      <header className="topbar no-print">
        <a href="#/" className="brand">
          <img src="./icon.svg" alt="" width="44" height="44" />
          <span><b>건강한 세 끼</b><small>시니어를 위한 맞춤 식단</small></span>
        </a>
        <nav className="topnav" aria-label="주 메뉴">
          {TOP_NAV.map((n) => (
            <a key={n.path} href={`#${n.path}`} className={isOn(n.path) ? 'on' : ''} aria-current={isOn(n.path) ? 'page' : undefined}><span aria-hidden>{n.icon}</span>{n.label}</a>
          ))}
        </nav>
        <div className="top-tools">
          <div className="fontsize" role="group" aria-label="글자 크기">
            <span className="fs-label">글자크기</span>
            <button onClick={() => setFont(-1)} disabled={fs === FONT_STEPS[0]} aria-label="글자 작게">가</button>
            <button onClick={() => setFont(1)} disabled={fs === FONT_STEPS[FONT_STEPS.length - 1]} aria-label="글자 크게"><b>가+</b></button>
          </div>
          <a href="#/settings" className="me"><span aria-hidden>👤</span><span className="me-name">{name ? `${name}님` : '내 정보'}</span></a>
        </div>
      </header>

      <div className="shell">
        <aside className="sidebar no-print" aria-label="보조 메뉴">
          <div className="intro">
            <div className="intro-art" aria-hidden><span>👵</span><span>👴</span></div>
            <h2>시니어 맞춤 식단 관리</h2>
            <ul>
              {['개인별 영양 목표 반영', '칼로리·단백질 균형 관리', '주간·월간 식단 자동 생성', '쉬운 레시피와 장보기', '주변 식당 추천'].map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
          <nav className="sidenav">
            {SIDE_NAV.map((n) => (
              <div key={n.path}>
                <a href={`#${n.path}`} className={isOn(n.path) ? 'on' : ''}><span aria-hidden>{n.icon}</span>{n.label}</a>
                {n.sub && (
                  <div className="sub">
                    {n.sub.map((s) => <a key={s.href} href={`#${s.href}`} className={p === '/plan' && (route.query.view || 'week') === s.href.split('=')[1] ? 'on' : ''}>· {s.label}</a>)}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>
        <main id="main" className="content" tabIndex={-1}>{page}</main>
      </div>

      <nav className="tabbar no-print" aria-label="주 메뉴">
        {TAB_NAV.map((n) => (
          <a key={n.path} href={`#${n.path}`} className={tabOn(n) ? 'on' : ''} aria-current={tabOn(n) ? 'page' : undefined}>
            <span aria-hidden className="ti">{n.icon}</span><span>{n.label}</span>
          </a>
        ))}
      </nav>
      <Toast toast={toast} />
    </div>
  );
}

function Toast({ toast }) {
  return <div className="toast-wrap" aria-live="polite">{toast && <div key={toast.id} className="toast">{toast.msg}</div>}</div>;
}
