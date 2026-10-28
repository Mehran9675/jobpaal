import { getDocument, getDocumentBytes } from '@/shared/storage';

/** Downloads a stored file from an extension page (popup, side panel, management page, viewer). */
export async function downloadStoredDocument(documentId: string): Promise<void> {
  const [doc, bytes] = await Promise.all([getDocument(documentId), getDocumentBytes(documentId)]);
  if (!doc || !bytes) throw new Error('This file no longer exists.');
  const url = URL.createObjectURL(new Blob([bytes], { type: doc.mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = doc.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
