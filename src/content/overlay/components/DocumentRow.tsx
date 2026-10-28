import { attachDocument, downloadDocument, editDocumentContent, regenerate, viewDocument } from '@/content/controller/documentActions';
import { pickUploadField } from '@/content/controller/pickActions';
import type { StoredDocument } from '@/shared/types';
import { Badge } from '@/ui/components/Badge';
import { Button } from '@/ui/components/Button';
import { FORMAT_LABELS, KIND_LABELS, formatBytes } from '@/ui/lib/labels';

export interface DocumentRowProps {
  doc: StoredDocument;
  aiReady: boolean;
  disabled: boolean;
}

/** One generated file: view, download, attach, choose upload field, edit content, regenerate. */
export function DocumentRow({ doc, aiReady, disabled }: DocumentRowProps) {
  const part = doc.kind === 'cover-letter' ? 'cover-letter' : doc.kind === 'answers' ? 'answers' : 'resume';
  return (
    <div className="jp-ov-doc">
      <div className="jp-row">
        <Badge tone="info">{FORMAT_LABELS[doc.format]}</Badge>
        <strong className="jp-ellipsis" style={{ flex: 1 }} title={doc.fileName}>
          {doc.fileName}
        </strong>
        <span className="jp-small jp-faint">{formatBytes(doc.size)}</span>
      </div>
      <span className="jp-small jp-muted">{KIND_LABELS[doc.kind]}</span>
      <div className="jp-row jp-row--wrap">
        <Button size="sm" onClick={() => viewDocument(doc)}>
          View
        </Button>
        <Button size="sm" onClick={() => downloadDocument(doc)}>
          Download
        </Button>
        {doc.kind !== 'answers' && (
          <>
            <Button size="sm" onClick={() => attachDocument(doc)} disabled={disabled}>
              Attach
            </Button>
            <Button size="sm" onClick={() => pickUploadField(doc.id)} disabled={disabled}>
              Choose upload field
            </Button>
          </>
        )}
        <Button size="sm" onClick={editDocumentContent}>
          Edit content
        </Button>
        {doc.source === 'generated' && (
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled || !aiReady}
            onClick={() => {
              if (confirm(`Regenerate the ${KIND_LABELS[doc.kind].toLowerCase()}? This uses your AI provider and replaces the current version.`)) {
                void regenerate(part);
              }
            }}
          >
            Regenerate
          </Button>
        )}
      </div>
    </div>
  );
}
