import { useId } from 'react';
import type { CoverLetterContent } from '@/shared/types';
import { wordCount } from '@/shared/utils/text';

export interface CoverLetterEditorProps {
  value: CoverLetterContent;
  onChange: (value: CoverLetterContent) => void;
}

/** Plain text cover letter editor. Paragraphs are separated by blank lines. */
export function CoverLetterEditor({ value, onChange }: CoverLetterEditorProps) {
  const id = useId();
  const words = wordCount(value.text);
  return (
    <div className="jp-editor">
      <div className="jp-field">
        <div className="jp-row jp-row--between">
          <label htmlFor={id} className="jp-field__label">
            Cover letter{value.company ? ` for ${value.company}` : ''}
          </label>
          <span className="jp-small jp-faint" aria-live="polite">
            {words} {words === 1 ? 'word' : 'words'}
          </span>
        </div>
        <textarea id={id} className="jp-textarea jp-editor__letter" rows={20} value={value.text} onChange={(e) => onChange({ ...value, text: e.target.value })} />
        <span className="jp-field__hint">Separate paragraphs with a blank line. Keep every claim true.</span>
      </div>
    </div>
  );
}
