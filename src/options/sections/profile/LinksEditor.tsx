import type { OnlinePresence } from '@/shared/types';
import { createId } from '@/shared/utils/id';
import { TextField } from '@/ui/components/TextField';

export interface LinksEditorProps {
  value: OnlinePresence;
  onChange: (value: OnlinePresence) => void;
}

export function LinksEditor({ value, onChange }: LinksEditorProps) {
  const set = (key: Exclude<keyof OnlinePresence, 'other'>, v: string) => onChange({ ...value, [key]: v });
  const setOther = (id: string, patch: { label?: string; url?: string }) =>
    onChange({ ...value, other: value.other.map((link) => (link.id === id ? { ...link, ...patch } : link)) });
  return (
    <div className="jp-stack jp-stack--lg">
      <div className="jp-grid-2">
        <TextField label="LinkedIn" type="url" value={value.linkedin} onChange={(v) => set('linkedin', v)} placeholder="https://www.linkedin.com/in/…" />
        <TextField label="GitHub" type="url" value={value.github} onChange={(v) => set('github', v)} placeholder="https://github.com/…" />
        <TextField label="Portfolio" type="url" value={value.portfolio} onChange={(v) => set('portfolio', v)} />
        <TextField label="Website" type="url" value={value.website} onChange={(v) => set('website', v)} />
        <TextField label="X / Twitter" type="url" value={value.twitter} onChange={(v) => set('twitter', v)} />
      </div>
      <div className="jp-stack">
        <span className="jp-field__label">Other links</span>
        {value.other.map((link) => (
          <div key={link.id} className="jp-opt-inline-row">
            <input className="jp-input" aria-label="Link label" placeholder="Label (e.g. Blog)" value={link.label} onChange={(e) => setOther(link.id, { label: e.target.value })} />
            <input className="jp-input" aria-label="Link URL" type="url" placeholder="https://…" value={link.url} onChange={(e) => setOther(link.id, { url: e.target.value })} />
            <button
              type="button"
              className="jp-btn jp-btn--ghost jp-btn--sm"
              aria-label={`Remove link ${link.label || link.url}`}
              onClick={() => onChange({ ...value, other: value.other.filter((l) => l.id !== link.id) })}
            >
              ✕
            </button>
          </div>
        ))}
        <div>
          <button type="button" className="jp-btn jp-btn--sm" onClick={() => onChange({ ...value, other: [...value.other, { id: createId('link'), label: '', url: '' }] })}>
            + Add link
          </button>
        </div>
      </div>
    </div>
  );
}
