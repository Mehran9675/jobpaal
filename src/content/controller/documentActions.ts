import { downloadPayload } from '@/content/util/download';
import { sendToBackground } from '@/shared/messaging';
import type { StoredDocument } from '@/shared/types';
import { say, withBusy } from './feedback';
import { refreshApplication } from './recompute';
import { store } from './store';

export async function downloadDocument(doc: StoredDocument): Promise<void> {
  try {
    downloadPayload(await sendToBackground('doc:payload', { documentId: doc.id }));
  } catch {
    // Some pages block blob downloads; fall back to the extension's viewer.
    await sendToBackground('doc:download', { documentId: doc.id }).catch(() => undefined);
  }
}

export async function viewDocument(doc: StoredDocument): Promise<void> {
  await sendToBackground('doc:open', { documentId: doc.id });
}

/** Attaches to the best matching upload field in any frame. */
export async function attachDocument(doc: StoredDocument): Promise<void> {
  await withBusy('Attaching the file…', async () => {
    const file = await sendToBackground('doc:payload', { documentId: doc.id });
    const target = doc.kind === 'cover-letter' ? 'cover-letter' : doc.kind === 'resume' ? 'resume' : 'any';
    const results = await sendToBackground('frames:broadcast', {
      message: { kind: 'frame:attach', fieldId: null, target, file },
    });
    if (results.some((r) => r.result === true)) say('success', `${doc.fileName} attached. Check that the site shows it.`);
    else say('warning', 'No matching upload field was found. Use “Choose upload field” and click the field yourself.');
  });
}

export function editDocumentContent(): void {
  const app = store.get().application;
  if (app) void sendToBackground('options:open', { section: `applications/${app.id}/edit` });
}

export async function regenerate(part: 'resume' | 'cover-letter' | 'answers' | 'all'): Promise<void> {
  const app = store.get().application;
  if (!app) return;
  await withBusy('Regenerating…', async () => {
    await sendToBackground('app:regenerate', { applicationId: app.id, part });
    await refreshApplication();
    say('success', 'Regenerated. Review the new version before using it.');
  });
}

export async function openManagement(section?: string): Promise<void> {
  await sendToBackground('options:open', { section }).catch(() => undefined);
}
