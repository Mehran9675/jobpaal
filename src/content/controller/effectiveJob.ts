import { checkJobDescriptionProse } from '@/shared/text/prose';
import { extractKeywords, extractRequirementLines } from '@/shared/text/keywords';
import type { DetectionIssue, FormSummary, JobField, JobPosting, PageDetection } from '@/shared/types';
import { hashString } from '@/shared/utils/hash';
import { hostFromUrl } from '@/shared/utils/url';
import type { FrameJobDetection } from '@/shared/messaging';
import type { JobOverride } from './state';

function blankJob(url: string, pageKey: string): JobPosting {
  const host = hostFromUrl(url);
  return {
    id: 'job_' + hashString(pageKey),
    url,
    pageKey,
    host,
    siteName: host,
    atsKey: 'generic',
    title: '',
    company: '',
    location: '',
    salary: '',
    employmentType: '',
    description: '',
    requirements: [],
    keywords: [],
    postedAt: '',
    sources: {},
    detectedAt: Date.now(),
  };
}

/**
 * Combines what was read from the page with what the user picked or pasted,
 * and lists exactly what is still missing.
 */
export function buildEffectiveDetection(
  url: string,
  pageKey: string,
  detected: FrameJobDetection | null,
  override: JobOverride,
  form: FormSummary,
  forced: boolean,
): PageDetection {
  const base = detected?.job ? { ...detected.job, url, pageKey, id: 'job_' + hashString(pageKey) } : blankJob(url, pageKey);
  const job: JobPosting = { ...base, sources: { ...base.sources } };
  for (const [field, value] of Object.entries(override.fields) as [JobField, string][]) {
    if (value === undefined) continue;
    job[field] = value;
    const source = override.sources[field];
    if (source) job.sources[field] = source;
  }
  if (override.fields.description !== undefined) {
    job.requirements = extractRequirementLines(job.description);
    job.keywords = extractKeywords(job.description);
  }

  const descriptionCheck = checkJobDescriptionProse(job.description);
  const issues: DetectionIssue[] = [];
  if (!job.title.trim()) issues.push({ field: 'title', message: 'The job title could not be read.' });
  if (!job.company.trim()) issues.push({ field: 'company', message: 'The company name could not be read.' });
  if (!descriptionCheck.ok) {
    const pageIssue = detected?.issues.find((i) => i.field === 'description');
    issues.push({
      field: 'description',
      message:
        override.fields.description !== undefined
          ? `The description you provided is not usable: ${descriptionCheck.reason}`
          : (pageIssue?.message ?? `No real job description was found: ${descriptionCheck.reason}`),
    });
  }
  for (const issue of detected?.issues ?? []) {
    if (!['title', 'company', 'description'].includes(issue.field) && !issues.some((i) => i.message === issue.message)) {
      issues.push(issue);
    }
  }

  const hasAnything = Boolean(job.title || job.company || job.description);
  return {
    url,
    pageKey,
    isJobPage: Boolean(detected?.isJobPage) || forced,
    forced,
    confidence: detected?.confidence ?? 0,
    job: hasAnything || forced || detected ? job : null,
    form,
    issues,
    hasValidDescription: descriptionCheck.ok,
  };
}
