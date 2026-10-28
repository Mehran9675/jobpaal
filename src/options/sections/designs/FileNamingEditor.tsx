import { useEffect, useState } from 'react';
import { buildFileName } from '@/shared/documents';
import { OUTPUT_FORMATS, type FileNamingSettings, type OutputFormat } from '@/shared/types';
import { Button } from '@/ui/components/Button';
import { TextField } from '@/ui/components/TextField';
import { useProfile } from '@/ui/hooks/useProfile';

export interface FileNamingEditorProps {
  value: FileNamingSettings;
  onChange: (value: FileNamingSettings) => void;
  primaryFormat: OutputFormat;
}

const DEFAULT_PATTERN = '{first}-{last}-{kind}';
const TOKENS: { token: string; meaning: string }[] = [
  { token: '{first}', meaning: 'your first name' },
  { token: '{last}', meaning: 'your last name' },
  { token: '{kind}', meaning: 'resume, cover-letter or answers' },
  { token: '{date}', meaning: "the date the file was created" },
];

function safeExample(pattern: string, person: { firstName: string; lastName: string }, ext: string): string {
  try {
    return buildFileName(pattern || DEFAULT_PATTERN, person, 'resume', ext);
  } catch {
    return '';
  }
}

export function FileNamingEditor({ value, onChange, primaryFormat }: FileNamingEditorProps) {
  const profile = useProfile();
  const [draft, setDraft] = useState(value.pattern);
  useEffect(() => setDraft(value.pattern), [value.pattern]);

  const person = {
    firstName: profile?.basics.firstName || 'Alex',
    lastName: profile?.basics.lastName || 'Example',
  };
  const ext = OUTPUT_FORMATS.find((f) => f.id === primaryFormat)?.ext ?? 'pdf';
  const example = safeExample(draft, person, ext);
  const commit = () => {
    const pattern = draft.trim() || DEFAULT_PATTERN;
    if (pattern !== value.pattern) onChange({ pattern });
    setDraft(pattern);
  };

  return (
    <div className="jp-stack">
      <TextField
        label="File name pattern"
        value={draft}
        onChange={setDraft}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        spellCheck={false}
        hint="Saved when you leave the field."
      />
      <ul className="jp-opt-tokens">
        {TOKENS.map((t) => (
          <li key={t.token}>
            <button type="button" className="jp-opt-token" onClick={() => setDraft((d) => d + t.token)} title={`Insert ${t.token}`}>
              {t.token}
            </button>{' '}
            <span className="jp-small jp-muted">{t.meaning}</span>
          </li>
        ))}
      </ul>
      <p className="jp-small">
        Example: <code className="jp-opt-code">{example || '—'}</code>
      </p>
      <p className="jp-small jp-faint">
        File names never include the employer or the role, so the files you send do not reveal which other jobs you applied to. Other tokens are ignored.
      </p>
      {draft !== DEFAULT_PATTERN && (
        <div>
          <Button size="sm" variant="ghost" onClick={() => onChange({ pattern: DEFAULT_PATTERN })}>
            Reset to default
          </Button>
        </div>
      )}
    </div>
  );
}
