import { getPreset } from '@/shared/ai';
import { updateAiSettings } from '@/shared/storage';
import type { AiSettings } from '@/shared/types';
import { formatTimestamp } from '@/shared/utils/date';
import { Badge } from '@/ui/components/Badge';
import { Button } from '@/ui/components/Button';
import { EmptyState } from '@/ui/components/EmptyState';

export interface ProviderListProps {
  ai: AiSettings;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

export function ProviderList({ ai, selectedId, onSelect, onAdd }: ProviderListProps) {
  if (ai.providers.length === 0) {
    return (
      <EmptyState>
        <p>No provider connected yet. AI features stay off until you add one.</p>
        <p style={{ marginTop: 8 }}>
          <Button variant="primary" size="sm" onClick={onAdd}>
            Add provider
          </Button>
        </p>
      </EmptyState>
    );
  }

  const setActive = (id: string | null) =>
    void updateAiSettings((current) => {
      current.activeProviderId = id;
      return current;
    });

  return (
    <div className="jp-stack">
      <ul className="jp-opt-providers" role="radiogroup" aria-label="Active provider">
        {ai.providers.map((p) => {
          const active = ai.activeProviderId === p.id;
          const preset = getPreset(p.presetId);
          return (
            <li key={p.id} className={`${active ? 'is-active' : ''}${selectedId === p.id ? ' is-selected' : ''}`}>
              <label className="jp-opt-providers__radio">
                <input type="radio" name="jp-active-provider" checked={active} onChange={() => setActive(p.id)} />
                <span className="jp-sr-only">Use {p.name}</span>
              </label>
              <div className="jp-stack" style={{ gap: 2, minWidth: 0, flex: 1 }}>
                <span className="jp-row jp-row--wrap" style={{ gap: 6 }}>
                  <span className="jp-strong">{p.name}</span>
                  {active && <Badge tone="success">Active</Badge>}
                  {preset?.local && <Badge>Local</Badge>}
                </span>
                <span className="jp-small jp-muted jp-ellipsis">
                  {preset?.name ?? p.presetId} · {p.model || 'no model set'}
                  {preset?.requiresKey && !p.apiKey && ' · API key missing'}
                </span>
              </div>
              <div className="jp-small jp-opt-providers__test">
                {p.lastTest ? (
                  <span title={p.lastTest.message}>
                    <Badge tone={p.lastTest.ok ? 'success' : 'danger'}>{p.lastTest.ok ? 'Test passed' : 'Test failed'}</Badge>
                    <span className="jp-faint"> {formatTimestamp(p.lastTest.at)}</span>
                  </span>
                ) : (
                  <span className="jp-faint">Not tested</span>
                )}
              </div>
              <Button size="sm" onClick={() => onSelect(p.id)} aria-expanded={selectedId === p.id}>
                {selectedId === p.id ? 'Close' : 'Edit'}
              </Button>
            </li>
          );
        })}
      </ul>
      {ai.activeProviderId && (
        <div>
          <Button size="sm" variant="ghost" onClick={() => setActive(null)}>
            Turn off AI (no active provider)
          </Button>
        </div>
      )}
    </div>
  );
}
