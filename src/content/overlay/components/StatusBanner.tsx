import type { DetectionIssue } from '@/shared/types';

export interface StatusBannerProps {
  light: 'green' | 'red';
  issues: DetectionIssue[];
  forced: boolean;
}

/** Green when everything needed was found; red with the specific reasons and the manual path. */
export function StatusBanner({ light, issues, forced }: StatusBannerProps) {
  if (light === 'green') {
    return (
      <div className="jp-ov-status jp-ov-status--green" role="status">
        <span aria-hidden="true">●</span>
        <span>JobPaal found everything it needs on this page.</span>
      </div>
    );
  }
  return (
    <div className="jp-ov-status jp-ov-status--red" role="alert">
      <span aria-hidden="true">●</span>
      <div>
        <strong>Manual work needed.</strong>{' '}
        {forced ? 'You marked this page as a job page, but ' : ''}some things could not be read:
        <ul>
          {issues.map((issue) => (
            <li key={issue.field + issue.message}>{issue.message}</li>
          ))}
        </ul>
        <span>Use Pick, Paste or Recent below, or teach this site with Guide me.</span>
      </div>
    </div>
  );
}
