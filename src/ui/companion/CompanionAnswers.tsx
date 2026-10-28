import { useState } from 'react';
import type { ScreeningAnswer } from '@/shared/types';
import { Button } from '@/ui/components/Button';

/** Written answers with copy buttons. */
export function CompanionAnswers({ answers }: { answers: ScreeningAnswer[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  if (!answers.length) return <p className="jp-small jp-muted">No written answers for this page.</p>;
  return (
    <div className="jp-stack" style={{ gap: 8 }}>
      {answers.map((a) => (
        <div key={a.id} className="jp-stack" style={{ gap: 2 }}>
          <div className="jp-small jp-strong">{a.question}</div>
          <div className="jp-small jp-muted" style={{ whiteSpace: 'pre-wrap' }}>
            {a.answer || <em>No answer drafted.</em>}
          </div>
          {a.answer && (
            <div>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await navigator.clipboard.writeText(a.answer);
                  setCopied(a.id);
                  setTimeout(() => setCopied(null), 1200);
                }}
              >
                {copied === a.id ? 'Copied' : 'Copy'}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
