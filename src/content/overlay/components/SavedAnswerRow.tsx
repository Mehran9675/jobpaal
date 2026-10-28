import { removeSaved } from '@/content/controller/answerActions';
import { pickFieldForAnswer } from '@/content/controller/pickActions';
import type { SavedAnswer } from '@/shared/types';
import { truncate } from '@/shared/utils/text';
import { Button } from '@/ui/components/Button';

export function SavedAnswerRow({ saved, disabled }: { saved: SavedAnswer; disabled: boolean }) {
  return (
    <div className="jp-ov-item">
      <div className="jp-ov-item__q">{saved.question}</div>
      <div className="jp-ov-item__a">{truncate(saved.answer, 220)}</div>
      <div className="jp-row">
        <Button size="sm" onClick={() => pickFieldForAnswer(saved.question, saved.answer)} disabled={disabled}>
          Send to field
        </Button>
        <Button size="sm" variant="ghost" onClick={() => removeSaved(saved.id)}>
          Remove
        </Button>
      </div>
    </div>
  );
}
