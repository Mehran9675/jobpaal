import type { Certification } from '@/shared/types';
import { createId } from '@/shared/utils/id';
import { RepeatableList } from '@/ui/components/RepeatableList';
import { TextField } from '@/ui/components/TextField';

export interface CertificationsEditorProps {
  value: Certification[];
  onChange: (value: Certification[]) => void;
}

const create = (): Certification => ({ id: createId('cert'), name: '', issuer: '', date: '', expires: '', credentialId: '', url: '' });

export function CertificationsEditor({ value, onChange }: CertificationsEditorProps) {
  return (
    <RepeatableList
      items={value}
      onChange={onChange}
      create={create}
      getKey={(c) => c.id}
      getTitle={(c) => [c.name, c.issuer].filter(Boolean).join(' · ') || 'New certification'}
      itemNoun="certification"
      addLabel="Add certification"
      emptyText="No certifications yet."
      renderItem={(c, update) => (
        <div className="jp-grid-2">
          <TextField label="Name" value={c.name} onChange={(name) => update({ ...c, name })} />
          <TextField label="Issuer" value={c.issuer} onChange={(issuer) => update({ ...c, issuer })} />
          <TextField label="Issued" value={c.date} onChange={(date) => update({ ...c, date })} placeholder="2023-05" />
          <TextField label="Expires" value={c.expires} onChange={(expires) => update({ ...c, expires })} />
          <TextField label="Credential ID" value={c.credentialId} onChange={(credentialId) => update({ ...c, credentialId })} />
          <TextField label="Verification URL" type="url" value={c.url} onChange={(url) => update({ ...c, url })} />
        </div>
      )}
    />
  );
}
