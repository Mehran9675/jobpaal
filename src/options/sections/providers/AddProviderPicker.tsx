import { useMemo, useState } from 'react';
import { PROVIDER_PRESETS } from '@/shared/ai';
import type { ProviderPreset } from '@/shared/types';
import { Badge } from '@/ui/components/Badge';
import { TextField } from '@/ui/components/TextField';
import { searchPresets } from '../../lib/providers';

export interface AddProviderPickerProps {
  onPick: (preset: ProviderPreset) => void;
}

/** Searchable list of preconfigured providers, grouped into cloud and local. */
export function AddProviderPicker({ onPick }: AddProviderPickerProps) {
  const [query, setQuery] = useState('');
  const found = useMemo(() => searchPresets(PROVIDER_PRESETS ?? [], query), [query]);
  const groups: { title: string; items: ProviderPreset[] }[] = [
    { title: 'Cloud providers', items: found.filter((p) => !p.local) },
    { title: 'Local models', items: found.filter((p) => p.local) },
  ];
  return (
    <div className="jp-stack jp-stack--lg">
      <TextField label="Search providers" type="search" value={query} onChange={setQuery} placeholder="e.g. OpenAI, Claude, Ollama" autoFocus />
      {found.length === 0 && <p className="jp-small jp-muted">No provider matches “{query}”. Try “OpenAI-compatible” for any compatible endpoint.</p>}
      {groups
        .filter((g) => g.items.length)
        .map((group) => (
          <section key={group.title} className="jp-stack">
            <h3 className="jp-opt-subheading">{group.title}</h3>
            <ul className="jp-opt-presets">
              {group.items.map((preset) => (
                <li key={preset.id}>
                  <button type="button" className="jp-opt-preset" onClick={() => onPick(preset)}>
                    <span className="jp-row jp-row--between">
                      <span className="jp-strong">{preset.name}</span>
                      {!preset.requiresKey && <Badge>No key</Badge>}
                    </span>
                    <span className="jp-small jp-muted jp-ellipsis">{preset.notes || preset.defaultModel || preset.baseUrl}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
