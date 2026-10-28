import { findApplicationByPageKey, getDocumentsByIds, getStoredJob } from '@/shared/storage';
import { hashString } from '@/shared/utils/hash';
import { buildEffectiveDetection } from './effectiveJob';
import { store } from './store';

/** Recomputes the effective job from detection + overrides. */
export function recomputeDetection(): void {
  const s = store.get();
  store.set({ detection: buildEffectiveDetection(s.url, s.pageKey, s.detected, s.override, s.form, s.forced) });
}

/** Loads the application, files and analysis that belong to this page. */
export async function refreshApplication(): Promise<void> {
  const { pageKey, detection } = store.get();
  const application = await findApplicationByPageKey(pageKey);
  const documents = application ? await getDocumentsByIds(application.documentIds) : [];
  let analysis = application?.analysis ?? null;
  const job = detection.job;
  if (job?.description) {
    const stored = await getStoredJob(job.id);
    const hash = hashString(job.description);
    if (stored?.analysis?.descriptionHash === hash) analysis = stored.analysis;
    else if (analysis && analysis.descriptionHash !== hash && !application) analysis = null;
  }
  store.set({ application, documents, analysis });
}
