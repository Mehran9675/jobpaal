import { useState } from 'react';
import { removeSavedAnswer, updateSavedAnswer } from '@/shared/storage';
import type { SavedAnswer } from '@/shared/types';
import { Button } from '@/ui/components/Button';
import { TextAreaField } from '@/ui/components/TextAreaField';
import { TextField } from '@/ui/components/TextField';
import { useConfirm } from '@/ui/components/useConfirm';

export function SavedAnswerItem({ answer }: { answer: SavedAnswer }) {
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(answer.question);
  const [text, setText] = useState(answer.answer);
  const { confirm, dialog } = useConfirm();

  const save = async () => {
    await updateSavedAnswer(answer.id, { question: question.trim(), answer: text });
    setEditing(false);
  };
  const remove = async () => {
    const ok = await confirm({ title: 'Remove this saved answer?', message: answer.question, confirmLabel: 'Remove', danger: true });
    if (ok) await removeSavedAnswer(answer.id);
  };

  return (
    <li>
      {editing ? (
        <div className="jp-stack">
          <TextField label="Question" value={question} onChange={setQuestion} />
          <TextAreaField label="Answer" value={text} onChange={setText} rows={3} />
          <div className="jp-row">
            <Button size="sm" variant="primary" onClick={() => void save()} disabled={!question.trim()}>
              Save
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setQuestion(answer.question);
                setText(answer.answer);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="jp-row jp-row--between" style={{ alignItems: 'flex-start' }}>
          <div className="jp-stack" style={{ gap: 2, minWidth: 0 }}>
            <span className="jp-strong">{answer.question}</span>
            <span className="jp-small jp-opt-prewrap">{answer.answer}</span>
            <span className="jp-small jp-faint">Used {answer.usedCount} time{answer.usedCount === 1 ? '' : 's'}</span>
          </div>
          <div className="jp-row">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" className="jp-opt-danger-text" onClick={() => void remove()}>
              Remove
            </Button>
          </div>
        </div>
      )}
      {dialog}
    </li>
  );
}
