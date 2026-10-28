import type { DetectionIssue, ElementLocator, FieldSource, JobField, JobPosting, SiteMapping } from '@/shared/types';
import { checkJobDescriptionProse } from '@/shared/text/prose';
import { extractKeywords, extractRequirementLines } from '@/shared/text/keywords';
import { hashString } from '@/shared/utils/hash';
import { hostFromUrl, pageKeyFromUrl } from '@/shared/utils/url';
import { cleanInline, isTopFrame } from '@/content/picker/dom';
import { elementText, normalizeText } from '@/content/picker/elementText';
import { resolveLocator } from '@/content/picker/locator';
import { genericDescriptions, jobHeadingLines } from './description';
import { descriptionText, MAX_DESCRIPTION } from './dom';
import { genericEmploymentType, genericSalary, readGeneric } from './generic';
import { adapterFor, parseUrl } from './identify';
import { hasApplySignal, hasJobUrl, hasTitleWord, jobLinkCount } from './signals';
import { countJsonLdPostings, readStructured } from './structured';
import type { JobDetectionResult, PartialJob } from './types';

const LIMITS: Record<string, number> = { title: 200, company: 120, location: 200, salary: 150, employmentType: 100, postedAt: 60 };

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** Whether a saved locator applies to this frame. '' = top frame only; otherwise same host. */
function locatorApplies(locator: ElementLocator, doc: Document, url: string): boolean {
  if (!locator) return false;
  if (!locator.frameUrl) return isTopFrame(doc);
  return hostFromUrl(locator.frameUrl) === hostFromUrl(url);
}

function readGuide(doc: Document, url: string, mapping: SiteMapping | null): PartialJob {
  const out: PartialJob = {};
  if (!mapping?.jobFields) return out;
  for (const [field, locator] of Object.entries(mapping.jobFields) as [JobField, ElementLocator][]) {
    if (!locator || !locatorApplies(locator, doc, url)) continue;
    const el = safe(() => resolveLocator(doc, locator), null);
    if (!el) continue;
    if (field === 'description') {
      const text = safe(() => (/^(INPUT|TEXTAREA)$/.test(el.tagName) ? elementText(el) : descriptionText(el)), '');
      if (text) out.description = text;
    } else {
      const text = cleanInline(safe(() => elementText(el), ''), LIMITS[field] ?? 200);
      if (text) out[field] = text;
    }
  }
  return out;
}

function cleanDescription(text: string): string {
  return normalizeText(text ?? '').slice(0, MAX_DESCRIPTION);
}

interface DescriptionPick {
  text: string;
  source: FieldSource | null;
  reason: string;
}

function pickDescription(candidates: [FieldSource, () => string[]][]): DescriptionPick {
  let reason = '';
  for (const [source, get] of candidates) {
    const texts = safe(get, [] as string[]);
    for (const raw of texts) {
      const text = cleanDescription(raw);
      if (!text) continue;
      const check = checkJobDescriptionProse(text);
      if (check.ok) return { text, source, reason: '' };
      if (!reason) reason = check.reason;
    }
  }
  return { text: '', source: null, reason: reason || 'No job description text was found.' };
}

function emptyResult(issues: DetectionIssue[] = []): JobDetectionResult {
  return { isJobPage: false, confidence: 0, job: null, issues, hasValidDescription: false };
}

function detectUnsafe(doc: Document, url: string, mapping: SiteMapping | null): JobDetectionResult {
  const parsed = parseUrl(url);
  const adapter = adapterFor(url, doc);
  const adapterJobPage = !!adapter && !!parsed && safe(() => adapter.isJobPage(parsed, doc), false);
  const fromAdapter: PartialJob = adapter && parsed ? safe(() => adapter.extract(doc, parsed), {}) : {};
  const structured = safe(() => readStructured(doc), null);
  const postingCount = safe(() => countJsonLdPostings(doc), 0);
  const guide = safe(() => readGuide(doc, url, mapping), {} as PartialJob);
  const generic = safe(() => readGeneric(doc), {} as PartialJob);

  const sources: Partial<Record<JobField, FieldSource>> = {};
  const layers: [FieldSource, PartialJob][] = [
    ['guide', guide],
    ['adapter', fromAdapter],
    ['structured', structured ?? {}],
    ['generic', generic],
  ];
  const pick = (field: keyof PartialJob, recordAs?: JobField): string => {
    for (const [source, layer] of layers) {
      const value = cleanInline(layer[field] ?? '', LIMITS[field] ?? 200);
      if (value) {
        if (recordAs) sources[recordAs] = source;
        return value;
      }
    }
    return '';
  };

  const title = pick('title', 'title');
  const company = pick('company', 'company');
  const location = pick('location', 'location');

  // THE PROSE RULE: a description only counts when it reads like prose.
  const description = pickDescription([
    ['guide', () => (guide.description ? [guide.description] : [])],
    ['adapter', () => (fromAdapter.description ? [fromAdapter.description] : [])],
    ['structured', () => (structured?.description ? [structured.description] : [])],
    ['generic', () => genericDescriptions(doc)],
  ]);
  if (description.source) sources.description = description.source;
  const hasValidDescription = !!description.text;

  let salary = pick('salary', 'salary');
  if (!salary) {
    salary = cleanInline(safe(() => genericSalary(doc, description.text), ''), LIMITS.salary);
    if (salary) sources.salary = 'generic';
  }
  const employmentType =
    pick('employmentType') || cleanInline(safe(() => genericEmploymentType(doc, description.text), ''), LIMITS.employmentType);
  const postedAt = pick('postedAt');

  // Is this a job page?
  const guideResolved = !!(guide.title || guide.description || guide.company);
  const structuredPosting = !!structured && !!(structured.title || structured.description) && postingCount <= 1;
  const headings = jobHeadingLines(description.text);
  let isJobPage = false;
  let confidence = 0;
  if (adapterJobPage) {
    isJobPage = true;
    confidence = hasValidDescription ? 0.95 : 0.8;
  } else if (structuredPosting) {
    isJobPage = true;
    confidence = hasValidDescription ? 0.9 : 0.75;
  } else if (guideResolved) {
    isJobPage = true;
    confidence = hasValidDescription ? 0.85 : 0.7;
  } else if (hasValidDescription && !adapter) {
    let signals = 0;
    if (headings >= 2) signals += 1;
    else if (headings === 1) signals += 0.5;
    if (safe(() => hasApplySignal(doc), false)) signals += 1;
    if (hasTitleWord(title)) signals += 1;
    if (hasJobUrl(url)) signals += 0.5;
    if (salary || employmentType) signals += 0.5;
    const listing = safe(() => jobLinkCount(doc, url), 0) > 10 && headings < 2;
    isJobPage = signals >= 2 && !listing;
    confidence = isJobPage ? Math.min(0.85, 0.4 + signals * 0.1) : Math.min(0.3, signals * 0.1);
  } else {
    confidence = hasValidDescription ? 0.2 : 0;
  }

  if (!title && !company && !hasValidDescription) {
    return emptyResult(isJobPage ? [{ field: 'page', message: 'This looks like a job page, but nothing could be read from it. Pick the fields or paste the description.' }] : []);
  }

  const pageKey = pageKeyFromUrl(url);
  const host = hostFromUrl(url);
  const job: JobPosting = {
    id: 'job_' + hashString(pageKey),
    url,
    pageKey,
    host,
    siteName: adapter?.name ?? host,
    atsKey: adapter?.key ?? 'generic',
    title,
    company,
    location,
    salary,
    employmentType,
    description: description.text,
    requirements: hasValidDescription ? safe(() => extractRequirementLines(description.text), []) : [],
    keywords: hasValidDescription ? safe(() => extractKeywords(description.text), []) : [],
    postedAt,
    sources,
    detectedAt: Date.now(),
  };

  const issues: DetectionIssue[] = [];
  if (!hasValidDescription) {
    issues.push({
      field: 'description',
      message: `No real job description was found on this page (${description.reason.replace(/\.$/, '')}). Pick it, paste it, or choose a recent job.`,
    });
  }
  if (!title) issues.push({ field: 'title', message: 'The job title could not be read. Pick it on the page or type it in.' });
  if (!company) issues.push({ field: 'company', message: 'The company name could not be read. Pick it on the page or type it in.' });

  return { isJobPage, confidence, job, issues, hasValidDescription };
}

/** Reads the job posting on the page: site mapping → named board/ATS adapter → JSON-LD → generic reader. */
export function detectJob(doc: Document, url: string, mapping: SiteMapping | null): JobDetectionResult {
  try {
    return detectUnsafe(doc, url, mapping);
  } catch {
    return emptyResult();
  }
}
