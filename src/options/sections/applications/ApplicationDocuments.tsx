import { useState } from 'react';
import type { Application, StoredDocument } from '@/shared/types';
import { Badge } from '@/ui/components/Badge';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { useDocuments } from '@/ui/hooks/useDocuments';
import { ActionFeedback } from '../../components/ActionFeedback';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { openDocumentInTab } from '../../lib/documentActions';
import { DOCUMENT_KIND_LABELS } from '../../lib/documents';
import { downloadStoredDocument } from '../../lib/download';
import { formatBytes } from '../../lib/format';
import { DocumentPreviewModal } from '../documents/DocumentPreviewModal';

export function ApplicationDocuments({ app }: { app: Application }) {
  const all = useDocuments();
  const action = useAsyncAction();
  const [preview, setPreview] = useState<StoredDocument | null>(null);
  const docs = (all ?? []).filter((doc) => app.documentIds.includes(doc.id));

  return (
    <Card title="Documents">
      <div className="jp-stack">
        <ActionFeedback error={action.error} message={null} />
        {docs.length === 0 ? (
          <p className="jp-small jp-muted">No files for this application.</p>
        ) : (
          <ul className="jp-opt-doclist">
            {docs.map((doc) => (
              <li key={doc.id}>
                <span className="jp-stack" style={{ gap: 0, minWidth: 0 }}>
                  <span className="jp-strong jp-ellipsis">{doc.fileName}</span>
                  <span className="jp-small jp-muted">
                    {DOCUMENT_KIND_LABELS[doc.kind]} · {formatBytes(doc.size)}
                  </span>
                </span>
                <span className="jp-row">
                  <Badge>{doc.format.toUpperCase()}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => setPreview(doc)}>
                    View
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void action.run(`open:${doc.id}`, () => openDocumentInTab(doc))} loading={action.busy === `open:${doc.id}`}>
                    Open
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void action.run(`dl:${doc.id}`, () => downloadStoredDocument(doc))} loading={action.busy === `dl:${doc.id}`}>
                    Download
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {preview && <DocumentPreviewModal document={preview} onClose={() => setPreview(null)} />}
    </Card>
  );
}
