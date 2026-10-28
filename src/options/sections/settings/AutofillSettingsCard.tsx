import { updateSettings } from '@/shared/storage';
import type { AutofillSettings } from '@/shared/types';
import { Card } from '@/ui/components/Card';
import { Notice } from '@/ui/components/Notice';
import { Toggle } from '@/ui/components/Toggle';

export interface AutofillSettingsCardProps {
  autofill: AutofillSettings;
  alwaysCoverLetter: boolean;
}

const OPTIONS: { key: keyof AutofillSettings; label: string; hint: string }[] = [
  { key: 'fillAfterTailor', label: 'Fill the form right after tailoring', hint: 'Tailor and fill fills the form as soon as documents are ready.' },
  { key: 'overwriteExisting', label: 'Overwrite fields that already have a value', hint: 'Off: only empty fields are filled.' },
  { key: 'highlightFilled', label: 'Highlight filled fields', hint: 'So you can check every value before submitting.' },
  { key: 'attachResume', label: 'Attach the resume file to upload fields', hint: 'Uses the primary output format.' },
  { key: 'attachCoverLetter', label: 'Attach the cover letter file when the form asks for one', hint: '' },
  {
    key: 'fillEeo',
    label: 'Fill equal-opportunity (EEO) questions',
    hint: 'Only when the EEO answers are also switched on in My profile. Otherwise they are never filled.',
  },
];

export function AutofillSettingsCard({ autofill, alwaysCoverLetter }: AutofillSettingsCardProps) {
  const set = (patch: Partial<AutofillSettings>) =>
    void updateSettings((s) => {
      s.autofill = { ...s.autofill, ...patch };
      return s;
    });
  return (
    <Card title="Autofill and documents">
      <div className="jp-stack jp-stack--lg">
        <ul className="jp-opt-toggles">
          {OPTIONS.map((option) => (
            <li key={option.key}>
              <Toggle checked={autofill[option.key]} onChange={(on) => set({ [option.key]: on })} label={option.label} />
              {option.hint && <span className="jp-small jp-faint">{option.hint}</span>}
            </li>
          ))}
          <li>
            <Toggle
              checked={alwaysCoverLetter}
              onChange={(on) =>
                void updateSettings((s) => {
                  s.alwaysCoverLetter = on;
                  return s;
                })
              }
              label="Always write a cover letter"
            />
            <span className="jp-small jp-faint">Off: a cover letter is only written when the form has a cover-letter field, or when you ask for one.</span>
          </li>
        </ul>
        <Notice tone="info">
          <strong>Tip:</strong> some websites only register input that is typed by hand. If a site says a filled field is empty when you submit, click into the
          field and type a character (then delete it) — the value JobPaal placed is then accepted. JobPaal never submits forms for you.
        </Notice>
      </div>
    </Card>
  );
}
