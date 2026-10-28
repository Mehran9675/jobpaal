import type { FilePayload } from '@/shared/messaging';
import { base64ToBytes } from '@/shared/utils/base64';

/** Saves a file from the page context with a temporary blob link. */
export function downloadPayload(file: FilePayload): void {
  const bytes = base64ToBytes(file.base64);
  const blob = new Blob([bytes], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.fileName;
  link.style.display = 'none';
  document.documentElement.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
