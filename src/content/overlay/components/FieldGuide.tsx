import { store } from '@/content/controller/store';
import type { SiteMapping } from '@/shared/types';
import { Button } from '@/ui/components/Button';
import { GuideFormMapper } from './GuideFormMapper';
import { GuideJobFieldRow } from './GuideJobFieldRow';

const JOB_FIELDS = [
  ['title', 'Job title'],
  ['company', 'Company'],
  ['location', 'Location'],
  ['salary', 'Salary'],
  ['description', 'Description'],
] as const;

export interface FieldGuideProps {
  host: string;
  mapping: SiteMapping | null;
  disabled: boolean;
}

/** Per-site teaching tool. Everything is saved automatically for this site — no save button. */
export function FieldGuide({ host, mapping, disabled }: FieldGuideProps) {
  return (
    <div className="jp-stack">
      <div className="jp-row jp-row--between">
        <strong>Field guide · {host}</strong>
        <Button size="sm" variant="ghost" onClick={() => store.set({ tool: null })}>
          Close
        </Button>
      </div>
      <p className="jp-small jp-muted">
        Pick where each value lives on this site. Choices are saved automatically, so JobPaal reads this site correctly next time.
        Elements inside frames can be picked too.
      </p>
      {JOB_FIELDS.map(([field, label]) => (
        <GuideJobFieldRow key={field} host={host} field={field} label={label} locator={mapping?.jobFields[field]} disabled={disabled} />
      ))}
      <Button size="sm" onClick={() => store.set({ tool: 'paste' })}>
        Paste the description instead
      </Button>
      <hr className="jp-divider" />
      <strong className="jp-small">Application fields</strong>
      <GuideFormMapper host={host} mappings={mapping?.formFields ?? []} disabled={disabled} />
    </div>
  );
}
