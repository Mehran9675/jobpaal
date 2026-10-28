import { useState } from 'react';
import { extractTextFromFile, jsonResumeToProfile } from '@/shared/import';
import { sendToBackground } from '@/shared/messaging/client';
import type { Profile } from '@/shared/types';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { AiRequiredNotice } from '../../components/AiRequiredNotice';
import { ActionFeedback } from '../../components/ActionFeedback';
import { FileButton } from '../../components/FileButton';
import { useActiveProvider } from '../../hooks/useActiveProvider';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { importFileKind, looksLikeJsonResume } from '../../lib/importSummary';
import { ImportReview } from './ImportReview';

export interface ResumeImportProps {
  onMerge: (incoming: Partial<Profile>, overwrite: boolean) => Promise<void>;
}

interface Found {
  data: Partial<Profile>;
  sourceLabel: string;
}

function tryParseJsonResume(text: string): Partial<Profile> | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const json: unknown = JSON.parse(trimmed);
    return looksLikeJsonResume(json) ? jsonResumeToProfile(json) : null;
  } catch {
    return null;
  }
}

/** Resume import from a file (PDF, DOCX, JSON Resume, TXT, MD) or pasted text. */
export function ResumeImport({ onMerge }: ResumeImportProps) {
  const provider = useActiveProvider();
  const aiReady = Boolean(provider);
  const action = useAsyncAction();
  const [paste, setPaste] = useState('');
  const [found, setFound] = useState<Found | null>(null);

  const parseWithAi = async (text: string): Promise<Partial<Profile>> => {
    if (!aiReady) throw new Error('Parsing this format needs an AI provider. Connect one in AI providers, or import a JSON Resume file.');
    if (text.trim().length < 40) throw new Error('There is not enough text to parse.');
    const result = await sendToBackground('ai:parse-resume', { text });
    return result.profile;
  };

  const onFile = (file: File) =>
    action.run('file', async () => {
      const kind = importFileKind(file.name);
      if (kind === 'unsupported') throw new Error('Unsupported file type. Use PDF, DOCX, JSON, TXT or MD.');
      if (kind === 'json') {
        const data = tryParseJsonResume(await file.text());
        if (!data) throw new Error('This JSON file is not a JSON Resume document (jsonresume.org).');
        setFound({ data, sourceLabel: `${file.name} (converted locally, no AI)` });
        return;
      }
      if (!aiReady) throw new Error('Parsing PDF, DOCX and text resumes needs an AI provider. Connect one in AI providers, or import a JSON Resume file.');
      const text = await extractTextFromFile(file);
      if (!text.trim()) throw new Error('No text could be read from this file. If it is a scanned PDF, paste the text instead.');
      setFound({ data: await parseWithAi(text), sourceLabel: file.name });
    });

  const onPaste = () =>
    action.run('paste', async () => {
      const json = tryParseJsonResume(paste);
      if (json) {
        setFound({ data: json, sourceLabel: 'pasted JSON Resume (converted locally, no AI)' });
        return;
      }
      setFound({ data: await parseWithAi(paste), sourceLabel: 'pasted text' });
    });

  const merge = (overwrite: boolean) =>
    action.run(
      'merge',
      async () => {
        if (!found) return;
        await onMerge(found.data, overwrite);
        setFound(null);
        setPaste('');
      },
      'Imported data merged and saved. Please review your profile below.',
    );

  return (
    <Card title="Import a resume">
      <div className="jp-stack">
        <p className="jp-small jp-muted">
          JSON Resume files are converted locally without AI. PDF, DOCX, TXT, MD and pasted text are parsed by your AI provider into profile fields.
        </p>
        {provider === null && <AiRequiredNotice>Parsing PDF, DOCX and text resumes uses AI.</AiRequiredNotice>}
        {found ? (
          <ImportReview data={found.data} sourceLabel={found.sourceLabel} busy={action.busy === 'merge'} onMerge={merge} onDiscard={() => setFound(null)} />
        ) : (
          <>
            <div className="jp-row jp-row--wrap">
              <FileButton
                accept=".pdf,.docx,.json,.txt,.md,.markdown,application/pdf,application/json,text/plain,text/markdown"
                disabled={Boolean(action.busy)}
                loading={action.busy === 'file'}
                onFile={(file) => void onFile(file)}
              >
                Choose file…
              </FileButton>
              <span className="jp-small jp-faint">PDF, DOCX, JSON Resume, TXT, MD</span>
            </div>
            <label className="jp-field">
              <span className="jp-field__label">Or paste your resume</span>
              <textarea className="jp-textarea" rows={5} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Paste resume text or JSON Resume here" />
            </label>
            <div>
              <Button onClick={onPaste} disabled={!paste.trim() || (!aiReady && !paste.trim().startsWith('{'))} loading={action.busy === 'paste'}>
                {aiReady ? 'Parse pasted text' : 'Convert pasted JSON Resume'}
              </Button>
            </div>
          </>
        )}
        <ActionFeedback error={action.error} message={action.message} />
      </div>
    </Card>
  );
}
