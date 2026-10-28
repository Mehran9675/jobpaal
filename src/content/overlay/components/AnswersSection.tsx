import { addManualAnswer } from '@/content/controller/answerActions';
import type { ManualAnswer } from '@/content/controller/state';
import type { SavedAnswer, ScreeningAnswer } from '@/shared/types';
import { Button } from '@/ui/components/Button';
import { GeneratedAnswer } from './GeneratedAnswer';
import { ManualAnswerEntry } from './ManualAnswerEntry';
import { SavedAnswerRow } from './SavedAnswerRow';
import { Section } from './Section';

export interface AnswersSectionProps {
  generated: ScreeningAnswer[];
  manual: ManualAnswer[];
  saved: SavedAnswer[];
  questionCount: number;
  aiReady: boolean;
  disabled: boolean;
}

export function AnswersSection({ generated, manual, saved, questionCount, aiReady, disabled }: AnswersSectionProps) {
  return (
    <Section title="Answers" aside={generated.length ? `${generated.length} drafted` : questionCount ? `${questionCount} questions found` : undefined}>
      {generated.length === 0 && (
        <p className="jp-small jp-muted">
          {questionCount
            ? `${questionCount} screening question${questionCount === 1 ? '' : 's'} found. Tailor and fill drafts answers from your real profile.`
            : 'No screening questions were detected. Add any question the form asks below.'}
        </p>
      )}
      {generated.map((answer) => (
        <GeneratedAnswer key={answer.id} answer={answer} disabled={disabled} />
      ))}
      <div className="jp-row jp-row--between">
        <strong className="jp-small">Write an answer</strong>
        <Button size="sm" onClick={addManualAnswer}>
          + Add question
        </Button>
      </div>
      {manual.map((entry) => (
        <ManualAnswerEntry key={entry.id} entry={entry} aiReady={aiReady} disabled={disabled} />
      ))}
      {saved.length > 0 && (
        <details>
          <summary className="jp-small jp-strong" style={{ cursor: 'pointer' }}>
            Saved for reuse ({saved.length})
          </summary>
          <div className="jp-stack" style={{ marginTop: 6 }}>
            {saved.map((s) => (
              <SavedAnswerRow key={s.id} saved={s} disabled={disabled} />
            ))}
          </div>
        </details>
      )}
    </Section>
  );
}
