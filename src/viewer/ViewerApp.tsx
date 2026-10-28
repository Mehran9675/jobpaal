import { useEffect, useRef } from 'react';
import { Button } from '@/ui/components/Button';
import { Notice } from '@/ui/components/Notice';
import { useSettings } from '@/ui/hooks/useSettings';
import { useTheme } from '@/ui/hooks/useTheme';
import { formatBytes, KIND_LABELS } from '@/ui/lib/labels';
import { useDocumentFile } from './useDocumentFile';

const params = new URLSearchParams(location.search);
const documentId = params.get('id') ?? '';
const autoDownload = params.get('download') === '1';

/** Shows a stored file in its own tab (PDF, HTML and text inline; DOCX as a download). */
export function ViewerApp() {
  const settings = useSettings();
  const theme = useTheme(settings?.theme);
  const { doc, url, text, error } = useDocumentFile(documentId);
  const downloaded = useRef(false);

  const download = () => {
    if (!doc || !url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.fileName;
    link.click();
  };

  useEffect(() => {
    if (doc) document.title = doc.fileName;
    if (autoDownload && doc && url && !downloaded.current) {
      downloaded.current = true;
      download();
    }
  });

  return (
    <div className="jp-root jp-viewer" data-theme={theme}>
      <div className="jp-viewer__bar">
        <strong className="jp-grow jp-ellipsis">{doc?.fileName ?? 'Document'}</strong>
        {doc && (
          <span className="jp-small jp-muted">
            {KIND_LABELS[doc.kind]} · {formatBytes(doc.size)}
          </span>
        )}
        <Button variant="primary" size="sm" onClick={download} disabled={!url}>
          Download
        </Button>
      </div>
      {error && (
        <div style={{ padding: 24 }}>
          <Notice tone="danger">{error}</Notice>
        </div>
      )}
      {doc && url && doc.format === 'pdf' && <iframe className="jp-viewer__frame" src={url} title={doc.fileName} />}
      {doc && url && doc.format === 'html' && <iframe className="jp-viewer__frame" src={url} title={doc.fileName} sandbox="" />}
      {doc && text && <pre className="jp-viewer__text">{text}</pre>}
      {doc && url && !['pdf', 'html', 'txt', 'md', 'json'].includes(doc.format) && (
        <div style={{ padding: 24 }}>
          <Notice>
            {doc.format === 'docx'
              ? 'Word files cannot be previewed in the browser. Download it to open in Word, Pages or LibreOffice.'
              : 'This file type cannot be previewed. Download it to open it.'}
          </Notice>
        </div>
      )}
    </div>
  );
}
