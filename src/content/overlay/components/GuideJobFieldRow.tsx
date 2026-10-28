import { pickJobField } from '@/content/controller/pickActions';
import { saveJobFieldLocator } from '@/shared/storage';
import type { ElementLocator, JobField } from '@/shared/types';
import { truncate } from '@/shared/utils/text';
import { Badge } from '@/ui/components/Badge';
import { Button } from '@/ui/components/Button';

export interface GuideJobFieldRowProps {
  host: string;
  field: JobField;
  label: string;
  locator: ElementLocator | undefined;
  disabled: boolean;
}

/** Teaches JobPaal where one job field lives on this site. Saved automatically. */
export function GuideJobFieldRow({ host, field, label, locator, disabled }: GuideJobFieldRowProps) {
  return (
    <div className="jp-row" style={{ alignItems: 'flex-start' }}>
      <div className="jp-stack" style={{ gap: 2, flex: 1, minWidth: 0 }}>
        <div className="jp-row">
          <strong className="jp-small">{label}</strong>
          {locator ? <Badge tone="success">saved</Badge> : <Badge>not set</Badge>}
        </div>
        {locator?.textSample && <span className="jp-small jp-faint jp-ellipsis">{truncate(locator.textSample, 60)}</span>}
      </div>
      <Button size="sm" onClick={() => pickJobField(field, true)} disabled={disabled}>
        {locator ? 'Re-pick' : 'Pick'}
      </Button>
      {locator && (
        <Button size="sm" variant="ghost" onClick={() => saveJobFieldLocator(host, field, null)} aria-label={`Forget ${label}`}>
          Forget
        </Button>
      )}
    </div>
  );
}
