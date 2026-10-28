import type { Award } from '@/shared/types';
import { createId } from '@/shared/utils/id';
import { RepeatableList } from '@/ui/components/RepeatableList';
import { TextAreaField } from '@/ui/components/TextAreaField';
import { TextField } from '@/ui/components/TextField';

export interface AwardsEditorProps {
  value: Award[];
  onChange: (value: Award[]) => void;
}

const create = (): Award => ({ id: createId('award'), title: '', issuer: '', date: '', description: '' });

export function AwardsEditor({ value, onChange }: AwardsEditorProps) {
  return (
    <RepeatableList
      items={value}
      onChange={onChange}
      create={create}
      getKey={(a) => a.id}
      getTitle={(a) => [a.title, a.issuer].filter(Boolean).join(' · ') || 'New award'}
      itemNoun="award"
      addLabel="Add award"
      emptyText="No awards yet."
      renderItem={(a, update) => (
        <>
          <div className="jp-grid-3">
            <TextField label="Title" value={a.title} onChange={(title) => update({ ...a, title })} />
            <TextField label="Issuer" value={a.issuer} onChange={(issuer) => update({ ...a, issuer })} />
            <TextField label="Date" value={a.date} onChange={(date) => update({ ...a, date })} />
          </div>
          <TextAreaField label="Description" value={a.description} onChange={(description) => update({ ...a, description })} rows={2} />
        </>
      )}
    />
  );
}
