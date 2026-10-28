import type { EeoAnswers } from '@/shared/types';
import { Notice } from '@/ui/components/Notice';
import { TextField } from '@/ui/components/TextField';
import { Toggle } from '@/ui/components/Toggle';

export interface EeoEditorProps {
  value: EeoAnswers;
  onChange: (value: EeoAnswers) => void;
}

const FIELDS: { key: Exclude<keyof EeoAnswers, 'enabled'>; label: string; suggestions: string[] }[] = [
  { key: 'gender', label: 'Gender', suggestions: ['Woman', 'Man', 'Non-binary', 'Prefer not to say'] },
  { key: 'pronouns', label: 'Pronouns', suggestions: ['she/her', 'he/him', 'they/them', 'Prefer not to say'] },
  { key: 'ethnicity', label: 'Ethnicity', suggestions: ['Hispanic or Latino', 'Not Hispanic or Latino', 'Prefer not to say'] },
  { key: 'race', label: 'Race', suggestions: ['Prefer not to say'] },
  { key: 'veteranStatus', label: 'Veteran status', suggestions: ['I am not a protected veteran', 'I am a protected veteran', 'Prefer not to say'] },
  { key: 'disabilityStatus', label: 'Disability status', suggestions: ['No, I do not have a disability', 'Yes, I have a disability', 'Prefer not to say'] },
  { key: 'sexualOrientation', label: 'Sexual orientation', suggestions: ['Prefer not to say'] },
];

/** Optional equal-opportunity answers with an explicit opt-in. */
export function EeoEditor({ value, onChange }: EeoEditorProps) {
  return (
    <div className="jp-stack jp-stack--lg">
      <Notice>
        These answers are optional and stay in this browser. They are only used to fill equal-opportunity questions when <strong>both</strong> the switch below
        is on <strong>and</strong> “Fill EEO questions” is enabled in <a href="#settings">Settings → Autofill</a>. Otherwise these fields are never filled.
      </Notice>
      <Toggle checked={value.enabled} onChange={(enabled) => onChange({ ...value, enabled })} label="Use my EEO answers when filling forms" />
      <div className="jp-grid-2" aria-disabled={!value.enabled}>
        {FIELDS.map((field) => (
          <div key={field.key}>
            <TextField
              label={field.label}
              value={value[field.key]}
              onChange={(v) => onChange({ ...value, [field.key]: v })}
              list={`jp-opt-eeo-${field.key}`}
              placeholder="Not set"
            />
            <datalist id={`jp-opt-eeo-${field.key}`}>
              {field.suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        ))}
      </div>
    </div>
  );
}
