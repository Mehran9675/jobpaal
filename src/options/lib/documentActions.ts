import { sendToBackground } from '@/shared/messaging/client';
import { deleteDocuments, patchApplication } from '@/shared/storage';
import type { StoredDocument } from '@/shared/types';
import { regeneratePartForKind } from './documents';

/** Deletes a document and removes it from its application's document list. */
export async function deleteStoredDocument(doc: StoredDocument): Promise<void> {
  await deleteDocuments([doc.id]);
  if (doc.applicationId) {
    await patchApplication(doc.applicationId, (app) => {
      app.documentIds = app.documentIds.filter((id) => id !== doc.id);
      return app;
    });
  }
}

/** Regenerates the part of an application a generated document belongs to. Uses AI. */
export async function regenerateDocument(doc: StoredDocument): Promise<void> {
  const part = regeneratePartForKind(doc.kind);
  if (!doc.applicationId || !part || doc.source !== 'generated') throw new Error('Only generated documents that belong to an application can be regenerated.');
  await sendToBackground('app:regenerate', { applicationId: doc.applicationId, part });
}

export async function openDocumentInTab(doc: StoredDocument): Promise<void> {
  await sendToBackground('doc:open', { documentId: doc.id });
}
