import type { ScreeningAnswer } from '@/shared/types';
import { createId } from '@/shared/utils/id';
import { wordCount } from '@/shared/utils/text';
import { Badge } from '../components/Badge';

export interface AnswersEditorProps {
  value: ScreeningAnswer[];
  onChange: (value: ScreeningAnswer[]) => void;
}

/** Per-question answer editor. Manual questions can be added and removed. */
export function AnswersEditor({ value, onChange }: AnswersEditorProps) {
  const update = (id: string, patch: Partial<ScreeningAnswer>) =>
    onChange(value.map((answer) => (answer.id === id ? { ...answer, ...patch, edited: true } : answer)));

  const add = () =>
    onChange([...value, { id: createId('qa'), question: '', answer: '', source: 'manual', edited: true }]);

  return (
    <div className="jp-editor">
      {value.length === 0 && <p className="jp-small jp-faint">No screening answers yet. Add a question the form asked that detection missed.</p>}
      {value.map((answer, index) => (
        <div key={answer.id} className="jp-editor__answer">
          <div className="jp-row jp-row--between">
            <span className="jp-field__label">
              Question {index + 1}{' '}
              {answer.source === 'manual' ? <Badge>manual</Badge> : answer.source === 'saved' ? <Badge>saved</Badge> : null}
              {answer.edited && <Badge tone="info">edited</Badge>}
            </span>
            {answer.source === 'manual' && (
              <button type="button" className="jp-btn jp-btn--ghost jp-btn--sm jp-repeatable__remove" onClick={() => onChange(value.filter((a) => a.id !== answer.id))}>
                Remove
              </button>
            )}
          </div>
          {answer.source === 'manual' ? (
            <input
              className="jp-input"
              value={answer.question}
              placeholder="Type the question exactly as the form asks it"
              aria-label={`Question ${index + 1}`}
              onChange={(e) => update(answer.id, { question: e.target.value })}
            />
          ) : (
            <p className="jp-editor__question">{answer.question}</p>
          )}
          <textarea
            className="jp-textarea"
            rows={4}
            value={answer.answer}
            aria-label={`Answer to question ${index + 1}`}
            onChange={(e) => update(answer.id, { answer: e.target.value })}
          />
          <span className="jp-field__hint">{wordCount(answer.answer)} words</span>
        </div>
      ))}
      <div>
        <button type="button" className="jp-btn jp-btn--sm" onClick={add}>
          + Add question
        </button>
      </div>
    </div>
  );
}
