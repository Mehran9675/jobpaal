import { useState } from 'react';
import type { Profile } from '@/shared/types';
import { Button } from '@/ui/components/Button';
import { summarizeImport } from '../../lib/importSummary';

export interface ImportReviewProps {
  data: Partial<Profile>;
  /** Where the data came from, e.g. "resume.pdf" or "LinkedIn". */
  sourceLabel: string;
  onMerge: (overwrite: boolean) => Promise<void> | void;
  onDiscard: () => void;
  busy?: boolean;
}

/** Shows what an import found and lets the user choose how to merge it. */
export function ImportReview({ data, sourceLabel, onMerge, onDiscard, busy }: ImportReviewProps) {
  const [overwrite, setOverwrite] = useState(false);
  const lines = summarizeImport(data);
  return (
    <div className="jp-opt-review" role="region" aria-label="Review imported data">
      <p className="jp-strong">Found in {sourceLabel}</p>
      {lines.length === 0 ? (
        <p className="jp-small jp-muted">Nothing usable was found.</p>
      ) : (
        <dl className="jp-opt-review__list">
          {lines.map((line) => (
            <div key={line.label}>
              <dt>{line.label}</dt>
              <dd>{line.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <fieldset className="jp-opt-radio-group">
        <legend className="jp-field__label">How should this be merged?</legend>
        <label className="jp-checkbox">
          <input type="radio" name="merge-mode" checked={!overwrite} onChange={() => setOverwrite(false)} />
          <span>Fill empty fields only (keeps everything you already entered)</span>
        </label>
        <label className="jp-checkbox">
          <input type="radio" name="merge-mode" checked={overwrite} onChange={() => setOverwrite(true)} />
          <span>Overwrite existing values with the imported ones</span>
        </label>
      </fieldset>
      <p className="jp-small jp-faint">List entries (experience, education…) are added; check for duplicates afterwards. Review everything for accuracy.</p>
      <div className="jp-row">
        <Button variant="primary" onClick={() => onMerge(overwrite)} disabled={lines.length === 0} loading={busy}>
          Merge into profile
        </Button>
        <Button onClick={onDiscard} disabled={busy}>
          Discard
        </Button>
      </div>
    </div>
  );
}
