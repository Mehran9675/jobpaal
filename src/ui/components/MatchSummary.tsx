import { useState } from 'react';
import type { JobAnalysis, MatchRecommendation } from '@/shared/types';
import { Badge } from './Badge';
import { Chips } from './Chips';
import { ScoreRing } from './ScoreRing';

export interface MatchSummaryProps {
  analysis: JobAnalysis;
  /** Compact: reasons collapsed and chip lists limited. */
  compact?: boolean;
  /** Also show seniority, summary and red flags. */
  detailed?: boolean;
}

const RECOMMENDATION_TONE: Record<MatchRecommendation, 'success' | 'info' | 'warning' | 'danger'> = {
  'strong match': 'success',
  'good match': 'info',
  stretch: 'warning',
  'weak match': 'danger',
};

/** Score ring, recommendation, reasons and matched / missing skills. */
export function MatchSummary({ analysis, compact, detailed }: MatchSummaryProps) {
  const [showReasons, setShowReasons] = useState(!compact);
  const limit = compact ? 8 : undefined;
  return (
    <div className="jp-match">
      <div className="jp-match__head">
        <ScoreRing score={analysis.score} size={compact ? 44 : 56} />
        <div className="jp-stack" style={{ gap: 4 }}>
          <Badge tone={RECOMMENDATION_TONE[analysis.recommendation] ?? 'neutral'}>{analysis.recommendation}</Badge>
          {detailed && analysis.seniority && <span className="jp-small jp-muted">Seniority: {analysis.seniority}</span>}
        </div>
      </div>
      {detailed && analysis.summary && <p className="jp-small">{analysis.summary}</p>}
      {analysis.reasons.length > 0 && (
        <div>
          {compact && (
            <button type="button" className="jp-btn jp-btn--ghost jp-btn--sm" aria-expanded={showReasons} onClick={() => setShowReasons((v) => !v)}>
              {showReasons ? 'Hide reasons' : `Show reasons (${analysis.reasons.length})`}
            </button>
          )}
          {showReasons && (
            <ul className="jp-match__reasons">
              {analysis.reasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {analysis.matchedSkills.length > 0 && (
        <div className="jp-stack" style={{ gap: 4 }}>
          <span className="jp-field__label">Matched skills</span>
          <Chips items={analysis.matchedSkills} tone="matched" limit={limit} />
        </div>
      )}
      {analysis.missingSkills.length > 0 && (
        <div className="jp-stack" style={{ gap: 4 }}>
          <span className="jp-field__label">Missing skills</span>
          <Chips items={analysis.missingSkills} tone="missing" limit={limit} />
        </div>
      )}
      {detailed && analysis.redFlags.length > 0 && (
        <div className="jp-stack" style={{ gap: 4 }}>
          <span className="jp-field__label">Red flags</span>
          <ul className="jp-match__reasons">
            {analysis.redFlags.map((flag, i) => (
              <li key={i}>{flag}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
