import { getDocument, getDocumentBase64 } from '@/shared/storage';
import type { Handler } from './types';

export const documentPayloadHandler: Handler<'doc:payload'> = async ({ documentId }) => {
  const doc = await getDocument(documentId);
  const base64 = await getDocumentBase64(documentId);
  if (!doc || !base64) throw new Error('This file no longer exists. Regenerate it from the Documents section.');
  return { documentId, fileName: doc.fileName, mimeType: doc.mimeType, base64 };
};

function viewerUrl(documentId: string, download: boolean): string {
  return chrome.runtime.getURL(`viewer/index.html?id=${encodeURIComponent(documentId)}${download ? '&download=1' : ''}`);
}

export const openDocumentHandler: Handler<'doc:open'> = async ({ documentId }, sender) => {
  await chrome.tabs.create({ url: viewerUrl(documentId, false), index: sender.tab ? sender.tab.index + 1 : undefined });
  return { ok: true };
};

export const downloadDocumentHandler: Handler<'doc:download'> = async ({ documentId }, sender) => {
  await chrome.tabs.create({ url: viewerUrl(documentId, true), index: sender.tab ? sender.tab.index + 1 : undefined });
  return { ok: true };
};
