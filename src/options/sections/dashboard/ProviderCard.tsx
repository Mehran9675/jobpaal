import type { ProviderConfig } from '@/shared/types';
import { formatTimestamp } from '@/shared/utils/date';
import { Badge } from '@/ui/components/Badge';
import { Card } from '@/ui/components/Card';

export function ProviderCard({ provider }: { provider: ProviderConfig | null }) {
  return (
    <Card
      title="AI provider"
      actions={
        <a className="jp-small" href="#providers">
          Manage
        </a>
      }
    >
      {provider ? (
        <div className="jp-stack">
          <div className="jp-row jp-row--wrap">
            <span className="jp-strong">{provider.name}</span>
            <Badge tone="success">Connected</Badge>
          </div>
          <span className="jp-small jp-muted">Model: {provider.model || 'not set'}</span>
          {provider.lastTest && (
            <span className="jp-small jp-faint">
              Last test {provider.lastTest.ok ? 'passed' : 'failed'} · {formatTimestamp(provider.lastTest.at)}
            </span>
          )}
        </div>
      ) : (
        <div className="jp-stack">
          <div className="jp-row">
            <Badge tone="warning">Not connected</Badge>
          </div>
          <p className="jp-small jp-muted">
            Resume parsing, tailoring, cover letters, answers and match scores stay off until you <a href="#providers">connect a provider</a>. Autofill
            and design previews work without AI.
          </p>
        </div>
      )}
    </Card>
  );
}
