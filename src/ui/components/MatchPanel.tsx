import type { JobAnalysis } from '@/shared/types';
import { recommendationTone } from '@/ui/lib/labels';
import { Badge } from './Badge';
import { Button } from './Button';
import { Chips } from './Chips';
import { ScoreRing } from './ScoreRing';

export interface MatchPanelProps {
  analysis: JobAnalysis | null;
  aiReady: boolean;
  running?: boolean;
  canRun?: boolean;
  onRun?: () => void;
  compact?: boolean;
}

/** Score, recommendation, expandable reasons, matched and missing skills. */
export function MatchPanel({ analysis, aiReady, running, canRun = true, onRun, compact }: MatchPanelProps) {
  if (!analysis) {
    return (
      <div className="jp-stack">
        <p className="jp-muted jp-small">
          {aiReady
            ? 'No match score yet. Matching compares this job with your real profile.'
            : 'Match scoring needs an AI provider. Connect one in JobPaal → AI providers.'}
        </p>
        {onRun && (
          <Button size="sm" onClick={onRun} loading={running} disabled={!aiReady || !canRun}>
            Match
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="jp-stack">
      <div className="jp-row">
        <ScoreRing score={analysis.score} size={compact ? 40 : 52} />
        <div className="jp-stack" style={{ gap: 4, minWidth: 0, flex: 1 }}>
          <div className="jp-row jp-row--wrap">
            <Badge tone={recommendationTone(analysis.recommendation)}>{analysis.recommendation}</Badge>
            {analysis.seniority && <Badge>{analysis.seniority}</Badge>}
          </div>
          {analysis.summary && <p className="jp-small jp-muted">{analysis.summary}</p>}
        </div>
        {onRun && (
          <Button size="sm" variant="ghost" onClick={onRun} loading={running} disabled={!aiReady || !canRun} title="Run the match again">
            Re-run
          </Button>
        )}
      </div>
      {analysis.reasons.length > 0 && (
        <details>
          <summary className="jp-small jp-strong" style={{ cursor: 'pointer' }}>
            Why this score ({analysis.reasons.length})
          </summary>
          <ul className="jp-small" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {analysis.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </details>
      )}
      {analysis.matchedSkills.length > 0 && (
        <div className="jp-stack" style={{ gap: 4 }}>
          <span className="jp-small jp-strong">Matched skills</span>
          <Chips items={analysis.matchedSkills} tone="matched" limit={compact ? 8 : 16} />
        </div>
      )}
      {analysis.missingSkills.length > 0 && (
        <div className="jp-stack" style={{ gap: 4 }}>
          <span className="jp-small jp-strong">Missing skills</span>
          <Chips items={analysis.missingSkills} tone="missing" limit={compact ? 8 : 16} />
          <span className="jp-small jp-faint">Missing skills stay out of your documents.</span>
        </div>
      )}
    </div>
  );
}
