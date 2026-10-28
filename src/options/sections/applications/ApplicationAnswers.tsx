import { useState } from 'react';
import type { ScreeningAnswer } from '@/shared/types';
import { Badge } from '@/ui/components/Badge';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';

export function ApplicationAnswers({ answers }: { answers: ScreeningAnswer[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (answer: ScreeningAnswer) => {
    try {
      await navigator.clipboard.writeText(answer.answer);
      setCopied(answer.id);
      setTimeout(() => setCopied((c) => (c === answer.id ? null : c)), 1500);
    } catch {
      setCopied(null);
    }
  };
  return (
    <Card title={`Answers (${answers.length})`}>
      {answers.length === 0 ? (
        <p className="jp-small jp-muted">No screening answers for this application.</p>
      ) : (
        <ul className="jp-opt-answers">
          {answers.map((answer) => (
            <li key={answer.id}>
              <div className="jp-row jp-row--between">
                <span className="jp-strong">{answer.question}</span>
                <span className="jp-row">
                  {answer.edited && <Badge tone="info">edited</Badge>}
                  <Button size="sm" variant="ghost" onClick={() => void copy(answer)} aria-label={`Copy answer to: ${answer.question}`}>
                    {copied === answer.id ? 'Copied' : 'Copy'}
                  </Button>
                </span>
              </div>
              <p className="jp-opt-answers__text">{answer.answer || <span className="jp-faint">No answer yet.</span>}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
