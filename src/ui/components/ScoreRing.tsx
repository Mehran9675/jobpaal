export interface ScoreRingProps {
  score: number;
  size?: number;
}

export function scoreTone(score: number): string {
  if (score >= 75) return 'var(--jp-success)';
  if (score >= 55) return 'var(--jp-primary)';
  if (score >= 35) return 'var(--jp-warning)';
  return 'var(--jp-danger)';
}

export function ScoreRing({ score, size = 48 }: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  return (
    <span className="jp-score" style={{ width: size, height: size }} aria-label={`Match score ${clamped} of 100`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--jp-bg-muted)" strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={scoreTone(clamped)}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * circumference} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="jp-score__value" style={{ fontSize: size * 0.3 }}>
        {clamped}
      </span>
    </span>
  );
}
