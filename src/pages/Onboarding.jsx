import { useStore } from '../store';
import { DEFAULT_PROFILE } from '../lib/nutrition';
import { weekDates, today } from '../lib/date';
import ProfileForm from '../components/ProfileForm';

export default function Onboarding() {
  const { saveProfileAndGenerate, notify } = useStore();
  const save = (p) => {
    const r = saveProfileAndGenerate({ ...p, completed: true }, weekDates(today()));
    notify(r.warnings[0] || '이번 주 21끼 식단을 만들었어요!');
    window.location.hash = '/';
  };
  return (
    <div className="onboard">
      <header className="hero">
        <img src="./icon.svg" alt="" width="72" height="72" />
        <h1>건강한 세 끼</h1>
        <p>아침·점심·저녁 식단을 내 몸에 맞게 짜 드려요.<br />회원가입 없이 이 기기에서 바로 시작합니다.</p>
      </header>
      <ProfileForm initial={DEFAULT_PROFILE} onSave={save} submitLabel="시작하고 이번 주 식단 만들기" short />
      <p className="muted small center">이 서비스는 일상 식단 계획을 돕는 도구이며 진단·치료·의료적 영양처방을 대체하지 않습니다.</p>
    </div>
  );
}
