import { useId, useState } from 'react';
import { Badge } from '@/ui/components/Badge';
import { Button } from '@/ui/components/Button';

export interface TaskTemplateEditorProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}

/** Instruction override for one AI task. Empty means the built-in template. */
export function TaskTemplateEditor({ label, description, value, onChange }: TaskTemplateEditorProps) {
  const id = useId();
  const custom = value.trim().length > 0;
  const [open, setOpen] = useState(custom);
  return (
    <div className="jp-opt-template">
      <div className="jp-row jp-row--between">
        <div className="jp-stack" style={{ gap: 0 }}>
          <span className="jp-row" style={{ gap: 6 }}>
            <span className="jp-strong">{label}</span>
            {custom ? <Badge tone="info">Custom</Badge> : <Badge>Built-in</Badge>}
          </span>
          <span className="jp-small jp-muted">{description}</span>
        </div>
        <div className="jp-row">
          {custom && (
            <Button size="sm" variant="ghost" onClick={() => onChange('')}>
              Use built-in
            </Button>
          )}
          <Button size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={id}>
            {open ? 'Close' : 'Customise'}
          </Button>
        </div>
      </div>
      {open && (
        <textarea
          id={id}
          className="jp-textarea"
          rows={5}
          value={value}
          aria-label={`${label} instructions`}
          placeholder="Empty: the built-in instructions are used."
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
