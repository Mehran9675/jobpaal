import { blockText, textOf } from '../dom';
import type { PartialJob } from '../types';

export interface SelectorSpec {
  title?: string[];
  company?: string[];
  location?: string[];
  salary?: string[];
  employmentType?: string[];
  description?: string[];
  postedAt?: string[];
}

/** Reads each field from the first matching selector. */
export function extractBySelectors(doc: Document, spec: SelectorSpec): PartialJob {
  const out: PartialJob = {};
  const short = ['title', 'company', 'location', 'salary', 'employmentType', 'postedAt'] as const;
  for (const key of short) {
    const selectors = spec[key];
    if (!selectors) continue;
    try {
      const value = textOf(doc, selectors, 200);
      if (value) out[key] = value;
    } catch {
      /* ignore */
    }
  }
  if (spec.description) {
    try {
      const text = blockText(doc, spec.description);
      if (text) out.description = text;
    } catch {
      /* ignore */
    }
  }
  return out;
}

export function hostIs(url: URL, ...hosts: string[]): boolean {
  const host = url.hostname.toLowerCase();
  return hosts.some((h) => host === h || host.endsWith('.' + h));
}

/** Path segment by index (0-based, ignoring empty segments). */
export function pathSegment(url: URL, index: number): string {
  return url.pathname.split('/').filter(Boolean)[index] ?? '';
}

export function exists(doc: Document, selector: string): boolean {
  try {
    return !!doc.querySelector(selector);
  } catch {
    return false;
  }
}

/** Removes a leading label such as "Location:" from a value. */
export function stripLabel(value: string | undefined, label: RegExp): string | undefined {
  if (!value) return value;
  return value.replace(new RegExp(`^${label.source}\\s*:?\\s*`, 'i'), '').trim();
}
