import { useState } from 'react';
import { editGeneratedAnswer, saveForReuse } from '@/content/controller/answerActions';
import { pickFieldForAnswer } from '@/content/controller/pickActions';
import type { ScreeningAnswer } from '@/shared/types';
import { Button } from '@/ui/components/Button';
import { TextAreaField } from '@/ui/components/TextAreaField';
import { CopyButton } from './CopyButton';

/** A drafted screening answer: copy, edit, send to a field, or save for reuse. */
export function GeneratedAnswer({ answer, disabled }: { answer: ScreeningAnswer; disabled: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(answer.answer);
  return (
    <div className="jp-ov-item">
      <div className="jp-ov-item__q">{answer.question}</div>
      {editing ? (
        <>
          <TextAreaField value={draft} onChange={setDraft} rows={4} aria-label="Answer" />
          <div className="jp-row">
            <Button
              size="sm"
              variant="primary"
              onClick={async () => {
                await editGeneratedAnswer(answer.id, draft);
                setEditing(false);
              }}
            >
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <div className="jp-ov-item__a">{answer.answer || <em>No answer drafted — your profile does not cover this. Answer it yourself.</em>}</div>
      )}
      {!editing && (
        <div className="jp-row jp-row--wrap">
          <CopyButton text={answer.answer} />
          <Button size="sm" onClick={() => { setDraft(answer.answer); setEditing(true); }}>
            Edit
          </Button>
          <Button size="sm" onClick={() => pickFieldForAnswer(answer.question, answer.answer)} disabled={disabled || !answer.answer}>
            Send to field
          </Button>
          <Button size="sm" variant="ghost" onClick={() => saveForReuse(answer.question, answer.answer)} disabled={!answer.answer}>
            Save for reuse
          </Button>
        </div>
      )}
    </div>
  );
}
