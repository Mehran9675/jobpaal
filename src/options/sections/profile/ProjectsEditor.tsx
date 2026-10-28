import type { Project } from '@/shared/types';
import { createId } from '@/shared/utils/id';
import { RepeatableList } from '@/ui/components/RepeatableList';
import { StringListEditor } from '@/ui/components/StringListEditor';
import { TagInput } from '@/ui/components/TagInput';
import { TextAreaField } from '@/ui/components/TextAreaField';
import { TextField } from '@/ui/components/TextField';

export interface ProjectsEditorProps {
  value: Project[];
  onChange: (value: Project[]) => void;
}

const create = (): Project => ({
  id: createId('proj'),
  name: '',
  role: '',
  url: '',
  startDate: '',
  endDate: '',
  description: '',
  highlights: [],
  skills: [],
});

export function ProjectsEditor({ value, onChange }: ProjectsEditorProps) {
  return (
    <RepeatableList
      items={value}
      onChange={onChange}
      create={create}
      getKey={(p) => p.id}
      getTitle={(p) => p.name || 'New project'}
      itemNoun="project"
      addLabel="Add project"
      emptyText="No projects yet."
      renderItem={(p, update) => (
        <>
          <div className="jp-grid-2">
            <TextField label="Name" value={p.name} onChange={(name) => update({ ...p, name })} />
            <TextField label="Your role" value={p.role} onChange={(role) => update({ ...p, role })} />
            <TextField className="jp-opt-span-2" label="URL" type="url" value={p.url} onChange={(url) => update({ ...p, url })} />
            <TextField label="Start date" value={p.startDate} onChange={(startDate) => update({ ...p, startDate })} placeholder="2022-01" />
            <TextField label="End date" value={p.endDate} onChange={(endDate) => update({ ...p, endDate })} />
          </div>
          <TextAreaField label="Description" value={p.description} onChange={(description) => update({ ...p, description })} rows={2} />
          <StringListEditor label="Highlights" items={p.highlights} onChange={(highlights) => update({ ...p, highlights })} multiline addLabel="Add highlight" />
          <TagInput label="Skills used" values={p.skills} onChange={(skills) => update({ ...p, skills })} />
        </>
      )}
    />
  );
}
