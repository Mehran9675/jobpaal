import { analyzeJob } from '@/shared/ai';
import { getStoredJob, saveJob, saveJobAnalysis } from '@/shared/storage';
import type { JobAnalysis, JobPosting, Profile } from '@/shared/types';
import { hashString } from '@/shared/utils/hash';

/**
 * Returns the stored analysis for this job when it was made from the same description,
 * otherwise runs a new one. `force` (an explicit Match click) always re-runs.
 */
export async function getOrRunAnalysis(job: JobPosting, profile: Profile, force: boolean): Promise<JobAnalysis> {
  const stored = (await getStoredJob(job.id)) ?? (await saveJob(job));
  if (!force && stored.analysis && stored.analysis.descriptionHash === hashString(job.description)) {
    await saveJob(job);
    return stored.analysis;
  }
  await saveJob(job);
  const analysis = await analyzeJob(job, profile);
  await saveJobAnalysis(job.id, analysis);
  return analysis;
}
