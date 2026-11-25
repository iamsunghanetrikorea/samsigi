import { useLayoutEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { useRoute } from './router';
import { useSwipeNav } from './lib/swipe';
import Home from './pages/Home';
import Plan from './pages/Plan';
import RecipePage from './pages/Recipe';
import RecipeList from './pages/RecipeList';
import Market from './pages/Market';
import Restaurants from './pages/Restaurants';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import More from './pages/More';
import Onboarding from './pages/Onboarding';
import { setLang, t } from './i18n';
import LangButton from './i18n/LangButton';
import { House, CalendarDays, UtensilsCrossed, ShoppingCart, MapPin, HeartPulse, Settings as SettingsIcon, Menu, UserRound, Check } from 'lucide-react';
import BrandMark from './components/BrandMark';

const TOP_NAV = [
  { path: '/', label: '홈', icon: House },
  { path: '/plan', label: '식단 계획', icon: CalendarDays },
  { path: '/recipes', label: '레시피', icon: UtensilsCrossed },
  { path: '/shopping', label: '장보기', icon: ShoppingCart },
  { path: '/eat-out', label: '주변 식당', icon: MapPin },
  { path: '/stats', label: '내 건강', icon: HeartPulse },
];
const SIDE_NAV = [
  TOP_NAV[0],
  { ...TOP_NAV[1], sub: [{ href: '/plan?view=week', label: '주간 식단표' }, { href: '/plan?view=month', label: '월간 식단표' }] },
  ...TOP_NAV.slice(2),
  { path: '/settings', label: '설정', icon: SettingsIcon },
];
const TAB_NAV = [
  { path: '/', label: '홈', icon: House },
  { path: '/recipes', label: '레시피', icon: UtensilsCrossed },
  { path: '/shopping', label: '장보기', icon: ShoppingCart },
  { path: '/eat-out', label: '식당', icon: MapPin },
  { path: '/more', label: '더보기', icon: Menu },
];
const MORE_PATHS = ['/more', '/plan', '/stats', '/settings', '/help'];
const TAB_PATHS = TAB_NAV.map((n) => n.path); // 휴대폰에서 좌우로 밀 때 옮겨 갈 차례
const FONT_STEPS = [18, 20, 22, 24, 26];

export default function App() {
  const { state, toast, update } = useStore();
  const route = useRoute();
  const lang = state.settings.lang || 'ko';
  setLang(lang); // 화면을 그리기 전에 언어를 맞춤 (아래 key={lang}로 언어가 바뀌면 화면 전체를 새로 그림)
  const changeLang = (l) => update('settings', (s) => ({ ...s, lang: l }));

  const [barRef] = useHeaderFit([lang, state.settings.fontSize, state.profile?.name, state.profile?.completed]);

  const p = route.path;
  const isOn = (path) => (path === '/' ? p === '/' : path === '/recipes' ? p === '/recipes' || p.startsWith('/recipe/') : p.startsWith(path));
  const inMore = MORE_PATHS.includes(p) || (p === '/shopping' && route.query.view === 'list'); // 장보기 목록은 휴대폰 '더보기' 안
  const tabOn = (n) => (n.path === '/more' ? inMore : n.path === '/shopping' ? isOn(n.path) && !inMore : isOn(n.path));
  // 휴대폰에서 화면을 좌우로 밀면 아래 메뉴 차례대로 이전·다음 화면으로
  useSwipeNav(TAB_PATHS, TAB_NAV.findIndex(tabOn), !!state.profile?.completed);

  if (!state.profile?.completed) return <div key={lang}><div className="onb-lang no-print"><LangButton lang={lang} onChange={changeLang} /></div><Onboarding /><Toast toast={toast} /></div>;

  let page;
  if (p === '/') page = <Home />;
  else if (p.startsWith('/plan')) page = <Plan route={route} />;
  else if (p.startsWith('/recipe/')) page = <RecipePage id={route.parts[1]} query={route.query} />;
  else if (p === '/recipes') page = <RecipeList />;
  else if (p === '/shopping') page = <Market route={route} />;
  else if (p === '/eat-out') page = <Restaurants />;
  else if (p === '/stats') page = <Stats />;
  else if (p === '/settings') page = <Settings />;
  else if (p === '/more' || p === '/help') page = <More route={route} />;
  else page = <Home />;

  const fs = state.settings.fontSize || 20;
  const setFont = (dir) => {
    const i = Math.max(0, Math.min(FONT_STEPS.length - 1, FONT_STEPS.indexOf(fs) + dir));
    update('settings', (s) => ({ ...s, fontSize: FONT_STEPS[i] }));
  };
  const name = state.profile.name?.trim();

  return (
    <div className="app" key={lang}>
      <a className="skip" href="#main">{t('본문으로 건너뛰기')}</a>
      <header className="topbar no-print" ref={barRef}>
        <a href="#/" className="brand">
          <BrandMark />
          <span><b translate="no">삼식이家</b><small>{t('시니어를 위한 맞춤 식단')}</small></span>
        </a>
        <nav className="topnav" aria-label={t('주 메뉴')}>
          {TOP_NAV.map((n) => (
            <a key={n.path} href={`#${n.path}`} className={isOn(n.path) ? 'on' : ''} aria-current={isOn(n.path) ? 'page' : undefined}><n.icon aria-hidden size={20} strokeWidth={1.75} />{t(n.label)}</a>
          ))}
        </nav>
        <div className="top-tools">
          <LangButton lang={lang} onChange={changeLang} />
          <div className="fontsize" role="group" aria-label={t('글자 크기')}>
            <span className="fs-label">{t('글자크기')}</span>
            <button onClick={() => setFont(-1)} disabled={fs === FONT_STEPS[0]} aria-label={t('글자 작게')}><span className="fs-long">{t('가')}</span><span className="fs-short" aria-hidden>−</span></button>
            <button onClick={() => setFont(1)} disabled={fs === FONT_STEPS[FONT_STEPS.length - 1]} aria-label={t('글자 크게')}><b className="fs-long">{t('가+')}</b><span className="fs-short" aria-hidden>+</span></button>
          </div>
          <a href="#/settings" className="me"><UserRound aria-hidden size={22} strokeWidth={1.75} /><span className="me-name">{name ? t('{name}님', { name }) : t('내 정보')}</span></a>
        </div>
      </header>

      <div className="shell">
        <aside className="sidebar no-print" aria-label={t('보조 메뉴')}>
          <nav className="sidenav">
            {SIDE_NAV.map((n) => (
              <div key={n.path}>
                <a href={`#${n.path}`} className={isOn(n.path) ? 'on' : ''}><n.icon aria-hidden size={20} strokeWidth={1.75} />{t(n.label)}</a>
                {n.sub && (
                  <div className="sub">
                    {n.sub.map((s) => <a key={s.href} href={`#${s.href}`} className={p === '/plan' && (route.query.view || 'week') === s.href.split('=')[1] ? 'on' : ''}>{t(s.label)}</a>)}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="intro">
            <h2>{t('시니어 맞춤 식단 관리')}</h2>
            <ul>
              {['개인별 영양 목표 반영', '칼로리·단백질 균형 관리', '주간·월간 식단 자동 생성', '쉬운 레시피와 장보기', '주변 식당 추천'].map((x) => <li key={x}><Check aria-hidden size={16} strokeWidth={2} />{t(x)}</li>)}
            </ul>
          </div>
        </aside>
        <main id="main" className="content" tabIndex={-1}>{page}</main>
      </div>

      <nav className="tabbar no-print" aria-label={t('주 메뉴')}>
        {TAB_NAV.map((n) => (
          <a key={n.path} href={`#${n.path}`} className={tabOn(n) ? 'on' : ''} aria-current={tabOn(n) ? 'page' : undefined}>
            <n.icon aria-hidden className="ti" size={24} strokeWidth={1.75} /><span>{t(n.label)}</span>
          </a>
        ))}
      </nav>
      <Toast toast={toast} />
    </div>
  );
}

// 넓은 화면 머리줄이 한 줄에 다 들어가도록 단계적으로 줄임
// 1: 메뉴 아이콘·'글자크기' 글자 숨김 → 2: 로고 부제·이름 숨김 → 3: 메뉴 글자 조금 작게 → 4: 메뉴를 아래 탭으로
function useHeaderFit(deps) {
  const ref = useRef(null);
  const [level, setLevel] = useState(0);
  useLayoutEffect(() => {
    const bar = ref.current;
    if (!bar) return;
    const app = bar.parentElement;
    const fit = () => {
      const nav = bar.querySelector('.topnav');
      let lv = 0;
      app.dataset.fit = '0';
      const navShown = nav && getComputedStyle(nav).display !== 'none';
      const over = () => bar.scrollWidth > bar.clientWidth + 1 || (navShown && nav.scrollWidth > nav.clientWidth + 1);
      if (navShown) while (over() && lv < 4) { lv += 1; app.dataset.fit = String(lv); }
      setLevel(lv);
      // 머리줄 높이를 알려 둬서, 화면에 고정한 검색줄이 머리줄 바로 아래 붙게 함
      document.documentElement.style.setProperty('--topbar-h', `${Math.round(bar.getBoundingClientRect().height)}px`);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(document.documentElement);
    ro.observe(bar);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return [ref, level];
}

function Toast({ toast }) {
  return <div className="toast-wrap" aria-live="polite">{toast && <div key={toast.id} className="toast">{t(toast.msg)}</div>}</div>;
}
