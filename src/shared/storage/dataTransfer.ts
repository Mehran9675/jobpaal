import { STORAGE_KEYS } from './keys';
import { readAll, removeKeys } from './local';

export type DataScope = 'applications' | 'documents' | 'profile' | 'jobs' | 'siteMappings' | 'savedAnswers' | 'usage' | 'ai' | 'settings' | 'prompts';

const SCOPE_KEYS: Record<DataScope, string[]> = {
  applications: [STORAGE_KEYS.applications],
  documents: [STORAGE_KEYS.documents],
  profile: [STORAGE_KEYS.profile],
  jobs: [STORAGE_KEYS.jobs],
  siteMappings: [STORAGE_KEYS.siteMappings, STORAGE_KEYS.forcedPages],
  savedAnswers: [STORAGE_KEYS.savedAnswers],
  usage: [STORAGE_KEYS.usage],
  ai: [STORAGE_KEYS.ai],
  settings: [STORAGE_KEYS.settings],
  prompts: [STORAGE_KEYS.prompts],
};

export interface ExportBundle {
  app: 'jobpaal';
  version: 1;
  exportedAt: string;
  includesApiKeys: boolean;
  data: Record<string, unknown>;
}

/** Exports everything stored locally. API keys are stripped unless explicitly requested. */
export async function exportData(includeApiKeys: boolean): Promise<ExportBundle> {
  const all = await readAll();
  const data: Record<string, unknown> = { ...all };
  if (!includeApiKeys && data[STORAGE_KEYS.ai]) {
    const ai = structuredClone(data[STORAGE_KEYS.ai]) as { providers?: { apiKey: string }[] };
    ai.providers?.forEach((p) => (p.apiKey = ''));
    data[STORAGE_KEYS.ai] = ai;
  }
  return { app: 'jobpaal', version: 1, exportedAt: new Date().toISOString(), includesApiKeys: includeApiKeys, data };
}

export async function importData(bundle: unknown): Promise<number> {
  if (!bundle || typeof bundle !== 'object' || (bundle as ExportBundle).app !== 'jobpaal') {
    throw new Error('This file is not a JobPaal export.');
  }
  const data = (bundle as ExportBundle).data ?? {};
  const known = new Set<string>(Object.values(STORAGE_KEYS));
  const entries = Object.entries(data).filter(
    ([key]) => known.has(key) || key.startsWith(STORAGE_KEYS.documentDataPrefix),
  );
  await chrome.storage.local.set(Object.fromEntries(entries));
  return entries.length;
}

/** Selective delete. Deleting documents also removes the stored file bytes. */
export async function clearData(scopes: DataScope[]): Promise<void> {
  const all = await readAll();
  const keys = new Set<string>();
  for (const scope of scopes) for (const key of SCOPE_KEYS[scope]) keys.add(key);
  if (scopes.includes('documents') || scopes.includes('applications')) {
    for (const key of Object.keys(all)) if (key.startsWith(STORAGE_KEYS.documentDataPrefix)) keys.add(key);
    keys.add(STORAGE_KEYS.documents);
  }
  await removeKeys([...keys]);
}
