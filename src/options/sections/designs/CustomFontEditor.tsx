import { useState } from 'react';
import type { CustomFont } from '@/shared/types';
import { fileToBase64 } from '@/shared/utils/base64';
import { errorMessage } from '@/shared/utils/errors';
import { Button } from '@/ui/components/Button';
import { Notice } from '@/ui/components/Notice';
import { TextField } from '@/ui/components/TextField';
import { FileButton } from '../../components/FileButton';

export interface CustomFontEditorProps {
  value: CustomFont | null;
  onChange: (value: CustomFont | null) => void;
}

const FONT_ACCEPT = '.ttf,.otf,font/ttf,font/otf';
const MAX_FONT_BYTES = 3 * 1024 * 1024;

async function readFont(file: File): Promise<string> {
  if (!/\.(ttf|otf)$/i.test(file.name)) throw new Error('Please choose a TrueType (.ttf) or OpenType (.otf) font file.');
  if (file.size > MAX_FONT_BYTES) throw new Error('This font file is larger than 3 MB. Choose a smaller font file.');
  return fileToBase64(file);
}

const nameFromFile = (fileName: string) =>
  fileName
    .replace(/\.(ttf|otf)$/i, '')
    .replace(/[-_](regular|bold|book|roman)$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();

/** Custom font used for PDF output (regular + bold). Stored locally as base64. */
export function CustomFontEditor({ value, onChange }: CustomFontEditorProps) {
  const [error, setError] = useState<string | null>(null);

  const setWeight = async (weight: 'regular' | 'bold', file: File) => {
    setError(null);
    try {
      const base64 = await readFont(file);
      const current = value ?? { name: nameFromFile(file.name), regularBase64: '', boldBase64: '' };
      const next: CustomFont =
        weight === 'regular'
          ? { ...current, regularBase64: base64, boldBase64: current.boldBase64 || base64 }
          : { ...current, boldBase64: base64, regularBase64: current.regularBase64 || base64 };
      onChange(next);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="jp-stack">
      <p className="jp-small jp-muted">
        Optional. Applies to PDF files only; other formats use standard fonts. Upload a regular and a bold file of the same family. If only one is provided it is
        used for both. Make sure your font licence allows embedding.
      </p>
      {value && <TextField label="Font name" value={value.name} onChange={(name) => onChange({ ...value, name })} />}
      <div className="jp-row jp-row--wrap">
        <FileButton size="sm" accept={FONT_ACCEPT} onFile={(f) => void setWeight('regular', f)}>
          {value?.regularBase64 ? 'Replace regular' : 'Upload regular'}
        </FileButton>
        <FileButton size="sm" accept={FONT_ACCEPT} onFile={(f) => void setWeight('bold', f)}>
          {value?.boldBase64 && value.boldBase64 !== value.regularBase64 ? 'Replace bold' : 'Upload bold'}
        </FileButton>
        {value && (
          <Button size="sm" variant="danger" onClick={() => onChange(null)}>
            Remove custom font
          </Button>
        )}
      </div>
      {value && (
        <p className="jp-small">
          Using <strong>{value.name || 'custom font'}</strong>
          {value.boldBase64 === value.regularBase64 ? ' (regular weight also used for bold)' : ' (regular and bold)'}.
        </p>
      )}
      {error && <Notice tone="danger">{error}</Notice>}
    </div>
  );
}
