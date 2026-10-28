import type { ProfileBasics } from '@/shared/types';
import { TextField } from '@/ui/components/TextField';
import { PhotoInput } from './PhotoInput';

export interface BasicsEditorProps {
  value: ProfileBasics;
  onChange: (value: ProfileBasics) => void;
}

export function BasicsEditor({ value, onChange }: BasicsEditorProps) {
  const set = <K extends keyof ProfileBasics>(key: K, v: ProfileBasics[K]) => onChange({ ...value, [key]: v });
  const setLoc = (key: keyof ProfileBasics['location'], v: string) => onChange({ ...value, location: { ...value.location, [key]: v } });
  return (
    <div className="jp-stack jp-stack--lg">
      <div className="jp-opt-basics">
        <PhotoInput value={value.photo} onChange={(photo) => set('photo', photo)} />
        <div className="jp-grid-2" style={{ flex: 1 }}>
          <TextField label="First name" value={value.firstName} onChange={(v) => set('firstName', v)} autoComplete="given-name" />
          <TextField label="Last name" value={value.lastName} onChange={(v) => set('lastName', v)} autoComplete="family-name" />
          <TextField
            className="jp-opt-span-2"
            label="Headline"
            value={value.headline}
            onChange={(v) => set('headline', v)}
            hint="Your own words, e.g. your current role. Tailoring never inflates it."
          />
          <TextField label="Email" type="email" value={value.email} onChange={(v) => set('email', v)} autoComplete="email" />
          <TextField label="Phone" type="tel" value={value.phone} onChange={(v) => set('phone', v)} autoComplete="tel" />
        </div>
      </div>
      <fieldset className="jp-opt-fieldset">
        <legend>Location</legend>
        <div className="jp-grid-3">
          <TextField className="jp-opt-span-3" label="Street address" value={value.location.address} onChange={(v) => setLoc('address', v)} autoComplete="street-address" />
          <TextField label="City" value={value.location.city} onChange={(v) => setLoc('city', v)} autoComplete="address-level2" />
          <TextField label="Region / state" value={value.location.region} onChange={(v) => setLoc('region', v)} autoComplete="address-level1" />
          <TextField label="Postal code" value={value.location.postalCode} onChange={(v) => setLoc('postalCode', v)} autoComplete="postal-code" />
          <TextField label="Country" value={value.location.country} onChange={(v) => setLoc('country', v)} autoComplete="country-name" />
        </div>
      </fieldset>
    </div>
  );
}
