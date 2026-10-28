import { useState } from 'react';
import { sendToContent, type ContentRequestType, type ContentState } from '@/shared/messaging';
import { checkJobDescriptionProse } from '@/shared/text/prose';
import { errorMessage } from '@/shared/utils/errors';
import { Button } from '@/ui/components/Button';
import { Notice } from '@/ui/components/Notice';
import { TextAreaField } from '@/ui/components/TextAreaField';

export interface CompanionActionsProps {
  tabId: number;
  state: ContentState;
  hasDocuments: boolean;
  aiReady: boolean;
  onChanged: () => void;
}

/** Tailor and fill, Fill this form, Show overlay here, Select fields, Paste JD, Match. */
export function CompanionActions({ tabId, state, hasDocuments, aiReady, onChanged }: CompanionActionsProps) {
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const run = async (label: string, type: ContentRequestType, payload: object = {}) => {
    setRunning(label);
    setResult(null);
    try {
      const response = (await sendToContent(tabId, type as never, payload as never)) as { ok?: boolean; message?: string } | undefined;
      if (response && typeof response.message === 'string') setResult({ ok: response.ok !== false, message: response.message });
    } catch (error) {
      setResult({ ok: false, message: errorMessage(error) });
    } finally {
      setRunning(null);
      onChanged();
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (checkJobDescriptionProse(text).ok) {
        await run('paste', 'content:pasteDescription', { text, source: 'clipboard' });
        return;
      }
      setPasteText(text);
    } catch {
      /* clipboard not readable: show the paste box */
    }
    setPasteOpen(true);
  };

  const pasteCheck = pasteText.trim() ? checkJobDescriptionProse(pasteText) : null;
  const busy = Boolean(running || state.busy);
  const canTailor = aiReady && state.detection.hasValidDescription;

  return (
    <div className="jp-stack">
      <div className="jp-grid-2" style={{ gap: 6 }}>
        <Button
          variant="primary"
          onClick={() => run('tailor', hasDocuments ? 'content:fill' : 'content:tailorAndFill')}
          loading={running === 'tailor'}
          disabled={busy || (!hasDocuments && !canTailor)}
          title={!aiReady ? 'Connect an AI provider to tailor documents' : undefined}
          style={{ gridColumn: '1 / -1' }}
        >
          {hasDocuments ? 'Fill this page' : 'Tailor and fill'}
        </Button>
        <Button onClick={() => run('fill', 'content:fill')} loading={running === 'fill'} disabled={busy}>
          Fill this form
        </Button>
        <Button onClick={() => run('forced', 'content:setForced', { forced: !state.forced })} disabled={busy}>
          {state.forced ? 'Hide overlay here' : 'Show overlay here'}
        </Button>
        <Button onClick={() => run('pick', 'content:openOverlay', { tool: 'pick' })} disabled={busy}>
          Select fields
        </Button>
        <Button onClick={pasteFromClipboard} loading={running === 'paste'} disabled={busy}>
          Paste JD
        </Button>
        <Button
          onClick={() => run('match', 'content:match')}
          loading={running === 'match'}
          disabled={busy || !aiReady || !state.detection.hasValidDescription}
          style={{ gridColumn: '1 / -1' }}
        >
          Match
        </Button>
      </div>
      {pasteOpen && (
        <div className="jp-stack">
          <TextAreaField
            label="Paste the job description"
            value={pasteText}
            onChange={setPasteText}
            rows={6}
            hint={pasteCheck ? (pasteCheck.ok ? `${pasteCheck.words} words — looks like a job description.` : pasteCheck.reason) : undefined}
          />
          <div className="jp-row">
            <Button
              size="sm"
              variant="primary"
              disabled={!pasteCheck?.ok}
              onClick={async () => {
                await run('paste', 'content:pasteDescription', { text: pasteText, source: 'pasted' });
                setPasteOpen(false);
                setPasteText('');
              }}
            >
              Use description
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPasteOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {result && <Notice tone={result.ok ? 'success' : 'warning'}>{result.message}</Notice>}
    </div>
  );
}
