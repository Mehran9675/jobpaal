import { useState } from 'react';
import { pasteDescription } from '@/content/controller/jobActions';
import { store } from '@/content/controller/store';
import { checkJobDescriptionProse } from '@/shared/text/prose';
import { Button } from '@/ui/components/Button';
import { TextAreaField } from '@/ui/components/TextAreaField';

/** Paste box for a job description, validated with the same prose rule as detection. */
export function PasteBox() {
  const [text, setText] = useState('');
  const check = text.trim() ? checkJobDescriptionProse(text) : null;
  return (
    <div className="jp-stack">
      <TextAreaField
        label="Paste the job description"
        value={text}
        onChange={setText}
        rows={8}
        placeholder="Paste the full description (responsibilities, requirements…)"
        hint={check ? (check.ok ? `${check.words} words — reads like a job description.` : check.reason) : undefined}
      />
      <div className="jp-row">
        <Button variant="primary" size="sm" disabled={!check?.ok} onClick={() => pasteDescription(text, 'pasted')}>
          Use this description
        </Button>
        <Button size="sm" variant="ghost" onClick={() => store.set({ tool: null })}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
