import { SITE_ADAPTERS } from './sites';
import type { KnownSite, SiteAdapter } from './types';

export function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/** The adapter for this URL / document, or null. */
export function adapterFor(url: string, doc: Document): SiteAdapter | null {
  const parsed = parseUrl(url);
  if (!parsed) return null;
  for (const adapter of SITE_ADAPTERS) {
    try {
      if (adapter.matches(parsed, doc)) return adapter;
    } catch {
      /* a broken adapter never breaks detection */
    }
  }
  return null;
}

/** Which known board / ATS this URL belongs to (or null). */
export function identifySite(url: string, doc: Document): KnownSite | null {
  try {
    const adapter = adapterFor(url, doc);
    return adapter ? { key: adapter.key, name: adapter.name } : null;
  } catch {
    return null;
  }
}
