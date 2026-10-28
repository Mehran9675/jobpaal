import { Card } from '@/ui/components/Card';
import { Spinner } from '@/ui/components/Spinner';
import { useSavedAnswers } from '@/ui/hooks/useSavedAnswers';
import { SavedAnswerItem } from './SavedAnswerItem';

/** Question/answer pairs saved for reuse on future forms. */
export function SavedAnswersList() {
  const answers = useSavedAnswers();
  return (
    <Card title={`Saved answers${answers ? ` (${answers.length})` : ''}`}>
      {!answers ? (
        <Spinner label="Loading saved answers" />
      ) : answers.length === 0 ? (
        <p className="jp-small jp-muted">No saved answers yet. In the overlay’s Answers section, use “Save for reuse” to fill matching questions automatically.</p>
      ) : (
        <ul className="jp-opt-saved">
          {answers.map((answer) => (
            <SavedAnswerItem key={answer.id} answer={answer} />
          ))}
        </ul>
      )}
    </Card>
  );
}
