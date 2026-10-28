import { EmptyState } from '@/ui/components/EmptyState';
import { Spinner } from '@/ui/components/Spinner';
import { useApplications } from '@/ui/hooks/useApplications';
import { PageHeader } from '../../components/PageHeader';
import { ApplicationDetail } from './ApplicationDetail';
import { ApplicationEdit } from './ApplicationEdit';
import { ApplicationList } from './ApplicationList';

export interface ApplicationsSectionProps {
  applicationId?: string;
  view?: 'detail' | 'edit';
}

export function ApplicationsSection({ applicationId, view }: ApplicationsSectionProps) {
  const apps = useApplications();
  if (!apps) {
    return (
      <div className="jp-opt-loading">
        <Spinner label="Loading applications" />
      </div>
    );
  }
  if (!applicationId) return <ApplicationList apps={apps} />;

  const app = apps.find((a) => a.id === applicationId);
  if (!app) {
    return (
      <div className="jp-opt-section">
        <PageHeader title="Application not found" back={{ href: '#applications', label: 'All applications' }} />
        <EmptyState>This application no longer exists. It may have been deleted.</EmptyState>
      </div>
    );
  }
  return view === 'edit' ? <ApplicationEdit key={app.id} app={app} /> : <ApplicationDetail key={app.id} app={app} />;
}
