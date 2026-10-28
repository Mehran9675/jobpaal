import { draftManualAnswer, removeManualAnswer, saveForReuse, updateManualAnswer } from '@/content/controller/answerActions';
import { pickFieldForAnswer } from '@/content/controller/pickActions';
import type { ManualAnswer } from '@/content/controller/state';
import { Button } from '@/ui/components/Button';
import { TextAreaField } from '@/ui/components/TextAreaField';
import { TextField } from '@/ui/components/TextField';

export interface ManualAnswerEntryProps {
  entry: ManualAnswer;
  aiReady: boolean;
  disabled: boolean;
}

/** A question detection missed: Ask AI, Send to field, Save for reuse. */
export function ManualAnswerEntry({ entry, aiReady, disabled }: ManualAnswerEntryProps) {
  return (
    <div className="jp-ov-item">
      <TextField
        value={entry.question}
        onChange={(question) => updateManualAnswer(entry.id, { question })}
        placeholder="Type the question from the form"
        aria-label="Question"
      />
      <TextAreaField
        value={entry.answer}
        onChange={(answer) => updateManualAnswer(entry.id, { answer })}
        rows={3}
        placeholder="Your answer"
        aria-label="Answer"
      />
      <div className="jp-row jp-row--wrap">
        <Button
          size="sm"
          onClick={() => draftManualAnswer(entry.id)}
          disabled={disabled || !aiReady || !entry.question.trim()}
          title={aiReady ? 'Draft an answer from your real profile' : 'Connect an AI provider to draft answers'}
        >
          Ask AI
        </Button>
        <Button size="sm" onClick={() => pickFieldForAnswer(entry.question, entry.answer)} disabled={disabled || !entry.answer.trim()}>
          Send to field
        </Button>
        <Button size="sm" onClick={() => saveForReuse(entry.question, entry.answer)} disabled={!entry.question.trim() || !entry.answer.trim()}>
          Save for reuse
        </Button>
        <Button size="sm" variant="ghost" onClick={() => removeManualAnswer(entry.id)} aria-label="Remove entry">
          Remove
        </Button>
      </div>
    </div>
  );
}
