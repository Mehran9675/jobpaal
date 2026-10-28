import type { Application, StoredDocument } from '@/shared/types';
import { formatTimestamp } from '@/shared/utils/date';
import { Button } from '@/ui/components/Button';
import { DocumentPreview } from '@/ui/components/DocumentPreview';
import { Modal } from '@/ui/components/Modal';
import { ActionFeedback } from '../../components/ActionFeedback';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { openDocumentInTab } from '../../lib/documentActions';
import { downloadStoredDocument } from '../../lib/download';
import { formatBytes } from '../../lib/format';
import { applicationHash } from '../../lib/routes';

export interface DocumentPreviewModalProps {
  document: StoredDocument;
  application?: Application;
  onClose: () => void;
}

export function DocumentPreviewModal({ document: doc, application, onClose }: DocumentPreviewModalProps) {
  const action = useAsyncAction();
  return (
    <Modal
      title={doc.fileName}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button onClick={() => void action.run('open', () => openDocumentInTab(doc))} loading={action.busy === 'open'}>
            Open in new tab
          </Button>
          <Button variant="primary" onClick={() => void action.run('dl', () => downloadStoredDocument(doc))} loading={action.busy === 'dl'}>
            Download
          </Button>
        </>
      }
    >
      <div className="jp-stack">
        <p className="jp-small jp-muted">
          {formatBytes(doc.size)} · updated {formatTimestamp(doc.updatedAt)}
          {application && (
            <>
              {' · '}
              <a href={applicationHash(application.id)} onClick={onClose}>
                {[application.job.title, application.job.company].filter(Boolean).join(' · ')}
              </a>
            </>
          )}
        </p>
        <ActionFeedback error={action.error} message={null} />
        <DocumentPreview document={doc} height={620} />
      </div>
    </Modal>
  );
}
