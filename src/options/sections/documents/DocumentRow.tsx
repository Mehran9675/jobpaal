import type { Application, StoredDocument } from '@/shared/types';
import { formatDay } from '@/shared/utils/date';
import { Badge } from '@/ui/components/Badge';
import { Button } from '@/ui/components/Button';
import { DOCUMENT_KIND_LABELS, regeneratePartForKind } from '../../lib/documents';
import { formatBytes } from '../../lib/format';
import { applicationHash } from '../../lib/routes';

export interface DocumentRowProps {
  doc: StoredDocument;
  application?: Application;
  busy: string | null;
  aiReady: boolean;
  onPreview: () => void;
  onOpen: () => void;
  onDownload: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
}

export function DocumentRow({ doc, application, busy, aiReady, onPreview, onOpen, onDownload, onRegenerate, onDelete }: DocumentRowProps) {
  const canRegenerate = doc.source === 'generated' && Boolean(doc.applicationId) && regeneratePartForKind(doc.kind) !== null;
  return (
    <tr>
      <td>
        <div className="jp-stack" style={{ gap: 2, minWidth: 0 }}>
          <button type="button" className="jp-opt-linkbtn jp-strong" onClick={onPreview}>
            {doc.fileName}
          </button>
          <span className="jp-row" style={{ gap: 4 }}>
            <Badge>{doc.format.toUpperCase()}</Badge>
            <Badge tone={doc.source === 'uploaded' ? 'info' : 'neutral'}>{doc.source}</Badge>
            {doc.label && <span className="jp-small jp-muted">{doc.label}</span>}
          </span>
        </div>
      </td>
      <td>{DOCUMENT_KIND_LABELS[doc.kind]}</td>
      <td>
        {application ? (
          <a href={applicationHash(application.id)} className="jp-small">
            {[application.job.title, application.job.company].filter(Boolean).join(' · ') || 'Application'}
          </a>
        ) : (
          <span className="jp-small jp-faint">{doc.applicationId ? 'Deleted application' : '—'}</span>
        )}
      </td>
      <td className="jp-small">{formatBytes(doc.size)}</td>
      <td className="jp-small">{formatDay(doc.updatedAt)}</td>
      <td>
        <div className="jp-row jp-opt-row-actions">
          <Button size="sm" variant="ghost" onClick={onPreview}>
            Preview
          </Button>
          <Button size="sm" variant="ghost" onClick={onOpen} loading={busy === `open:${doc.id}`}>
            Open
          </Button>
          <Button size="sm" variant="ghost" onClick={onDownload} loading={busy === `dl:${doc.id}`}>
            Download
          </Button>
          {canRegenerate && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRegenerate}
              disabled={!aiReady || Boolean(busy)}
              loading={busy === `regen:${doc.id}`}
              title={aiReady ? 'Regenerate with AI' : 'Connect an AI provider to regenerate'}
            >
              Regenerate
            </Button>
          )}
          <Button size="sm" variant="ghost" className="jp-opt-danger-text" onClick={onDelete} loading={busy === `delete:${doc.id}`}>
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
