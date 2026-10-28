import type { LanguageSkill } from '@/shared/types';
import { createId } from '@/shared/utils/id';

export interface LanguagesEditorProps {
  value: LanguageSkill[];
  onChange: (value: LanguageSkill[]) => void;
}

const FLUENCY = ['Native', 'Fluent', 'Professional', 'Conversational', 'Basic'];

export function LanguagesEditor({ value, onChange }: LanguagesEditorProps) {
  const update = (id: string, patch: Partial<LanguageSkill>) => onChange(value.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  return (
    <div className="jp-stack">
      {value.length === 0 && <p className="jp-small jp-faint">No languages yet.</p>}
      <datalist id="jp-opt-fluency">
        {FLUENCY.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>
      {value.map((lang) => (
        <div key={lang.id} className="jp-opt-inline-row">
          <input className="jp-input" aria-label="Language" placeholder="Language" value={lang.language} onChange={(e) => update(lang.id, { language: e.target.value })} />
          <input
            className="jp-input"
            aria-label={`Fluency in ${lang.language || 'language'}`}
            placeholder="Fluency"
            list="jp-opt-fluency"
            value={lang.fluency}
            onChange={(e) => update(lang.id, { fluency: e.target.value })}
          />
          <button type="button" className="jp-btn jp-btn--ghost jp-btn--sm" aria-label={`Remove ${lang.language || 'language'}`} onClick={() => onChange(value.filter((l) => l.id !== lang.id))}>
            ✕
          </button>
        </div>
      ))}
      <div>
        <button type="button" className="jp-btn jp-btn--sm" onClick={() => onChange([...value, { id: createId('lang'), language: '', fluency: '' }])}>
          + Add language
        </button>
      </div>
    </div>
  );
}
