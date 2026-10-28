import type { StoredDocument } from '@/shared/types';
import { base64ToBytes, bytesToBase64 } from '@/shared/utils/base64';
import { createId } from '@/shared/utils/id';
import { STORAGE_KEYS } from './keys';
import { readKey, removeKeys, updateKey, watchKey, writeKey } from './local';

type DocumentMap = Record<string, StoredDocument>;

const dataKey = (id: string) => `${STORAGE_KEYS.documentDataPrefix}${id}`;

export async function listDocuments(): Promise<StoredDocument[]> {
  const map = (await readKey<DocumentMap>(STORAGE_KEYS.documents)) ?? {};
  return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getDocument(id: string): Promise<StoredDocument | null> {
  const map = (await readKey<DocumentMap>(STORAGE_KEYS.documents)) ?? {};
  return map[id] ?? null;
}

export async function getDocumentsByIds(ids: string[]): Promise<StoredDocument[]> {
  const map = (await readKey<DocumentMap>(STORAGE_KEYS.documents)) ?? {};
  return ids.map((id) => map[id]).filter((doc): doc is StoredDocument => Boolean(doc));
}

export async function getDocumentBase64(id: string): Promise<string | null> {
  return (await readKey<string>(dataKey(id))) ?? null;
}

export async function getDocumentBytes(id: string): Promise<Uint8Array | null> {
  const base64 = await getDocumentBase64(id);
  return base64 ? base64ToBytes(base64) : null;
}

export interface NewDocument {
  id?: string;
  applicationId: string | null;
  kind: StoredDocument['kind'];
  format: StoredDocument['format'];
  fileName: string;
  mimeType: string;
  source: StoredDocument['source'];
  label?: string;
  bytes: Uint8Array;
}

/** Creates or replaces a document (metadata + bytes). */
export async function putDocument(input: NewDocument): Promise<StoredDocument> {
  const id = input.id ?? createId('doc');
  const existing = input.id ? await getDocument(input.id) : null;
  const now = Date.now();
  const doc: StoredDocument = {
    id,
    applicationId: input.applicationId,
    kind: input.kind,
    format: input.format,
    fileName: input.fileName,
    mimeType: input.mimeType,
    size: input.bytes.byteLength,
    source: input.source,
    label: input.label ?? existing?.label ?? '',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await writeKey(dataKey(id), bytesToBase64(input.bytes));
  await updateKey<DocumentMap>(STORAGE_KEYS.documents, () => ({}), (map) => {
    map[id] = doc;
  });
  return doc;
}

export async function updateDocumentMeta(id: string, patch: Partial<StoredDocument>): Promise<void> {
  await updateKey<DocumentMap>(STORAGE_KEYS.documents, () => ({}), (map) => {
    if (map[id]) map[id] = { ...map[id], ...patch, id };
  });
}

export async function deleteDocuments(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await removeKeys(ids.map(dataKey));
  await updateKey<DocumentMap>(STORAGE_KEYS.documents, () => ({}), (map) => {
    for (const id of ids) delete map[id];
  });
}

export function watchDocuments(listener: (docs: StoredDocument[]) => void): () => void {
  return watchKey<DocumentMap>(STORAGE_KEYS.documents, (map) =>
    listener(Object.values(map ?? {}).sort((a, b) => b.updatedAt - a.updatedAt)),
  );
}

export async function documentStorageSummary(): Promise<{ count: number; bytes: number; byKind: Record<string, number> }> {
  const docs = await listDocuments();
  const byKind: Record<string, number> = {};
  let bytes = 0;
  for (const doc of docs) {
    bytes += doc.size;
    byKind[doc.kind] = (byKind[doc.kind] ?? 0) + 1;
  }
  return { count: docs.length, bytes, byKind };
}
