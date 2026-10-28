import type { Application, ApplicationStatus, TimelineEvent } from '@/shared/types';
import { createId } from '@/shared/utils/id';
import { STORAGE_KEYS } from './keys';
import { readKey, updateKey, watchKey } from './local';
import { deleteDocuments } from './documentStore';

type ApplicationMap = Record<string, Application>;

export async function listApplications(): Promise<Application[]> {
  const map = (await readKey<ApplicationMap>(STORAGE_KEYS.applications)) ?? {};
  return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getApplication(id: string): Promise<Application | null> {
  const map = (await readKey<ApplicationMap>(STORAGE_KEYS.applications)) ?? {};
  return map[id] ?? null;
}

/** The most recent application created for this page, if any. */
export async function findApplicationByPageKey(pageKey: string): Promise<Application | null> {
  const apps = await listApplications();
  return apps.find((app) => app.pageKey === pageKey) ?? null;
}

export async function saveApplication(app: Application): Promise<Application> {
  const next = { ...app, updatedAt: Date.now() };
  await updateKey<ApplicationMap>(STORAGE_KEYS.applications, () => ({}), (map) => {
    map[next.id] = next;
  });
  return next;
}

export async function patchApplication(
  id: string,
  update: (app: Application) => Application | void,
): Promise<Application | null> {
  let result: Application | null = null;
  await updateKey<ApplicationMap>(STORAGE_KEYS.applications, () => ({}), (map) => {
    const current = map[id];
    if (!current) return;
    const next = update(structuredClone(current)) ?? current;
    result = { ...next, updatedAt: Date.now() };
    map[id] = result;
  });
  return result;
}

export function timelineEvent(type: TimelineEvent['type'], text: string): TimelineEvent {
  return { id: createId('ev'), at: Date.now(), type, text };
}

export async function setApplicationStatus(id: string, status: ApplicationStatus, label: string): Promise<void> {
  await patchApplication(id, (app) => {
    if (app.status === status) return app;
    app.status = status;
    app.timeline.push(timelineEvent('status', `Status changed to ${label}`));
    return app;
  });
}

/** Deletes an application together with its documents. */
export async function deleteApplication(id: string): Promise<void> {
  const app = await getApplication(id);
  if (app) await deleteDocuments(app.documentIds);
  await updateKey<ApplicationMap>(STORAGE_KEYS.applications, () => ({}), (map) => {
    delete map[id];
  });
}

export async function clearApplications(): Promise<void> {
  const apps = await listApplications();
  for (const app of apps) await deleteDocuments(app.documentIds);
  await updateKey<ApplicationMap>(STORAGE_KEYS.applications, () => ({}), () => ({}));
}

export function watchApplications(listener: (apps: Application[]) => void): () => void {
  return watchKey<ApplicationMap>(STORAGE_KEYS.applications, (map) =>
    listener(Object.values(map ?? {}).sort((a, b) => b.updatedAt - a.updatedAt)),
  );
}
