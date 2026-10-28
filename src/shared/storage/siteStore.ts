import type { ElementLocator, FieldMapping, JobField, SavedAnswer, SiteMapping } from '@/shared/types';
import { createId } from '@/shared/utils/id';
import { STORAGE_KEYS } from './keys';
import { readKey, updateKey, watchKey } from './local';

type SiteMap = Record<string, SiteMapping>;

const emptyMapping = (host: string): SiteMapping => ({ host, jobFields: {}, formFields: [], updatedAt: Date.now() });

export async function getSiteMapping(host: string): Promise<SiteMapping | null> {
  const map = (await readKey<SiteMap>(STORAGE_KEYS.siteMappings)) ?? {};
  return map[host] ?? null;
}

export async function listSiteMappings(): Promise<SiteMapping[]> {
  const map = (await readKey<SiteMap>(STORAGE_KEYS.siteMappings)) ?? {};
  return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Saved automatically by the field guide: no save button needed. */
export async function saveJobFieldLocator(host: string, field: JobField, locator: ElementLocator | null): Promise<void> {
  await updateKey<SiteMap>(STORAGE_KEYS.siteMappings, () => ({}), (map) => {
    const mapping = map[host] ?? emptyMapping(host);
    if (locator) mapping.jobFields[field] = locator;
    else delete mapping.jobFields[field];
    mapping.updatedAt = Date.now();
    map[host] = mapping;
  });
}

export async function saveFormFieldMapping(host: string, field: FieldMapping): Promise<void> {
  await updateKey<SiteMap>(STORAGE_KEYS.siteMappings, () => ({}), (map) => {
    const mapping = map[host] ?? emptyMapping(host);
    mapping.formFields = mapping.formFields.filter(
      (existing) =>
        !(existing.locator.selector === field.locator.selector && existing.locator.frameUrl === field.locator.frameUrl),
    );
    mapping.formFields.push(field);
    mapping.updatedAt = Date.now();
    map[host] = mapping;
  });
}

export async function removeFormFieldMapping(host: string, selector: string): Promise<void> {
  await updateKey<SiteMap>(STORAGE_KEYS.siteMappings, () => ({}), (map) => {
    const mapping = map[host];
    if (!mapping) return;
    mapping.formFields = mapping.formFields.filter((f) => f.locator.selector !== selector);
    mapping.updatedAt = Date.now();
  });
}

export async function deleteSiteMapping(host: string): Promise<void> {
  await updateKey<SiteMap>(STORAGE_KEYS.siteMappings, () => ({}), (map) => {
    delete map[host];
  });
}

export function watchSiteMapping(host: string, listener: (mapping: SiteMapping | null) => void): () => void {
  return watchKey<SiteMap>(STORAGE_KEYS.siteMappings, (map) => listener(map?.[host] ?? null));
}

export async function listSavedAnswers(): Promise<SavedAnswer[]> {
  return (await readKey<SavedAnswer[]>(STORAGE_KEYS.savedAnswers)) ?? [];
}

export async function addSavedAnswer(question: string, answer: string): Promise<SavedAnswer> {
  const entry: SavedAnswer = { id: createId('ans'), question: question.trim(), answer, createdAt: Date.now(), usedCount: 0 };
  await updateKey<SavedAnswer[]>(STORAGE_KEYS.savedAnswers, () => [], (list) => {
    const withoutSame = list.filter((a) => a.question.toLowerCase() !== entry.question.toLowerCase());
    return [entry, ...withoutSame];
  });
  return entry;
}

export async function updateSavedAnswer(id: string, patch: Partial<SavedAnswer>): Promise<void> {
  await updateKey<SavedAnswer[]>(STORAGE_KEYS.savedAnswers, () => [], (list) =>
    list.map((a) => (a.id === id ? { ...a, ...patch, id } : a)),
  );
}

export async function removeSavedAnswer(id: string): Promise<void> {
  await updateKey<SavedAnswer[]>(STORAGE_KEYS.savedAnswers, () => [], (list) => list.filter((a) => a.id !== id));
}

export function watchSavedAnswers(listener: (answers: SavedAnswer[]) => void): () => void {
  return watchKey<SavedAnswer[]>(STORAGE_KEYS.savedAnswers, (list) => listener(list ?? []));
}

export async function listForcedPages(): Promise<string[]> {
  return (await readKey<string[]>(STORAGE_KEYS.forcedPages)) ?? [];
}

/** "Show overlay here" affects exactly one page, never the site. */
export async function setPageForced(pageKey: string, forced: boolean): Promise<void> {
  await updateKey<string[]>(STORAGE_KEYS.forcedPages, () => [], (list) => {
    const without = list.filter((key) => key !== pageKey);
    return forced ? [pageKey, ...without].slice(0, 500) : without;
  });
}

export function watchForcedPages(listener: (pages: string[]) => void): () => void {
  return watchKey<string[]>(STORAGE_KEYS.forcedPages, (list) => listener(list ?? []));
}
