import { isInsideOverlay } from '@/content/picker/dom';
import { descriptionText, EXCLUDED_SELECTOR } from './dom';

/** Headings that typically appear inside job descriptions. */
export const JOB_HEADING_RE =
  /^(about (the|this) (role|job|position|team|opportunity)|the role|role overview|job (description|summary|overview|details|purpose)|position (summary|overview|description)|responsibilities|key responsibilities|your responsibilities|duties|what you('|’)?ll (do|be doing|bring|need)|what we('|’)?re looking for|what you (bring|need|have)|who you are|requirements|minimum requirements|qualifications|(basic|minimum|preferred|required) qualifications|skills( and| &) (experience|qualifications)|experience|nice to have|bonus points|preferred|benefits|perks|what we offer|compensation|about you|your profile|your role|your tasks|the opportunity|you will|you have|must have)/i;

const PARA_SELECTOR = 'p, li, pre, blockquote, dd, div, td, span';
const MAX_NODES = 8000;

interface Candidate {
  el: Element;
  score: number;
}

function ownTextLength(el: Element): number {
  let length = 0;
  for (let child = el.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === 3) length += (child.nodeValue ?? '').trim().length;
    else if (child.nodeType === 1 && /^(B|STRONG|EM|I|A|SPAN|U|BR|CODE|SMALL|FONT)$/.test((child as Element).tagName))
      length += ((child as Element).textContent ?? '').trim().length;
  }
  return length;
}

function excludedCache(): (el: Element) => boolean {
  const cache = new WeakMap<Element, boolean>();
  return (el: Element): boolean => {
    const cached = cache.get(el);
    if (cached !== undefined) return cached;
    let result = false;
    try {
      result = !!el.closest(EXCLUDED_SELECTOR) || isInsideOverlay(el);
    } catch {
      result = false;
    }
    cache.set(el, result);
    return result;
  };
}

function linkDensity(el: Element, textLength: number): number {
  if (!textLength) return 1;
  let linkLength = 0;
  const links = el.querySelectorAll('a');
  for (let i = 0; i < Math.min(links.length, 500); i++) linkLength += (links[i].textContent ?? '').trim().length;
  return Math.min(1, linkLength / textLength);
}

function jobHeadingCount(el: Element): number {
  let count = 0;
  const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b, p > u, [role="heading"]');
  for (let i = 0; i < Math.min(headings.length, 300); i++) {
    const text = (headings[i].textContent ?? '').trim();
    if (text.length > 0 && text.length < 70 && JOB_HEADING_RE.test(text)) count++;
  }
  return count;
}

/**
 * Finds the best prose blocks on the page, best first. Paragraph-like nodes add score to their
 * ancestors (readability style); candidates are then weighted by job-ish headings and link density.
 */
export function findDescriptionCandidates(doc: Document, limit = 4): Element[] {
  const body = doc.body;
  if (!body) return [];
  const isExcluded = excludedCache();
  const scores = new Map<Element, number>();
  let nodes: NodeListOf<Element>;
  try {
    nodes = body.querySelectorAll(PARA_SELECTOR);
  } catch {
    return [];
  }
  const max = Math.min(nodes.length, MAX_NODES);
  for (let i = 0; i < max; i++) {
    const el = nodes[i];
    const tag = el.tagName;
    const length = tag === 'DIV' || tag === 'TD' || tag === 'SPAN' ? ownTextLength(el) : (el.textContent ?? '').trim().length;
    if (length < 25) continue;
    if (isExcluded(el)) continue;
    const text = el.textContent ?? '';
    const commas = (text.match(/[,.;]/g) ?? []).length;
    const points = 1 + Math.min(length / 100, 3) + Math.min(commas, 10) * 0.3;
    let ancestor: Element | null = tag === 'DIV' || tag === 'TD' ? el : el.parentElement;
    for (let level = 0; ancestor && level < 4; level++) {
      if (ancestor === doc.documentElement) break;
      const share = level === 0 ? 1 : level === 1 ? 0.5 : level === 2 ? 0.33 : 0.2;
      scores.set(ancestor, (scores.get(ancestor) ?? 0) + points * share);
      ancestor = ancestor.parentElement;
    }
  }

  const candidates: Candidate[] = [];
  for (const [el, base] of scores) {
    if (base < 5 || isExcluded(el)) continue;
    candidates.push({ el, score: base });
  }
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, 15);
  for (const candidate of top) {
    const length = (candidate.el.textContent ?? '').trim().length;
    const density = linkDensity(candidate.el, length);
    const headings = jobHeadingCount(candidate.el);
    candidate.score = candidate.score * (1 - density) * (1 + Math.min(headings, 5) * 0.25);
    if (candidate.el === body) candidate.score *= 0.6;
  }
  top.sort((a, b) => b.score - a.score);

  // Prefer distinct blocks: drop candidates nested inside a better one unless they are much smaller in score.
  const result: Element[] = [];
  for (const candidate of top) {
    if (result.some((chosen) => chosen.contains(candidate.el) || candidate.el.contains(chosen))) continue;
    result.push(candidate.el);
    if (result.length >= limit) break;
  }
  return result;
}

/** Text of the best prose blocks, best first. */
export function genericDescriptions(doc: Document): string[] {
  try {
    return findDescriptionCandidates(doc)
      .map((el) => descriptionText(el))
      .filter((text) => text.length > 0);
  } catch {
    return [];
  }
}

/** Number of job-ish headings in a description text (used as a job-page signal). */
export function jobHeadingLines(text: string): number {
  let count = 0;
  for (const line of text.split('\n').slice(0, 400)) {
    const trimmed = line.replace(/^[•\s]+/, '').trim();
    if (trimmed.length > 0 && trimmed.length < 70 && JOB_HEADING_RE.test(trimmed)) count++;
  }
  return count;
}
