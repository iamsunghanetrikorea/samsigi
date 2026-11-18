import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { DEFAULT_PROFILE } from '../lib/nutrition';
import { weekDates, today } from '../lib/date';
import { getItem, setItem } from '../lib/storage';
import ProfileForm from '../components/ProfileForm';
import { t } from '../i18n';

const DRAFT = 'onboardDraft'; // 처음 설정 중간 저장 (끝까지 못 하고 나가도 이어서)

export default function Onboarding() {
  const { saveProfileAndGenerate, notify } = useStore();
  const [draft, setDraft] = useState(undefined);
  const timer = useRef(null);

  useEffect(() => { getItem(DRAFT).then((d) => setDraft(d || null)).catch(() => setDraft(null)); }, []);

  const onDraft = (d) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setItem(DRAFT, d), 400);
  };
  const save = (p) => {
    clearTimeout(timer.current);
    setItem(DRAFT, null);
    const r = saveProfileAndGenerate({ ...p, completed: true }, weekDates(today()));
    notify(r.warnings[0] || t('이번 주 21끼 식단을 만들었어요!'));
    window.location.hash = '/';
  };

  if (draft === undefined) return null;
  const resumed = draft && draft.step > 0;
  return (
    <div className="onboard">
      <header className="hero">
        <img src="./icon.svg" alt="" width="72" height="72" />
        <h1>{t('건강한 세 끼')}</h1>
        <p>{t('아침·점심·저녁 식단을 내 몸에 맞게 짜 드려요.')}<br />{t('회원가입 없이 이 기기에서 바로 시작합니다.')}</p>
        <p className="muted small">{t('나이·키·몸무게만 넣으면 바로 시작할 수 있어요. 나머지는 건너뛰어도 돼요.')}</p>
      </header>
      {resumed && <p className="notice small">{t('지난번에 입력하던 내용을 이어서 보여 드려요.')}</p>}
      <ProfileForm
        initial={{ ...DEFAULT_PROFILE, ...(draft?.p || {}) }}
        initialExText={draft?.exText}
        initialStep={draft?.step || 0}
        onDraft={onDraft}
        onSave={save}
        submitLabel={t('시작하고 이번 주 식단 만들기')}
        short
        wizard
      />
      <p className="muted small center">{t('이 서비스는 일상 식단 계획을 돕는 도구이며 진단·치료·의료적 영양처방을 대체하지 않습니다.')}</p>
    </div>
  );
}
