import { sendToBackground } from '@/shared/messaging';
import type { StoredDocument } from '@/shared/types';
import { Button } from '@/ui/components/Button';
import { downloadStoredDocument } from '@/ui/lib/downloadDocument';
import { FORMAT_LABELS, KIND_LABELS } from '@/ui/lib/labels';

/** Generated files for this page with view and download. */
export function CompanionFiles({ documents, applicationId }: { documents: StoredDocument[]; applicationId: string | null }) {
  if (!documents.length) return <p className="jp-small jp-muted">No files for this page yet.</p>;
  return (
    <div className="jp-stack" style={{ gap: 6 }}>
      {documents.map((doc) => (
        <div key={doc.id} className="jp-row">
          <div className="jp-grow">
            <div className="jp-ellipsis jp-small jp-strong" title={doc.fileName}>
              {doc.fileName}
            </div>
            <div className="jp-small jp-faint">
              {KIND_LABELS[doc.kind]} · {FORMAT_LABELS[doc.format]}
            </div>
          </div>
          <Button size="sm" onClick={() => sendToBackground('doc:open', { documentId: doc.id })}>
            View
          </Button>
          <Button size="sm" onClick={() => downloadStoredDocument(doc.id)}>
            Download
          </Button>
        </div>
      ))}
      {applicationId && (
        <Button size="sm" variant="ghost" onClick={() => sendToBackground('options:open', { section: `applications/${applicationId}/edit` })}>
          Edit content
        </Button>
      )}
    </div>
  );
}
