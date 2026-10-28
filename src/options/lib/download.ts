import { getDocumentBytes } from '@/shared/storage';
import type { StoredDocument } from '@/shared/types';

/** Triggers a browser download of bytes or text. Everything happens locally. */
export function downloadBlob(data: BlobPart, fileName: string, mimeType: string): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function downloadJson(value: unknown, fileName: string): void {
  downloadBlob(JSON.stringify(value, null, 2), fileName, 'application/json');
}

export async function downloadStoredDocument(doc: StoredDocument): Promise<void> {
  const bytes = await getDocumentBytes(doc.id);
  if (!bytes) throw new Error('The file data for this document is missing.');
  downloadBlob(bytes, doc.fileName, doc.mimeType || 'application/octet-stream');
}

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
