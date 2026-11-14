import { useState } from 'react';
import { useStore } from '../store';
import { Modal } from './ui';
import { chatGptUrl, copyText } from '../lib/share';

// 보낼 내용을 미리 보여 주고(수정 가능) ChatGPT 새 대화로 전달
export default function SendToGpt({ title, initialText, onClose }) {
  const { notify } = useStore();
  const [text, setText] = useState(initialText);
  const { prefilled } = chatGptUrl(text);
  const send = async () => {
    const { url, prefilled: ok } = chatGptUrl(text);
    await copyText(text);
    window.open(url, '_blank', 'noopener,noreferrer');
    notify(ok ? 'ChatGPT 새 대화에 레시피를 담아 열었어요. (복사도 해 두었어요)' : '내용이 길어 복사해 두었어요. ChatGPT 입력창에 붙여넣기(길게 누르기 → 붙여넣기) 해 주세요.');
    onClose();
  };
  const copy = async () => { notify((await copyText(text)) ? '레시피를 복사했어요. 원하는 곳에 붙여넣어 주세요.' : '복사하지 못했어요. 내용을 직접 선택해 복사해 주세요.'); };
  return (
    <Modal title={title} onClose={onClose} wide>
      <p className="muted small">아래 내용이 <b>ChatGPT(chatgpt.com, 외부 서비스)</b>로 전달됩니다. 레시피만 들어가며 프로필·건강정보는 보내지 않습니다. 내용은 고칠 수 있어요.</p>
      <label className="field"><span>보낼 내용</span>
        <textarea className="send-text" value={text} onChange={(e) => setText(e.target.value)} rows={14} />
      </label>
      {!prefilled && <p className="warn">내용이 길어 ChatGPT 입력창에 자동으로 채울 수 없어요. 보내기를 누르면 복사해 두니, ChatGPT에서 붙여넣기 해 주세요.</p>}
      <div className="row wrap">
        <button className="btn primary" onClick={send}>ChatGPT로 보내기</button>
        <button className="btn ghost" onClick={copy}>복사만 하기</button>
        <button className="btn ghost" onClick={onClose}>취소</button>
      </div>
      <p className="muted small">ChatGPT 계정 로그인이 필요할 수 있습니다. 답변 내용은 ChatGPT가 만든 것으로, 의료적 조언이 아닙니다.</p>
    </Modal>
  );
}
