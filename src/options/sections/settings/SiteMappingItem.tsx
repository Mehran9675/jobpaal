import { useState } from 'react';
import { removeFormFieldMapping } from '@/shared/storage';
import type { SiteMapping } from '@/shared/types';
import { formatDay } from '@/shared/utils/date';
import { Button } from '@/ui/components/Button';

export interface SiteMappingItemProps {
  mapping: SiteMapping;
  onDelete: () => void;
}

export function SiteMappingItem({ mapping, onDelete }: SiteMappingItemProps) {
  const [open, setOpen] = useState(false);
  const jobFields = Object.keys(mapping.jobFields);
  return (
    <li>
      <div className="jp-row jp-row--between">
        <div className="jp-stack" style={{ gap: 2, minWidth: 0 }}>
          <span className="jp-strong">{mapping.host}</span>
          <span className="jp-small jp-muted">
            {jobFields.length ? `Job fields: ${jobFields.join(', ')}` : 'No job fields'} · {mapping.formFields.length} form field
            {mapping.formFields.length === 1 ? '' : 's'} · updated {formatDay(mapping.updatedAt)}
          </span>
        </div>
        <div className="jp-row">
          {mapping.formFields.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              {open ? 'Hide fields' : 'Show fields'}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="jp-opt-danger-text" onClick={onDelete}>
            Forget site
          </Button>
        </div>
      </div>
      {open && (
        <ul className="jp-opt-mapping-fields">
          {mapping.formFields.map((field) => (
            <li key={`${field.locator.frameUrl}|${field.locator.selector}`}>
              <span className="jp-small">
                <strong>{field.label || field.locator.textSample || field.locator.selector}</strong> →{' '}
                {field.target.type === 'profile' ? field.target.key : 'saved answer'}
              </span>
              <Button size="sm" variant="ghost" onClick={() => void removeFormFieldMapping(mapping.host, field.locator.selector)} aria-label={`Remove mapping ${field.label}`}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
