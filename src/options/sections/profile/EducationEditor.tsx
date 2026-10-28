import type { Education } from '@/shared/types';
import { createId } from '@/shared/utils/id';
import { RepeatableList } from '@/ui/components/RepeatableList';
import { TextAreaField } from '@/ui/components/TextAreaField';
import { TextField } from '@/ui/components/TextField';

export interface EducationEditorProps {
  value: Education[];
  onChange: (value: Education[]) => void;
}

const create = (): Education => ({
  id: createId('edu'),
  institution: '',
  degree: '',
  field: '',
  location: '',
  startDate: '',
  endDate: '',
  grade: '',
  description: '',
});

export function EducationEditor({ value, onChange }: EducationEditorProps) {
  return (
    <RepeatableList
      items={value}
      onChange={onChange}
      create={create}
      getKey={(e) => e.id}
      getTitle={(e) => [e.degree, e.field, e.institution].filter(Boolean).join(' · ') || 'New education'}
      itemNoun="education entry"
      addLabel="Add education"
      emptyText="No education yet."
      renderItem={(e, update) => (
        <>
          <div className="jp-grid-2">
            <TextField label="Institution" value={e.institution} onChange={(institution) => update({ ...e, institution })} />
            <TextField label="Location" value={e.location} onChange={(location) => update({ ...e, location })} />
            <TextField label="Degree" value={e.degree} onChange={(degree) => update({ ...e, degree })} placeholder="BSc" />
            <TextField label="Field of study" value={e.field} onChange={(field) => update({ ...e, field })} />
            <TextField label="Start date" value={e.startDate} onChange={(startDate) => update({ ...e, startDate })} placeholder="2016-09" />
            <TextField label="End date" value={e.endDate} onChange={(endDate) => update({ ...e, endDate })} placeholder="2020-06" />
            <TextField label="Grade" value={e.grade} onChange={(grade) => update({ ...e, grade })} />
          </div>
          <TextAreaField label="Description" value={e.description} onChange={(description) => update({ ...e, description })} rows={2} />
        </>
      )}
    />
  );
}
