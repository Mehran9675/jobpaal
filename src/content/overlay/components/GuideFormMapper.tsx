import { useState } from 'react';
import { pickFormField } from '@/content/controller/pickActions';
import { removeFormFieldMapping } from '@/shared/storage';
import type { FieldMapping, ProfileKey } from '@/shared/types';
import { Button } from '@/ui/components/Button';
import { SelectField } from '@/ui/components/SelectField';
import { PROFILE_KEY_OPTIONS, profileKeyLabel } from '@/ui/lib/profileKeys';

export interface GuideFormMapperProps {
  host: string;
  mappings: FieldMapping[];
  disabled: boolean;
}

/** Map individual application fields to profile values; reused on later visits. */
export function GuideFormMapper({ host, mappings, disabled }: GuideFormMapperProps) {
  const [key, setKey] = useState<ProfileKey>('firstName');
  return (
    <div className="jp-stack">
      <div className="jp-row" style={{ alignItems: 'flex-end' }}>
        <SelectField label="Profile value" value={key} options={PROFILE_KEY_OPTIONS} onChange={setKey} className="jp-grow" />
        <Button size="sm" onClick={() => pickFormField(key)} disabled={disabled}>
          Pick field
        </Button>
      </div>
      {mappings.length > 0 && (
        <ul className="jp-small" style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
          {mappings.map((m) => (
            <li key={m.locator.selector + m.locator.frameUrl} className="jp-row jp-row--between">
              <span className="jp-ellipsis">
                “{m.label}” → {m.target.type === 'profile' ? profileKeyLabel(m.target.key) : 'saved answer'}
                {m.locator.frameUrl ? ' (in frame)' : ''}
              </span>
              <Button size="sm" variant="ghost" onClick={() => removeFormFieldMapping(host, m.locator.selector)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
