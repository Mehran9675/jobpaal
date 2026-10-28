import { normalizeForCompare } from '@/shared/utils/text';

export interface BulletSource {
  highlights: string[];
  description: string;
}

export function cleanBullet(text: string): string {
  return (text ?? '')
    .replace(/^[\s•·▪◦‣*\-–—]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Maximum bullets for an entry: one per source highlight, +1 when there is a description to draw from. */
export function maxBullets(source: BulletSource): number {
  return source.highlights.filter((h) => h.trim()).length + (source.description.trim() ? 1 : 0);
}

/**
 * Guards rewritten bullets for one entry. A bullet failing `passes` is replaced by the
 * corresponding original highlight (if not already used). Never exceeds `maxBullets`,
 * drops empties and duplicates. Without AI bullets, the originals are kept.
 */
export function guardBullets(rewritten: string[], source: BulletSource, passes: (bullet: string) => boolean): string[] {
  const originals = source.highlights.map(cleanBullet);
  const ai = rewritten.map(cleanBullet).filter(Boolean);
  if (!ai.length) return originals.filter(Boolean);
  const limit = maxBullets(source);
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (bullet: string): boolean => {
    const key = normalizeForCompare(bullet);
    if (!bullet || !key || seen.has(key)) return false;
    seen.add(key);
    out.push(bullet);
    return true;
  };
  ai.forEach((bullet, i) => {
    if (out.length >= limit) return;
    if (passes(bullet)) push(bullet);
    else if (originals[i]) push(originals[i]);
  });
  return out;
}
