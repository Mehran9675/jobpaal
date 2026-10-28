import { isProfileUsable } from '@/shared/storage';
import { Card } from '@/ui/components/Card';
import { Spinner } from '@/ui/components/Spinner';
import { UsageSummary } from '@/ui/components/UsageSummary';
import { useApplications } from '@/ui/hooks/useApplications';
import { useDocuments } from '@/ui/hooks/useDocuments';
import { useProfile } from '@/ui/hooks/useProfile';
import { useUsage } from '@/ui/hooks/useUsage';
import { PageHeader } from '../../components/PageHeader';
import { useActiveProvider } from '../../hooks/useActiveProvider';
import { computePipelineStats } from '../../lib/stats';
import { GettingStarted } from './GettingStarted';
import { PipelineStats } from './PipelineStats';
import { ProviderCard } from './ProviderCard';
import { RecentApplications } from './RecentApplications';

export function DashboardSection() {
  const apps = useApplications();
  const docs = useDocuments();
  const profile = useProfile();
  const usage = useUsage();
  const provider = useActiveProvider();

  if (!apps || !docs || !profile || !usage || provider === undefined) {
    return (
      <div className="jp-opt-loading">
        <Spinner label="Loading dashboard" />
      </div>
    );
  }

  const stats = computePipelineStats(apps, docs);
  const profileReady = isProfileUsable(profile);
  const showChecklist = !profileReady || !provider;

  return (
    <div className="jp-opt-section">
      <PageHeader title="Dashboard" description="Your application pipeline at a glance. Everything shown here is stored only in this browser." />
      {showChecklist && <GettingStarted profileReady={profileReady} providerReady={Boolean(provider)} hasApplications={apps.length > 0} />}
      <PipelineStats stats={stats} />
      <div className="jp-opt-grid-2">
        <ProviderCard provider={provider} />
        <Card
          title="AI usage"
          actions={
            <a className="jp-small" href="#usage">
              Detailed report
            </a>
          }
        >
          <UsageSummary usage={usage} />
        </Card>
      </div>
      <RecentApplications apps={apps.slice(0, 6)} />
    </div>
  );
}
