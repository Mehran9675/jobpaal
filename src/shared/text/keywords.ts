import { normalizeForCompare, uniqueStrings } from '@/shared/utils/text';

const STOP = new Set(
  'a an and are as at be by for from has have in is it of on or our that the their this to we will with you your who what when where which while about across all also any can do etc into may more most must not other per such than them then there these they through using within would able ability experience work working team role job candidate candidates years year including include strong excellent good great new well based new plus'.split(
    ' ',
  ),
);

/** Lines in the description that read like requirements (bullets under requirement-ish headings or with requirement verbs). */
export function extractRequirementLines(description: string): string[] {
  const lines = description
    .split(/\n|(?<=\.)\s+(?=[A-Z•·▪-])/)
    .map((l) => l.replace(/^[\s•·▪◦‣*\-–—\d.)]+/, '').trim())
    .filter((l) => l.length > 12 && l.length < 300);
  const requirementish = /(experience (with|in)|proficien|knowledge of|familiar|degree|years|skills? in|ability to|must|required|requirement|you have|you bring|we're looking|qualification|understanding of|hands-on|expertise)/i;
  return uniqueStrings(lines.filter((l) => requirementish.test(l))).slice(0, 40);
}

const TECH_PATTERN =
  /\b([A-Z][a-zA-Z0-9+#.]*(?:\s[A-Z][a-zA-Z0-9+#.]*){0,2}|[a-z]+\.js|[A-Za-z]+\+\+|C#|\.NET|[A-Z]{2,}[a-z]?s?)\b/g;

/** Rough keyword extraction for display and local matching (AI analysis gives better ATS keywords). */
export function extractKeywords(description: string, limit = 30): string[] {
  const counts = new Map<string, { label: string; count: number }>();
  for (const match of description.matchAll(TECH_PATTERN)) {
    const label = match[1].trim();
    const key = normalizeForCompare(label);
    if (!key || STOP.has(key) || key.length < 2) continue;
    if (/^(The|We|You|Our|This|As|In|If|At|For|And|With|To|Your|About|What|Who|Why|How|Job|Role)$/.test(label)) continue;
    const entry = counts.get(key) ?? { label, count: 0 };
    entry.count++;
    counts.set(key, entry);
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((e) => e.label);
}
