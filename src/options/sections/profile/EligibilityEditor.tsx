import type { WorkEligibility } from '@/shared/types';
import { SelectField } from '@/ui/components/SelectField';
import { TextField } from '@/ui/components/TextField';

export interface EligibilityEditorProps {
  value: WorkEligibility;
  onChange: (value: WorkEligibility) => void;
}

const YES_NO = [
  { value: '' as const, label: 'Not set' },
  { value: 'yes' as const, label: 'Yes' },
  { value: 'no' as const, label: 'No' },
];

export function EligibilityEditor({ value, onChange }: EligibilityEditorProps) {
  const set = <K extends keyof WorkEligibility>(key: K, v: WorkEligibility[K]) => onChange({ ...value, [key]: v });
  return (
    <div className="jp-stack">
      <p className="jp-small jp-muted">Used to fill common application questions. Leave anything blank that you prefer to answer per application.</p>
      <div className="jp-grid-2">
        <TextField
          className="jp-opt-span-2"
          label="Countries you are authorised to work in"
          value={value.authorizedCountries}
          onChange={(v) => set('authorizedCountries', v)}
          placeholder="e.g. United Kingdom, Ireland"
        />
        <SelectField label="Requires visa sponsorship" value={value.requiresSponsorship} options={YES_NO} onChange={(v) => set('requiresSponsorship', v)} />
        <SelectField label="Willing to relocate" value={value.willingToRelocate} options={YES_NO} onChange={(v) => set('willingToRelocate', v)} />
        <SelectField
          label="Work arrangement preference"
          value={value.remotePreference}
          options={[
            { value: '', label: 'Not set' },
            { value: 'remote', label: 'Remote' },
            { value: 'hybrid', label: 'Hybrid' },
            { value: 'onsite', label: 'On-site' },
            { value: 'any', label: 'Any' },
          ]}
          onChange={(v) => set('remotePreference', v)}
        />
        <SelectField label="Driver's licence" value={value.hasDriversLicense} options={YES_NO} onChange={(v) => set('hasDriversLicense', v)} />
        <TextField label="Notice period" value={value.noticePeriod} onChange={(v) => set('noticePeriod', v)} placeholder="e.g. 4 weeks" />
        <TextField label="Available from" value={value.availableFrom} onChange={(v) => set('availableFrom', v)} placeholder="e.g. 2026-12-01 or Immediately" />
        <TextField className="jp-opt-span-2" label="Salary expectation" value={value.salaryExpectation} onChange={(v) => set('salaryExpectation', v)} />
      </div>
    </div>
  );
}
