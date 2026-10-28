import { useEffect, useState } from 'react';
import { getDocument, getDocumentBytes } from '@/shared/storage';
import type { StoredDocument } from '@/shared/types';

export interface DocumentFile {
  doc: StoredDocument | null;
  url: string;
  text: string;
  error: string;
}

/** Loads a stored file and exposes it as a blob URL (and text for text formats). */
export function useDocumentFile(id: string): DocumentFile {
  const [file, setFile] = useState<DocumentFile>({ doc: null, url: '', text: '', error: '' });
  useEffect(() => {
    let url = '';
    (async () => {
      const [doc, bytes] = await Promise.all([getDocument(id), getDocumentBytes(id)]);
      if (!doc || !bytes) {
        setFile({ doc: null, url: '', text: '', error: 'This file no longer exists.' });
        return;
      }
      url = URL.createObjectURL(new Blob([bytes], { type: doc.mimeType }));
      const isText = ['txt', 'md', 'json'].includes(doc.format);
      setFile({ doc, url, text: isText ? new TextDecoder().decode(bytes) : '', error: '' });
    })();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);
  return file;
}
