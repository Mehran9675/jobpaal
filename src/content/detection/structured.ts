import { cleanInline } from '@/content/picker/dom';
import { descriptionText } from './dom';
import { htmlToText } from './htmlText';
import { formatBaseSalary } from './salary';
import type { PartialJob } from './types';

type Json = Record<string, unknown>;

function isJobPostingType(type: unknown): boolean {
  if (typeof type === 'string') return /(^|\/|:)JobPosting$/i.test(type);
  if (Array.isArray(type)) return type.some(isJobPostingType);
  return false;
}

/** Walks a JSON-LD value and collects every JobPosting object (arrays, @graph, nesting). */
function collectPostings(value: unknown, out: Json[], depth = 0): void {
  if (!value || depth > 8 || out.length > 10) return;
  if (Array.isArray(value)) {
    for (const item of value) collectPostings(item, out, depth + 1);
    return;
  }
  if (typeof value !== 'object') return;
  const obj = value as Json;
  if (isJobPostingType(obj['@type'])) {
    out.push(obj);
    return;
  }
  if (obj['@graph']) collectPostings(obj['@graph'], out, depth + 1);
  if (obj.mainEntity) collectPostings(obj.mainEntity, out, depth + 1);
  if (obj.itemListElement) collectPostings(obj.itemListElement, out, depth + 1);
  if (obj.item) collectPostings(obj.item, out, depth + 1);
}

/** Lenient JSON parse: strips comments / CDATA wrappers and control characters some sites leave in. */
function parseJson(text: string): unknown {
  const trimmed = text
    .trim()
    .replace(/^\s*<!\[CDATA\[/, '')
    .replace(/\]\]>\s*$/, '')
    .replace(/^\s*\/\/.*$/gm, '');
  try {
    return JSON.parse(trimmed);
  } catch {
    try {
      // Raw newlines / tabs inside strings are a common error.
      return JSON.parse(trimmed.replace(/[\u0000-\u001f]+/g, ' '));
    } catch {
      return null;
    }
  }
}

function str(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return cleanInline(value, 400);
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return str(value[0]);
  if (typeof value === 'object') {
    const obj = value as Json;
    return str(obj.name ?? obj['@value'] ?? obj.value ?? '');
  }
  return '';
}

function addressText(address: unknown): string {
  if (!address) return '';
  if (typeof address === 'string') return cleanInline(address, 200);
  if (Array.isArray(address)) return addressText(address[0]);
  if (typeof address !== 'object') return '';
  const a = address as Json;
  const parts = [str(a.addressLocality), str(a.addressRegion), str(a.addressCountry)].filter(Boolean);
  const unique = parts.filter((part, index) => parts.findIndex((p) => p.toLowerCase() === part.toLowerCase()) === index);
  return unique.join(', ') || str(a.streetAddress) || str(a.name);
}

function locationText(job: Json): string {
  const raw = job.jobLocation;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const places = list
    .map((place) => {
      if (typeof place === 'string') return cleanInline(place, 200);
      if (!place || typeof place !== 'object') return '';
      const p = place as Json;
      return addressText(p.address) || str(p.name);
    })
    .filter(Boolean);
  const unique = [...new Set(places)];
  let text = unique.slice(0, 3).join(' · ');
  if (unique.length > 3) text += ` (+${unique.length - 3} more)`;
  const remote = typeof job.jobLocationType === 'string' && /TELECOMMUTE|remote/i.test(job.jobLocationType);
  if (remote) text = text ? `${text} (Remote)` : 'Remote';
  if (!text && job.applicantLocationRequirements) {
    const req = addressText(job.applicantLocationRequirements) || str(job.applicantLocationRequirements);
    if (req) text = `Remote (${req})`;
  }
  return text;
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACTOR: 'Contract',
  TEMPORARY: 'Temporary',
  INTERN: 'Internship',
  VOLUNTEER: 'Volunteer',
  PER_DIEM: 'Per diem',
  OTHER: 'Other',
};

function employmentText(value: unknown): string {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return [
    ...new Set(
      list
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
        .map((item) => EMPLOYMENT_LABELS[item.toUpperCase().replace(/[-\s]/g, '_')] ?? item),
    ),
  ].join(', ');
}

function postingToJob(job: Json, doc: Document): PartialJob {
  const description = typeof job.description === 'string' ? htmlToText(job.description, doc) : '';
  const extras = ['responsibilities', 'qualifications', 'skills', 'experienceRequirements', 'educationRequirements']
    .map((key) => (typeof job[key] === 'string' ? htmlToText(job[key] as string, doc) : ''))
    .filter((text) => text && !description.includes(text.slice(0, 60)));
  const fullDescription = [description, ...extras].filter(Boolean).join('\n\n');
  return {
    title: str(job.title) || str(job.name),
    company: str(job.hiringOrganization),
    location: locationText(job),
    salary: formatBaseSalary(job.baseSalary) || formatBaseSalary(job.estimatedSalary),
    employmentType: employmentText(job.employmentType),
    description: fullDescription,
    postedAt: str(job.datePosted),
  };
}

/** Number of JSON-LD JobPosting objects on the page (several = a listing page). */
export function countJsonLdPostings(doc: Document): number {
  return readJsonLdPostings(doc).length;
}

function readJsonLdPostings(doc: Document): Json[] {
  const postings: Json[] = [];
  try {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"], script[type="application/json+ld"]');
    for (const script of Array.from(scripts).slice(0, 30)) {
      const text = script.textContent ?? '';
      if (!text || text.length > 2_000_000 || !/JobPosting/i.test(text)) continue;
      collectPostings(parseJson(text), postings);
    }
  } catch {
    /* ignore */
  }
  return postings;
}

/** Reads the JSON-LD JobPosting (the one with the longest description when several exist). */
export function readJsonLd(doc: Document): PartialJob | null {
  const postings = readJsonLdPostings(doc);
  if (!postings.length) return null;
  const jobs = postings.map((posting) => postingToJob(posting, doc));
  jobs.sort((a, b) => (b.description?.length ?? 0) - (a.description?.length ?? 0));
  return jobs[0];
}

function itemprop(scope: Element, name: string): Element | null {
  try {
    return scope.querySelector(`[itemprop~="${name}"]`);
  } catch {
    return null;
  }
}

function itempropValue(scope: Element, name: string): string {
  const el = itemprop(scope, name);
  if (!el) return '';
  return cleanInline(el.getAttribute('content') ?? el.getAttribute('datetime') ?? el.textContent, 300);
}

/** Reads schema.org microdata (itemtype=…/JobPosting). */
export function readMicrodata(doc: Document): PartialJob | null {
  try {
    const scope = doc.querySelector('[itemtype*="JobPosting"]');
    if (!scope) return null;
    const org = itemprop(scope, 'hiringOrganization');
    const locationEl = itemprop(scope, 'jobLocation');
    const descriptionEl = itemprop(scope, 'description');
    const salaryEl = itemprop(scope, 'baseSalary');
    return {
      title: itempropValue(scope, 'title'),
      company: org ? itempropValue(org, 'name') || cleanInline(org.getAttribute('content') ?? org.textContent, 150) : '',
      location: locationEl
        ? [itempropValue(locationEl, 'addressLocality'), itempropValue(locationEl, 'addressRegion'), itempropValue(locationEl, 'addressCountry')]
            .filter(Boolean)
            .join(', ') || cleanInline(locationEl.textContent, 150)
        : '',
      salary: salaryEl ? cleanInline(salaryEl.getAttribute('content') ?? salaryEl.textContent, 120) : '',
      employmentType: itempropValue(scope, 'employmentType'),
      description: descriptionEl
        ? descriptionEl.getAttribute('content')
          ? htmlToText(descriptionEl.getAttribute('content') ?? '', doc)
          : descriptionText(descriptionEl)
        : '',
      postedAt: itempropValue(scope, 'datePosted'),
    };
  } catch {
    return null;
  }
}

/** JSON-LD first, microdata as a fallback. */
export function readStructured(doc: Document): PartialJob | null {
  try {
    return readJsonLd(doc) ?? readMicrodata(doc);
  } catch {
    return null;
  }
}
