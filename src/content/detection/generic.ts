import { cleanInline, isInsideOverlay } from '@/content/picker/dom';
import { isExcluded, labelledValue, meta, splitTitle } from './dom';
import { findSalary } from './salary';
import type { PartialJob } from './types';

const EMPLOYMENT_RE = /\b(full[-\s]?time|part[-\s]?time|contract(or)?|temporary|internship|freelance|permanent|fixed[-\s]term)\b/i;

/** Parses "Job Application for X at Y", "X at Y", "X - Y | Careers" into title / company. */
export function parseTitleString(raw: string): { title: string; company: string } {
  let text = cleanInline(raw, 300);
  text = text.replace(/^(job application for|apply for|job:|job opening:?|careers?:)\s+/i, '');
  const at = /^(.{3,120}?)\s+(?:at|@)\s+(.{2,80}?)(?:\s+[|–—-]\s+.*)?$/i.exec(text);
  if (at) return { title: at[1].trim(), company: at[2].trim() };
  const parts = splitTitle(text).filter((part) => !/^(careers?|jobs?|job board|home|apply|job details|hiring)$/i.test(part));
  if (parts.length >= 2) return { title: parts[0], company: parts[1].replace(/\s+(careers?|jobs)$/i, '') };
  return { title: parts[0] ?? text, company: '' };
}

function visibleH1(doc: Document): string {
  const list = doc.querySelectorAll('h1');
  for (const h1 of Array.from(list).slice(0, 10)) {
    if (isInsideOverlay(h1) || (h1 as HTMLElement).hidden) continue;
    if (h1.closest('nav, footer, [role="dialog"], [class*="cookie"]')) continue;
    const text = cleanInline(h1.textContent, 300);
    if (text.length >= 3 && text.length <= 150) return text;
  }
  return '';
}

export function genericTitle(doc: Document): string {
  const h1 = visibleH1(doc);
  if (h1) return parseTitleString(h1).title || h1;
  const og = meta(doc, ['og:title', 'twitter:title']);
  if (og) return parseTitleString(og).title;
  return parseTitleString(doc.title ?? '').title;
}

function logoCompany(doc: Document): string {
  try {
    const imgs = doc.querySelectorAll('header img[alt], img[alt*="logo" i], [class*="logo"] img[alt]');
    for (const img of Array.from(imgs).slice(0, 10)) {
      const alt = cleanInline(img.getAttribute('alt'), 120)
        .replace(/\b(company\s+)?logo\b/gi, '')
        .replace(/[-|:]+$/, '')
        .trim();
      if (alt.length >= 2 && alt.length <= 60 && !/^(home|image|icon)$/i.test(alt)) return alt;
    }
  } catch {
    /* ignore */
  }
  return '';
}

export function genericCompany(doc: Document): string {
  const fromTitles = [visibleH1(doc), meta(doc, ['og:title']), doc.title ?? '']
    .map((value) => (/(\s(at|@)\s)/i.test(value) ? parseTitleString(value).company : ''))
    .find(Boolean);
  if (fromTitles) return fromTitles;
  const labelled = labelledValue(doc, /(company|employer|hiring company)/, 80);
  if (labelled) return labelled;
  const site = meta(doc, ['og:site_name', 'application-name', 'author']);
  if (site && site.length <= 60) return site.replace(/\s+(careers?|jobs)$/i, '');
  const logo = logoCompany(doc);
  if (logo) return logo;
  const parsed = parseTitleString(doc.title ?? '');
  return parsed.company;
}

export function genericLocation(doc: Document): string {
  const labelled = labelledValue(doc, /(job\s+)?(location|locations|work location|office|based in)/, 120);
  if (labelled) return labelled;
  try {
    const candidates = doc.querySelectorAll('[class*="location" i], [data-testid*="location" i], [id*="location" i]');
    for (const el of Array.from(candidates).slice(0, 20)) {
      if (isExcluded(el) || el.closest('form')) continue;
      const text = cleanInline(el.textContent, 200);
      if (text.length >= 2 && text.length <= 120) return text.replace(/^location\s*:?\s*/i, '');
    }
  } catch {
    /* ignore */
  }
  return '';
}

export function genericSalary(doc: Document, description: string): string {
  const labelled = labelledValue(doc, /(salary|compensation|pay|pay range|salary range|base pay|wage)/, 150);
  if (labelled) {
    const amount = findSalary(labelled);
    if (amount) return amount;
    if (/\d/.test(labelled)) return labelled;
  }
  try {
    const candidates = doc.querySelectorAll('[class*="salary" i], [class*="compensation" i], [data-testid*="salary" i]');
    for (const el of Array.from(candidates).slice(0, 20)) {
      const amount = findSalary(cleanInline(el.textContent, 300));
      if (amount) return amount;
    }
  } catch {
    /* ignore */
  }
  // In the description, only accept ranges or amounts with a unit.
  const amount = findSalary(description);
  if (amount && /(-|–|—|to|per|\/|year|hour|annum|k\b)/i.test(amount)) return amount;
  return '';
}

export function genericEmploymentType(doc: Document, description: string): string {
  const labelled = labelledValue(doc, /(employment type|job type|type of employment|contract type|schedule)/, 80);
  if (labelled) return labelled;
  const match = EMPLOYMENT_RE.exec(description.slice(0, 3000));
  return match ? match[0].replace(/\s+/, '-').replace(/^./, (c) => c.toUpperCase()) : '';
}

export function genericPostedAt(doc: Document): string {
  const metaDate = meta(doc, ['article:published_time', 'datePosted', 'date']);
  if (metaDate) return metaDate;
  const labelled = labelledValue(doc, /(posted|date posted|posted on|published)/, 60);
  return labelled;
}

/** Generic reader for any site (description is handled separately by `genericDescriptions`). */
export function readGeneric(doc: Document): PartialJob {
  const read = <T,>(fn: () => T, fallback: T): T => {
    try {
      return fn();
    } catch {
      return fallback;
    }
  };
  return {
    title: read(() => genericTitle(doc), ''),
    company: read(() => genericCompany(doc), ''),
    location: read(() => genericLocation(doc), ''),
    postedAt: read(() => genericPostedAt(doc), ''),
  };
}
