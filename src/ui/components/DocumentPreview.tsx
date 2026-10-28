import { useEffect, useState } from 'react';
import { getDocumentBytes } from '@/shared/storage';
import type { StoredDocument } from '@/shared/types';
import { bytesToText } from '@/shared/utils/base64';
import { errorMessage } from '@/shared/utils/errors';
import { previewModeFor } from './documentPreviewMode';
import { Notice } from './Notice';
import { Spinner } from './Spinner';

export interface DocumentPreviewProps {
  document: StoredDocument;
  /** Height of the preview area in px. */
  height?: number;
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'iframe'; url: string }
  | { status: 'text'; text: string }
  | { status: 'none' };

/** Inline preview of a stored file (PDF/HTML in a sandboxed frame, text formats as text). Built from local bytes only. */
export function DocumentPreview({ document: doc, height = 560 }: DocumentPreviewProps) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    let url: string | null = null;
    const mode = previewModeFor(doc.format);
    if (mode === 'none') {
      setState({ status: 'none' });
      return;
    }
    setState({ status: 'loading' });
    getDocumentBytes(doc.id)
      .then((bytes) => {
        if (!alive) return;
        if (!bytes) {
          setState({ status: 'error', message: 'The file data for this document is missing.' });
          return;
        }
        if (mode === 'text') {
          setState({ status: 'text', text: bytesToText(bytes) });
          return;
        }
        url = URL.createObjectURL(new Blob([bytes], { type: doc.mimeType || (doc.format === 'pdf' ? 'application/pdf' : 'text/html') }));
        setState({ status: 'iframe', url });
      })
      .catch((error) => alive && setState({ status: 'error', message: errorMessage(error) }));
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [doc.id, doc.updatedAt, doc.format, doc.mimeType]);

  switch (state.status) {
    case 'loading':
      return (
        <div className="jp-doc-preview jp-doc-preview--loading" style={{ height }}>
          <Spinner label="Loading preview" />
        </div>
      );
    case 'error':
      return <Notice tone="danger">{state.message}</Notice>;
    case 'none':
      return <Notice>An inline preview is not available for this format. Open it in a new tab or download it.</Notice>;
    case 'text':
      return (
        <pre className="jp-doc-preview jp-doc-preview--text" style={{ maxHeight: height }}>
          {state.text}
        </pre>
      );
    case 'iframe':
      return (
        <iframe
          className="jp-doc-preview"
          title={`Preview of ${doc.fileName}`}
          src={state.url}
          style={{ height }}
          sandbox={doc.format === 'html' ? '' : undefined}
        />
      );
  }
}
