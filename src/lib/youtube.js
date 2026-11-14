// 레시피별 유튜브 추천 — API 키 없이 유튜브 검색 결과로 연결
const PLAIN = new Set(['잡곡밥', '쌀밥', '밥', '우유', '김']);

export function dishNames(title) {
  return title.split(/, |과 |와 /).map((s) => s.trim()).filter(Boolean);
}

export function youtubeSuggestions(recipe) {
  const [main, ...rest] = dishNames(recipe.title);
  const side = rest.find((x) => !PLAIN.has(x));
  const list = [
    { q: `${main} 만들기`, label: `${main} 만들기`, desc: '기본 조리법 영상' },
    { q: `${main} 쉬운 레시피 초보`, label: `${main} 쉽게 만들기`, desc: '처음 하는 분도 따라 하기 쉬운 영상' },
    side
      ? { q: `${side} 만들기`, label: `${side} 만들기`, desc: '곁들이는 반찬·국 영상' }
      : { q: `${main} 저염 건강 레시피`, label: `${main} 싱겁게 만들기`, desc: '나트륨을 줄인 건강 레시피 영상' },
  ];
  return list.map((x) => ({ ...x, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(x.q)}` }));
}
