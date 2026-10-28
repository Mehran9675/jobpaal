import { sortedExperience } from '@/shared/resume/baseResume';
import type { Experience, Profile, Project } from '@/shared/types';
import { uniqueStrings } from '@/shared/utils/text';

const join = (parts: (string | undefined)[]): string => parts.map((p) => (p ?? '').trim()).filter(Boolean).join('\n');

export function experienceSourceText(e: Experience): string {
  return join([e.title, e.company, e.location, e.startDate, e.endDate, e.description, ...e.highlights, ...e.skills]);
}

export function projectSourceText(p: Project): string {
  return join([p.name, p.role, p.startDate, p.endDate, p.description, ...p.highlights, ...p.skills]);
}

/** Every fact the user reported, as one text. Used as the source of truth for summaries and letters. */
export function profileFactsText(profile: Profile): string {
  return join([
    profile.basics.headline,
    profile.summary,
    ...profile.skills.flatMap((g) => [g.name, ...g.skills]),
    ...profile.experience.map(experienceSourceText),
    ...profile.projects.map(projectSourceText),
    ...profile.education.map((e) => join([e.institution, e.degree, e.field, e.location, e.startDate, e.endDate, e.grade, e.description])),
    ...profile.certifications.map((c) => join([c.name, c.issuer, c.date])),
    ...profile.languages.map((l) => join([l.language, l.fluency])),
    ...profile.awards.map((a) => join([a.title, a.issuer, a.date, a.description])),
  ]);
}

/** The user's real titles (experience titles and their own headline). */
export function realTitles(profile: Profile): string[] {
  return uniqueStrings([...profile.experience.map((e) => e.title), profile.basics.headline].filter(Boolean));
}

/** Most recent real job title (current first), falling back to the user's own headline. */
export function mostRecentTitle(profile: Profile): string {
  return (sortedExperience(profile)[0]?.title || profile.basics.headline || '').trim();
}

/** All skills the profile lists (skill groups first, then experience and project skills). */
export function profileSkills(profile: Profile): string[] {
  return uniqueStrings([
    ...profile.skills.flatMap((g) => g.skills),
    ...profile.experience.flatMap((e) => e.skills),
    ...profile.projects.flatMap((p) => p.skills),
  ]);
}
