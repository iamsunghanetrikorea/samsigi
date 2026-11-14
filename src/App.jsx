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

const NAV = [
  { path: '/', label: '홈', icon: '🏠' },
  { path: '/plan', label: '식단', icon: '📅' },
  { path: '/shopping', label: '장보기', icon: '🛒' },
  { path: '/eat-out', label: '식당', icon: '📍' },
  { path: '/more', label: '더보기', icon: '☰' },
];
const MORE_PATHS = ['/more', '/stats', '/settings', '/recipes', '/help'];

export default function App() {
  const { state, toast } = useStore();
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

  const active = (n) => (n.path === '/' ? p === '/' : n.path === '/more' ? MORE_PATHS.includes(p) : p.startsWith(n.path) || (n.path === '/plan' && p.startsWith('/recipe/')));

  return (
    <div className="app">
      <a className="skip" href="#main">본문으로 건너뛰기</a>
      <header className="topbar no-print">
        <a href="#/" className="brand"><img src="./icon.svg" alt="" width="36" height="36" /> 건강한 세 끼</a>
      </header>
      <main id="main" className="content" tabIndex={-1}>{page}</main>
      <nav className="tabbar no-print" aria-label="주 메뉴">
        {NAV.map((n) => (
          <a key={n.path} href={`#${n.path}`} className={active(n) ? 'on' : ''} aria-current={active(n) ? 'page' : undefined}>
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
