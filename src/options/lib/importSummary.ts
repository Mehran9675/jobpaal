import type { Profile } from '@/shared/types';

export interface ImportSummaryLine {
  label: string;
  value: string;
}

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Human-readable list of what an import (resume parse, JSON Resume, LinkedIn scan) found. */
export function summarizeImport(data: Partial<Profile>): ImportSummaryLine[] {
  const lines: ImportSummaryLine[] = [];
  const basics = data.basics;
  if (basics) {
    const name = [basics.firstName, basics.lastName].filter(Boolean).join(' ');
    if (name) lines.push({ label: 'Name', value: name });
    if (basics.headline) lines.push({ label: 'Headline', value: basics.headline });
    if (basics.email) lines.push({ label: 'Email', value: basics.email });
    if (basics.phone) lines.push({ label: 'Phone', value: basics.phone });
    const loc = basics.location;
    const place = loc ? [loc.city, loc.region, loc.country].filter(Boolean).join(', ') : '';
    if (place) lines.push({ label: 'Location', value: place });
  }
  if (data.links) {
    const { other = [], ...main } = data.links;
    const filled = Object.values(main).filter((v) => typeof v === 'string' && v.trim()).length + other.length;
    if (filled) lines.push({ label: 'Links', value: count(filled, 'link') });
  }
  if (data.summary?.trim()) lines.push({ label: 'Summary', value: `${data.summary.trim().slice(0, 120)}${data.summary.length > 120 ? '…' : ''}` });
  if (data.skills?.length) {
    const skills = data.skills.reduce((sum, g) => sum + (g.skills?.length ?? 0), 0);
    lines.push({ label: 'Skills', value: `${count(skills, 'skill')} in ${count(data.skills.length, 'group')}` });
  }
  if (data.experience?.length) {
    const roles = data.experience
      .slice(0, 3)
      .map((e) => [e.title, e.company].filter(Boolean).join(' at '))
      .filter(Boolean)
      .join('; ');
    lines.push({
      label: 'Experience',
      value: `${count(data.experience.length, 'role')}${roles ? ` — ${roles}${data.experience.length > 3 ? '; …' : ''}` : ''}`,
    });
  }
  if (data.education?.length) lines.push({ label: 'Education', value: count(data.education.length, 'entry', 'entries') });
  if (data.certifications?.length) lines.push({ label: 'Certifications', value: count(data.certifications.length, 'certification') });
  if (data.languages?.length) lines.push({ label: 'Languages', value: data.languages.map((l) => l.language).filter(Boolean).join(', ') });
  if (data.projects?.length) lines.push({ label: 'Projects', value: count(data.projects.length, 'project') });
  if (data.awards?.length) lines.push({ label: 'Awards', value: count(data.awards.length, 'award') });
  return lines;
}

export type ImportFileKind = 'json' | 'text' | 'unsupported';

export function importFileKind(fileName: string): ImportFileKind {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'json') return 'json';
  if (['pdf', 'docx', 'txt', 'md', 'markdown', 'text'].includes(ext)) return 'text';
  return 'unsupported';
}

/** True when a parsed JSON object looks like a JSON Resume document. */
export function looksLikeJsonResume(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  return ['basics', 'work', 'education', 'skills'].some((key) => key in obj);
}
