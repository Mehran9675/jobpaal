import type { SkillGroup } from '@/shared/types';
import { createId } from '@/shared/utils/id';
import { TagInput } from '@/ui/components/TagInput';

export interface SkillGroupsEditorProps {
  value: SkillGroup[];
  onChange: (value: SkillGroup[]) => void;
}

export function SkillGroupsEditor({ value, onChange }: SkillGroupsEditorProps) {
  const update = (id: string, patch: Partial<SkillGroup>) => onChange(value.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  return (
    <div className="jp-stack jp-stack--lg">
      {value.length === 0 && <p className="jp-small jp-faint">Group your skills, e.g. “Languages”, “Frameworks”, “Tools”.</p>}
      {value.map((group) => (
        <div key={group.id} className="jp-opt-skillgroup">
          <div className="jp-opt-inline-row">
            <input
              className="jp-input"
              aria-label="Skill group name"
              placeholder="Group name"
              value={group.name}
              onChange={(e) => update(group.id, { name: e.target.value })}
            />
            <button
              type="button"
              className="jp-btn jp-btn--ghost jp-btn--sm jp-repeatable__remove"
              onClick={() => onChange(value.filter((g) => g.id !== group.id))}
              aria-label={`Remove group ${group.name || 'untitled'}`}
            >
              Remove group
            </button>
          </div>
          <TagInput label={`Skills${group.name ? ` in ${group.name}` : ''}`} values={group.skills} onChange={(skills) => update(group.id, { skills })} />
        </div>
      ))}
      <div>
        <button type="button" className="jp-btn jp-btn--sm" onClick={() => onChange([...value, { id: createId('sg'), name: '', skills: [] }])}>
          + Add skill group
        </button>
      </div>
    </div>
  );
}
