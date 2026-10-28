import { OUTPUT_FORMATS, type OutputFormat } from '@/shared/types';
import { Badge } from '@/ui/components/Badge';
import { Button } from '@/ui/components/Button';

export interface OutputFormatsEditorProps {
  value: OutputFormat[];
  onChange: (value: OutputFormat[]) => void;
}

/** Multi-select of output formats. The first selected format is the primary (attached) file. At least one is required. */
export function OutputFormatsEditor({ value, onChange }: OutputFormatsEditorProps) {
  const toggle = (id: OutputFormat, on: boolean) => {
    if (on) onChange([...value, id]);
    else if (value.length > 1) onChange(value.filter((f) => f !== id));
  };
  const makePrimary = (id: OutputFormat) => onChange([id, ...value.filter((f) => f !== id)]);
  return (
    <div className="jp-stack">
      <p className="jp-small jp-muted">Each tailoring run creates a file in every selected format. The primary format is the one attached to application forms.</p>
      <ul className="jp-opt-formats">
        {OUTPUT_FORMATS.map((format) => {
          const selected = value.includes(format.id);
          const primary = value[0] === format.id;
          return (
            <li key={format.id}>
              <label className="jp-checkbox">
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={selected && value.length === 1}
                  onChange={(e) => toggle(format.id, e.target.checked)}
                />
                <span>
                  {format.label} <span className="jp-faint jp-small">.{format.ext}</span>
                </span>
              </label>
              {primary ? (
                <Badge tone="info">Primary</Badge>
              ) : (
                selected && (
                  <Button size="sm" variant="ghost" onClick={() => makePrimary(format.id)}>
                    Make primary
                  </Button>
                )
              )}
            </li>
          );
        })}
      </ul>
      {value.length === 1 && <p className="jp-small jp-faint">At least one format must stay selected.</p>}
    </div>
  );
}
