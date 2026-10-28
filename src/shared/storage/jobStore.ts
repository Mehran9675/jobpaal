import type { JobAnalysis, JobPosting, StoredJob } from '@/shared/types';
import { STORAGE_KEYS } from './keys';
import { readKey, updateKey, watchKey } from './local';

type JobMap = Record<string, StoredJob>;

const MAX_RECENT_JOBS = 60;

export async function listRecentJobs(): Promise<StoredJob[]> {
  const map = (await readKey<JobMap>(STORAGE_KEYS.jobs)) ?? {};
  return Object.values(map).sort((a, b) => b.lastUsedAt - a.lastUsedAt);
}

export async function getStoredJob(id: string): Promise<StoredJob | null> {
  const map = (await readKey<JobMap>(STORAGE_KEYS.jobs)) ?? {};
  return map[id] ?? null;
}

/** Stores a job, keeping its existing analysis, and trims the list to the most recent jobs. */
export async function saveJob(job: JobPosting): Promise<StoredJob> {
  let stored: StoredJob = { job, analysis: null, lastUsedAt: Date.now() };
  await updateKey<JobMap>(STORAGE_KEYS.jobs, () => ({}), (map) => {
    const existing = map[job.id];
    stored = { job, analysis: existing?.analysis ?? null, lastUsedAt: Date.now() };
    map[job.id] = stored;
    const sorted = Object.values(map).sort((a, b) => b.lastUsedAt - a.lastUsedAt);
    for (const old of sorted.slice(MAX_RECENT_JOBS)) delete map[old.job.id];
  });
  return stored;
}

export async function saveJobAnalysis(jobId: string, analysis: JobAnalysis): Promise<void> {
  await updateKey<JobMap>(STORAGE_KEYS.jobs, () => ({}), (map) => {
    if (map[jobId]) map[jobId] = { ...map[jobId], analysis, lastUsedAt: Date.now() };
  });
}

export async function deleteJob(jobId: string): Promise<void> {
  await updateKey<JobMap>(STORAGE_KEYS.jobs, () => ({}), (map) => {
    delete map[jobId];
  });
}

export function watchJobs(listener: (jobs: StoredJob[]) => void): () => void {
  return watchKey<JobMap>(STORAGE_KEYS.jobs, (map) =>
    listener(Object.values(map ?? {}).sort((a, b) => b.lastUsedAt - a.lastUsedAt)),
  );
}
