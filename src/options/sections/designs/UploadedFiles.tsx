import { useState } from 'react';
import { putDocument } from '@/shared/storage';
import type { StoredDocument } from '@/shared/types';
import { formatDay } from '@/shared/utils/date';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { SelectField } from '@/ui/components/SelectField';
import { TextField } from '@/ui/components/TextField';
import { useConfirm } from '@/ui/components/useConfirm';
import { useDocuments } from '@/ui/hooks/useDocuments';
import { ActionFeedback } from '../../components/ActionFeedback';
import { FileButton } from '../../components/FileButton';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { deleteStoredDocument } from '../../lib/documentActions';
import { formatFromFileName, mimeForFormat } from '../../lib/documents';
import { downloadStoredDocument } from '../../lib/download';
import { formatBytes } from '../../lib/format';
import { DocumentPreviewModal } from '../documents/DocumentPreviewModal';

type UploadPurpose = 'Resume' | 'Cover letter' | 'Other';
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** The user's own resume / cover-letter files, stored locally for attaching to forms. */
export function UploadedFiles() {
  const docs = useDocuments();
  const action = useAsyncAction();
  const { confirm, dialog } = useConfirm();
  const [purpose, setPurpose] = useState<UploadPurpose>('Resume');
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState<StoredDocument | null>(null);
  const uploaded = (docs ?? []).filter((d) => d.source === 'uploaded');

  const upload = (file: File) =>
    action.run(
      'upload',
      async () => {
        if (file.size > MAX_UPLOAD_BYTES) throw new Error('This file is larger than 8 MB.');
        const format = formatFromFileName(file.name);
        await putDocument({
          applicationId: null,
          kind: 'uploaded',
          format,
          fileName: file.name,
          mimeType: file.type || mimeForFormat(format),
          source: 'uploaded',
          label: [purpose, note.trim()].filter(Boolean).join(' · '),
          bytes: new Uint8Array(await file.arrayBuffer()),
        });
        setNote('');
      },
      `Uploaded ${file.name}.`,
    );

  const remove = async (doc: StoredDocument) => {
    const ok = await confirm({ title: 'Delete this file?', message: `${doc.fileName} will be removed from this browser.`, confirmLabel: 'Delete', danger: true });
    if (ok) await action.run(`del:${doc.id}`, () => deleteStoredDocument(doc), 'File deleted.');
  };

  return (
    <Card title="Your own uploaded files">
      <div className="jp-stack jp-stack--lg">
        <p className="jp-small jp-muted">Keep your own resume or cover-letter files here to attach them to forms. They are stored only in this browser.</p>
        <div className="jp-opt-upload-row">
          <SelectField<UploadPurpose>
            label="This file is a"
            value={purpose}
            options={[
              { value: 'Resume', label: 'Resume' },
              { value: 'Cover letter', label: 'Cover letter' },
              { value: 'Other', label: 'Other document' },
            ]}
            onChange={setPurpose}
          />
          <TextField label="Label (optional)" value={note} onChange={setNote} placeholder="e.g. Short version" />
          <FileButton accept=".pdf,.docx,.doc,.txt,.md,.html,.json,.rtf,.odt" onFile={(f) => void upload(f)} loading={action.busy === 'upload'}>
            Upload file…
          </FileButton>
        </div>
        <ActionFeedback error={action.error} message={action.message} />
        {uploaded.length === 0 ? (
          <p className="jp-small jp-faint">No uploaded files yet.</p>
        ) : (
          <ul className="jp-opt-doclist">
            {uploaded.map((doc) => (
              <li key={doc.id}>
                <span className="jp-stack" style={{ gap: 0, minWidth: 0 }}>
                  <span className="jp-strong jp-ellipsis">{doc.fileName}</span>
                  <span className="jp-small jp-muted">
                    {[doc.label, formatBytes(doc.size), formatDay(doc.updatedAt)].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className="jp-row">
                  <Button size="sm" variant="ghost" onClick={() => setPreview(doc)}>
                    View
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void action.run(`dl:${doc.id}`, () => downloadStoredDocument(doc))}>
                    Download
                  </Button>
                  <Button size="sm" variant="ghost" className="jp-opt-danger-text" onClick={() => void remove(doc)} loading={action.busy === `del:${doc.id}`}>
                    Delete
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {preview && <DocumentPreviewModal document={preview} onClose={() => setPreview(null)} />}
      {dialog}
    </Card>
  );
}
