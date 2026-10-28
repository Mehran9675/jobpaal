import type { FillReport } from '@/shared/messaging';
import { HAND_TYPED_TIP } from '@/content/controller/fillActions';

/** What the last fill did, including fields that need attention. */
export function FillSummary({ report }: { report: FillReport }) {
  const problems = report.items.filter((i) => i.status === 'failed');
  return (
    <details className="jp-ov-section">
      <summary>
        Last fill: {report.filled} filled, {report.attached} attached{problems.length ? `, ${problems.length} need you` : ''}
      </summary>
      <div className="jp-ov-section__body">
        {problems.length > 0 && (
          <ul className="jp-small" style={{ margin: 0, paddingLeft: 18 }}>
            {problems.map((p, i) => (
              <li key={p.label + i}>
                {p.label}
                {p.reason ? ` — ${p.reason}` : ''}
              </li>
            ))}
          </ul>
        )}
        <p className="jp-small jp-muted">{HAND_TYPED_TIP}</p>
      </div>
    </details>
  );
}
