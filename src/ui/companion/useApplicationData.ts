import { useEffect, useState } from 'react';
import { STORAGE_KEYS, getApplication, getDocumentsByIds, getStoredJob, watchKeys } from '@/shared/storage';
import type { Application, JobAnalysis, StoredDocument } from '@/shared/types';
import { hashString } from '@/shared/utils/hash';
import type { ContentState } from '@/shared/messaging';

export interface ApplicationData {
  application: Application | null;
  documents: StoredDocument[];
  analysis: JobAnalysis | null;
}

/** The application, files and analysis belonging to the page the content script reports. */
export function useApplicationData(state: ContentState | null): ApplicationData {
  const [data, setData] = useState<ApplicationData>({ application: null, documents: [], analysis: null });
  const applicationId = state?.applicationId ?? null;
  const job = state?.detection.job ?? null;
  const jobId = job?.id ?? null;
  const descriptionHash = job?.description ? hashString(job.description) : '';

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const application = applicationId ? await getApplication(applicationId) : null;
      const documents = application ? await getDocumentsByIds(application.documentIds) : [];
      let analysis = application?.analysis ?? null;
      if (jobId) {
        const stored = await getStoredJob(jobId);
        if (stored?.analysis && stored.analysis.descriptionHash === descriptionHash) analysis = stored.analysis;
      }
      if (alive) setData({ application, documents, analysis });
    };
    void load();
    const unwatch = watchKeys([STORAGE_KEYS.applications, STORAGE_KEYS.documents, STORAGE_KEYS.jobs], () => void load());
    return () => {
      alive = false;
      unwatch();
    };
  }, [applicationId, jobId, descriptionHash]);

  return data;
}
