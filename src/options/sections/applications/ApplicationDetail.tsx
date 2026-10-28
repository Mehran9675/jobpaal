import { deleteApplication, getDocumentsByIds, setApplicationStatus } from '@/shared/storage';
import type { Application } from '@/shared/types';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { MatchSummary } from '@/ui/components/MatchSummary';
import { StatusSelect } from '@/ui/components/StatusSelect';
import { useConfirm } from '@/ui/components/useConfirm';
import { ActionFeedback } from '../../components/ActionFeedback';
import { PageHeader } from '../../components/PageHeader';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { downloadJson, todayStamp } from '../../lib/download';
import { applicationHash, navigate } from '../../lib/routes';
import { ApplicationAnswers } from './ApplicationAnswers';
import { ApplicationDocuments } from './ApplicationDocuments';
import { ApplicationNotes } from './ApplicationNotes';
import { ApplicationTimeline } from './ApplicationTimeline';
import { JobInfo } from './JobInfo';
import { RegenerateActions } from './RegenerateActions';

export function ApplicationDetail({ app }: { app: Application }) {
  const action = useAsyncAction();
  const { confirm, dialog } = useConfirm();

  const exportJson = () =>
    action.run('export', async () => {
      const documents = await getDocumentsByIds(app.documentIds);
      downloadJson({ app: 'jobpaal', kind: 'application', exportedAt: new Date().toISOString(), application: app, documents }, `jobpaal-application-${todayStamp()}.json`);
    });

  const remove = async () => {
    const ok = await confirm({
      title: 'Delete this application?',
      message: `The application, its notes, timeline and ${app.documentIds.length} document(s) will be deleted from this browser. This cannot be undone.`,
      confirmLabel: 'Delete application',
      danger: true,
    });
    if (!ok) return;
    const done = await action.run('delete', async () => {
      await deleteApplication(app.id);
      return true;
    });
    if (done) navigate('#applications');
  };

  return (
    <div className="jp-opt-section">
      <PageHeader
        back={{ href: '#applications', label: 'All applications' }}
        title={app.job.title || 'Untitled job'}
        description={[app.job.company, app.job.location, app.job.siteName].filter(Boolean).join(' · ')}
        actions={
          <>
            <StatusSelect value={app.status} onChange={(status, label) => void action.run('status', () => setApplicationStatus(app.id, status, label))} disabled={action.busy === 'status'} />
            <a className="jp-btn" href={applicationHash(app.id, true)}>
              Edit content
            </a>
          </>
        }
      />
      <ActionFeedback error={action.error} message={action.message} />
      <div className="jp-opt-detail">
        <div className="jp-opt-detail__main">
          <JobInfo app={app} />
          <ApplicationDocuments app={app} />
          <ApplicationAnswers answers={app.answers} />
          <ApplicationNotes app={app} />
        </div>
        <div className="jp-opt-detail__side">
          <Card title="Match">{app.analysis ? <MatchSummary analysis={app.analysis} detailed /> : <p className="jp-small jp-muted">No match analysis for this application.</p>}</Card>
          <RegenerateActions app={app} />
          <ApplicationTimeline events={app.timeline} />
          <Card title="Manage">
            <div className="jp-stack">
              <Button onClick={() => void exportJson()} loading={action.busy === 'export'}>
                Export as JSON
              </Button>
              <Button variant="danger" onClick={() => void remove()} loading={action.busy === 'delete'}>
                Delete application
              </Button>
            </div>
          </Card>
        </div>
      </div>
      {dialog}
    </div>
  );
}
