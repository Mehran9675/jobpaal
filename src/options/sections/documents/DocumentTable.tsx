import type { Application, StoredDocument } from '@/shared/types';
import { useConfirm } from '@/ui/components/useConfirm';
import { ActionFeedback } from '../../components/ActionFeedback';
import { useActiveProvider } from '../../hooks/useActiveProvider';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { deleteStoredDocument, openDocumentInTab, regenerateDocument } from '../../lib/documentActions';
import { downloadStoredDocument } from '../../lib/download';
import { DocumentRow } from './DocumentRow';

export interface DocumentTableProps {
  docs: StoredDocument[];
  appsById: Record<string, Application>;
  onPreview: (doc: StoredDocument) => void;
}

export function DocumentTable({ docs, appsById, onPreview }: DocumentTableProps) {
  const action = useAsyncAction();
  const { confirm, dialog } = useConfirm();
  const aiReady = Boolean(useActiveProvider());

  const remove = async (doc: StoredDocument) => {
    const ok = await confirm({
      title: 'Delete this document?',
      message: (
        <>
          <strong>{doc.fileName}</strong> will be removed from this browser{doc.applicationId ? ' and from its application' : ''}. This cannot be undone.
        </>
      ),
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) await action.run(`delete:${doc.id}`, () => deleteStoredDocument(doc), 'Document deleted.');
  };

  const regenerate = async (doc: StoredDocument) => {
    const ok = await confirm({
      title: 'Regenerate with AI?',
      message: 'This re-runs the AI task for this document using your provider (it uses tokens) and replaces the current version, including any edits.',
      confirmLabel: 'Regenerate',
    });
    if (ok) await action.run(`regen:${doc.id}`, () => regenerateDocument(doc), 'Regenerated. The new files are listed here.');
  };

  return (
    <div className="jp-stack">
      <ActionFeedback error={action.error} message={action.message} />
      <div className="jp-opt-table-wrap">
        <table className="jp-opt-table">
          <thead>
            <tr>
              <th scope="col">File</th>
              <th scope="col">Kind</th>
              <th scope="col">Application</th>
              <th scope="col">Size</th>
              <th scope="col">Updated</th>
              <th scope="col">
                <span className="jp-sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                application={doc.applicationId ? appsById[doc.applicationId] : undefined}
                busy={action.busy}
                aiReady={aiReady}
                onPreview={() => onPreview(doc)}
                onOpen={() => void action.run(`open:${doc.id}`, () => openDocumentInTab(doc))}
                onDownload={() => void action.run(`dl:${doc.id}`, () => downloadStoredDocument(doc))}
                onRegenerate={() => void regenerate(doc)}
                onDelete={() => void remove(doc)}
              />
            ))}
          </tbody>
        </table>
      </div>
      {dialog}
    </div>
  );
}
