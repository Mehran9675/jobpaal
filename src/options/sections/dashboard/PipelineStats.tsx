import { StatTile } from '@/ui/components/StatTile';
import { navigate } from '../../lib/routes';
import type { PipelineStats as Stats } from '../../lib/stats';

export function PipelineStats({ stats }: { stats: Stats }) {
  return (
    <div className="jp-opt-stats" role="group" aria-label="Pipeline statistics">
      <StatTile label="Applications tracked" value={stats.tracked} onClick={() => navigate('#applications')} />
      <StatTile label="Interviews" value={stats.interviews} hint="Interview and technical stages" tone={stats.interviews ? 'info' : 'neutral'} />
      <StatTile label="Offers" value={stats.offers} tone={stats.offers ? 'success' : 'neutral'} />
      <StatTile label="Documents generated" value={stats.documentsGenerated} onClick={() => navigate('#documents')} />
    </div>
  );
}
