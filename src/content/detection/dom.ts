import { cleanInline, isInsideOverlay } from '@/content/picker/dom';
import { extractText } from '@/content/picker/elementText';

export const MAX_DESCRIPTION = 30000;

/** Subtrees never used as job content. */
export const EXCLUDED_SELECTOR = [
  'nav',
  'header',
  'footer',
  'aside',
  'form',
  'select',
  'button',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '[role="dialog"]',
  '[role="menu"]',
  '[role="listbox"]',
  '[aria-modal="true"]',
  '#jobpaal-root',
  '[id*="cookie"]',
  '[class*="cookie"]',
  '[id*="consent"]',
  '[class*="consent"]',
  '[id*="gdpr"]',
  '[class*="gdpr"]',
].join(',');

export function isExcluded(el: Element): boolean {
  try {
    return el.matches(EXCLUDED_SELECTOR) || isInsideOverlay(el);
  } catch {
    return false;
  }
}

/** First element matching any selector (in order) with non-empty text. */
export function firstMatch(doc: Document | Element, selectors: string[]): Element | null {
  for (const selector of selectors) {
    try {
      const list = doc.querySelectorAll(selector);
      for (const el of Array.from(list).slice(0, 10)) {
        if (isInsideOverlay(el)) continue;
        if (cleanInline(el.textContent)) return el;
      }
    } catch {
      /* invalid selector: try next */
    }
  }
  return null;
}

/** Short single-line text of the first matching element. */
export function textOf(doc: Document | Element, selectors: string[], max = 300): string {
  const el = firstMatch(doc, selectors);
  return el ? cleanInline(el.textContent, max) : '';
}

/** Multi-line description text of the first matching element(s). */
export function blockText(doc: Document | Element, selectors: string[]): string {
  const el = firstMatch(doc, selectors);
  return el ? descriptionText(el) : '';
}

/** Concatenates the text of every element matching the selectors (in document order, deduplicated). */
export function joinedBlocks(doc: Document | Element, selector: string): string {
  try {
    const list = Array.from(doc.querySelectorAll(selector));
    const top = list.filter((el) => !list.some((other) => other !== el && other.contains(el)));
    return top
      .map((el) => descriptionText(el))
      .filter(Boolean)
      .join('\n\n')
      .slice(0, MAX_DESCRIPTION);
  } catch {
    return '';
  }
}

/** Description text: keeps line breaks, skips forms, buttons, nav and the overlay. */
export function descriptionText(el: Element): string {
  return extractText(el, {
    maxChars: MAX_DESCRIPTION,
    skip: (child) => {
      const tag = child.tagName;
      return tag === 'FORM' || tag === 'BUTTON' || tag === 'SELECT' || tag === 'NAV' || child.id === 'jobpaal-root';
    },
  });
}

export function meta(doc: Document, names: string[]): string {
  for (const name of names) {
    try {
      const el = doc.querySelector(`meta[property="${name}"], meta[name="${name}"], meta[itemprop="${name}"]`);
      const content = cleanInline(el?.getAttribute('content'));
      if (content) return content;
    } catch {
      /* ignore */
    }
  }
  return '';
}

/** Value after a "Label:" in an element list, or the next sibling of a label element (dt/dd, th/td). */
export function labelledValue(doc: Document | Element, pattern: RegExp, max = 150): string {
  let nodes: Element[] = [];
  try {
    nodes = Array.from(doc.querySelectorAll('dt, th, label, strong, b, span, div, li, p, h3, h4, h5, h6')).slice(0, 6000);
  } catch {
    return '';
  }
  for (const el of nodes) {
    const raw = el.textContent ?? '';
    if (raw.length > 200 || isExcluded(el)) continue;
    const text = cleanInline(raw);
    const inline = new RegExp(`^${pattern.source}\\s*[:\\-–]\\s*(.+)$`, 'i').exec(text);
    if (inline && inline[inline.length - 1].trim().length > 1) return cleanInline(inline[inline.length - 1], max);
    if (new RegExp(`^${pattern.source}\\s*:?$`, 'i').test(text)) {
      const next = el.nextElementSibling;
      const value = cleanInline(next?.textContent, max + 50);
      if (value && value.length <= max) return value;
      const parentNext = el.parentElement?.nextElementSibling;
      const parentValue = cleanInline(parentNext?.textContent, max + 50);
      if (el.parentElement && cleanInline(el.parentElement.textContent) === text && parentValue && parentValue.length <= max)
        return parentValue;
    }
  }
  return '';
}

/** Capitalised first label of a host (acme.wd5.myworkdayjobs.com → Acme). */
export function companyFromSubdomain(host: string, skip: RegExp = /^(www|jobs|careers|apply|boards|job-boards)$/i): string {
  const label = host.split('.').find((part) => !skip.test(part)) ?? '';
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : '';
}

/** Capitalised path segment, e.g. jobs.lever.co/acme-inc/... → Acme Inc. */
export function companyFromSlug(slug: string): string {
  return decodeURIComponent(slug || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Splits titles like "Senior Engineer - Acme" / "Acme - Senior Engineer". */
export function splitTitle(raw: string): string[] {
  return cleanInline(raw)
    .split(/\s+[|–—\-·•@]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}
