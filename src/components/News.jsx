import { t } from '../i18n';

// 홈 '오늘의 뉴스': YTN 모바일 뉴스를 창 안에 표시
// (네이버는 다른 사이트 안에 띄우는 것을 막아 두어 쓸 수 없음 — X-Frame-Options: DENY)
const NEWS_URL = 'https://m.ytn.co.kr/';

export function NewsPanel() {
  return (
    <section className="panel news-panel" aria-labelledby="news-h">
      <div className="row between">
        <h2 id="news-h"><span aria-hidden>📰</span> {t('오늘의 뉴스')}</h2>
        <a className="btn small ghost" href={NEWS_URL} target="_blank" rel="noopener noreferrer">{t('크게 보기')} ↗</a>
      </div>
      <div className="news-frame">
        <iframe src={NEWS_URL} title={t('오늘의 뉴스 (YTN)')} loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" />
      </div>
      <p className="muted small">{t('뉴스 제공: YTN')}</p>
    </section>
  );
}
