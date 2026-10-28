import type { Experience } from '@/shared/types';
import { formatDateRange } from '@/shared/utils/date';
import { createId } from '@/shared/utils/id';
import { Checkbox } from '@/ui/components/Checkbox';
import { RepeatableList } from '@/ui/components/RepeatableList';
import { StringListEditor } from '@/ui/components/StringListEditor';
import { TagInput } from '@/ui/components/TagInput';
import { TextAreaField } from '@/ui/components/TextAreaField';
import { TextField } from '@/ui/components/TextField';

export interface ExperienceEditorProps {
  value: Experience[];
  onChange: (value: Experience[]) => void;
}

const DATE_HINT = 'YYYY-MM or YYYY';
const create = (): Experience => ({
  id: createId('exp'),
  company: '',
  title: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
  highlights: [],
  skills: [],
});

export function ExperienceEditor({ value, onChange }: ExperienceEditorProps) {
  return (
    <RepeatableList
      items={value}
      onChange={onChange}
      create={create}
      getKey={(e) => e.id}
      getTitle={(e) => (
        <>
          {[e.title, e.company].filter(Boolean).join(' · ') || 'New role'}
          <span className="jp-faint jp-small"> {formatDateRange(e.startDate, e.endDate, e.current)}</span>
        </>
      )}
      itemNoun="role"
      addLabel="Add role"
      emptyText="No work experience yet."
      renderItem={(e, update) => (
        <>
          <div className="jp-grid-2">
            <TextField label="Job title" value={e.title} onChange={(title) => update({ ...e, title })} />
            <TextField label="Company" value={e.company} onChange={(company) => update({ ...e, company })} />
            <TextField label="Location" value={e.location} onChange={(location) => update({ ...e, location })} />
            <div />
            <TextField label="Start date" value={e.startDate} onChange={(startDate) => update({ ...e, startDate })} placeholder="2021-04" hint={DATE_HINT} />
            <TextField
              label="End date"
              value={e.current ? '' : e.endDate}
              disabled={e.current}
              onChange={(endDate) => update({ ...e, endDate })}
              placeholder={e.current ? 'Present' : '2023-09'}
              hint={DATE_HINT}
            />
          </div>
          <Checkbox label="I currently work here" checked={e.current} onChange={(current) => update({ ...e, current, endDate: current ? '' : e.endDate })} />
          <TextAreaField label="Description" value={e.description} onChange={(description) => update({ ...e, description })} rows={3} />
          <StringListEditor
            label="Highlights"
            items={e.highlights}
            onChange={(highlights) => update({ ...e, highlights })}
            multiline
            addLabel="Add highlight"
            hint="Concrete achievements. Only include metrics you can stand behind."
          />
          <TagInput label="Skills used" values={e.skills} onChange={(skills) => update({ ...e, skills })} />
        </>
      )}
    />
  );
}
