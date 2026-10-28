import type { Award, Certification, Education, Experience, LanguageSkill, Project, ProfileLink, SkillGroup } from '@/shared/types';
import { createId } from '@/shared/utils/id';

/** Coerces unknown values (from imports or AI output) to clean strings / string arrays. */
export function str(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

export function strList(value: unknown): string[] {
  if (!Array.isArray(value)) return typeof value === 'string' && value.trim() ? [value.trim()] : [];
  return value.map(str).filter(Boolean);
}

function withId<T extends { id: string }>(prefix: string, entry: T): T {
  return entry.id ? entry : { ...entry, id: createId(prefix) };
}

type Loose<T> = { [K in keyof T]?: unknown };

export function toExperience(e: Loose<Experience>): Experience {
  return withId('exp', {
    id: str(e.id),
    company: str(e.company),
    title: str(e.title),
    location: str(e.location),
    startDate: str(e.startDate),
    endDate: str(e.endDate),
    current: Boolean(e.current),
    description: str(e.description),
    highlights: strList(e.highlights),
    skills: strList(e.skills),
  });
}

export function toEducation(e: Loose<Education>): Education {
  return withId('edu', {
    id: str(e.id),
    institution: str(e.institution),
    degree: str(e.degree),
    field: str(e.field),
    location: str(e.location),
    startDate: str(e.startDate),
    endDate: str(e.endDate),
    grade: str(e.grade),
    description: str(e.description),
  });
}

export function toCertification(c: Loose<Certification>): Certification {
  return withId('cert', {
    id: str(c.id),
    name: str(c.name),
    issuer: str(c.issuer),
    date: str(c.date),
    expires: str(c.expires),
    credentialId: str(c.credentialId),
    url: str(c.url),
  });
}

export function toLanguage(l: Loose<LanguageSkill>): LanguageSkill {
  return withId('lang', { id: str(l.id), language: str(l.language), fluency: str(l.fluency) });
}

export function toProject(p: Loose<Project>): Project {
  return withId('proj', {
    id: str(p.id),
    name: str(p.name),
    role: str(p.role),
    url: str(p.url),
    startDate: str(p.startDate),
    endDate: str(p.endDate),
    description: str(p.description),
    highlights: strList(p.highlights),
    skills: strList(p.skills),
  });
}

export function toAward(a: Loose<Award>): Award {
  return withId('award', {
    id: str(a.id),
    title: str(a.title),
    issuer: str(a.issuer),
    date: str(a.date),
    description: str(a.description),
  });
}

export function toSkillGroup(g: Loose<SkillGroup>): SkillGroup {
  return withId('skills', { id: str(g.id), name: str(g.name), skills: strList(g.skills) });
}

export function toLink(l: Loose<ProfileLink>): ProfileLink {
  return withId('link', { id: str(l.id), label: str(l.label), url: str(l.url) });
}
