import type { OnlinePresence, Profile, ProfileBasics, SkillGroup } from '@/shared/types';
import { str, strList, toAward, toCertification, toEducation, toExperience, toLanguage, toLink, toProject, toSkillGroup } from './entries';

type Obj = Record<string, unknown>;

const NOT_JSON_RESUME =
  'This file is not a JSON Resume. Expected an object with sections such as "basics", "work" or "education" (see jsonresume.org).';

const SECTION_KEYS = ['basics', 'work', 'education', 'skills', 'projects', 'volunteer', 'awards', 'certificates', 'languages', 'publications'];

function isObj(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function objList(value: unknown): Obj[] {
  return Array.isArray(value) ? value.filter(isObj) : [];
}

/** JSON Resume dates are ISO (YYYY-MM-DD, YYYY-MM or YYYY); profiles use YYYY-MM or YYYY. */
export function toYearMonth(value: unknown): string {
  const text = str(value);
  const match = /^(\d{4})(?:-(\d{1,2}))?/.exec(text);
  if (!match) return text;
  return match[2] ? `${match[1]}-${match[2].padStart(2, '0')}` : match[1];
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { firstName: parts[0] ?? '', lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

const KNOWN_PROFILES: { key: 'linkedin' | 'github' | 'twitter'; network: RegExp; url: RegExp; base: string }[] = [
  { key: 'linkedin', network: /linked\s*in/i, url: /linkedin\.com/i, base: 'https://www.linkedin.com/in/' },
  { key: 'github', network: /github/i, url: /github\.com/i, base: 'https://github.com/' },
  { key: 'twitter', network: /^(twitter|x)$/i, url: /(twitter\.com|\/\/(www\.)?x\.com)/i, base: 'https://x.com/' },
];

function hostLabel(url: string): string {
  try {
    return new URL(/^[a-z]+:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function linksFrom(basics: Obj): OnlinePresence {
  const links: OnlinePresence = { linkedin: '', github: '', portfolio: '', website: str(basics.url ?? basics.website), twitter: '', other: [] };
  for (const profile of objList(basics.profiles)) {
    const network = str(profile.network);
    const username = str(profile.username).replace(/^@/, '');
    let url = str(profile.url);
    const known = KNOWN_PROFILES.find((k) => k.network.test(network) || (url && k.url.test(url)));
    if (known) {
      if (!url && username) url = known.base + username;
      if (url && !links[known.key]) links[known.key] = url;
      continue;
    }
    if (url) links.other.push(toLink({ label: network || hostLabel(url), url }));
  }
  return links;
}

function basicsFrom(basics: Obj): ProfileBasics {
  const location = isObj(basics.location) ? basics.location : {};
  const name = str(basics.name);
  return {
    ...splitName(name),
    headline: str(basics.label),
    email: str(basics.email),
    phone: str(basics.phone),
    location: {
      address: str(location.address),
      city: str(location.city),
      region: str(location.region),
      postalCode: str(location.postalCode),
      country: str(location.countryCode ?? location.country),
    },
    photo: /^data:image\//i.test(str(basics.image ?? basics.picture)) ? str(basics.image ?? basics.picture) : '',
  };
}

/** Skill entries with keywords become groups; bare skill names are collected into one "Skills" group. */
function skillsFrom(value: unknown): SkillGroup[] {
  const groups: SkillGroup[] = [];
  const loose: string[] = [];
  for (const skill of objList(value)) {
    const name = str(skill.name);
    const keywords = strList(skill.keywords);
    if (keywords.length) groups.push(toSkillGroup({ name: name || 'Skills', skills: keywords }));
    else if (name) loose.push(name);
  }
  if (loose.length) groups.push(toSkillGroup({ name: 'Skills', skills: loose }));
  return groups;
}

/** Converts a JSON Resume (jsonresume.org schema) object into profile data. */
export function jsonResumeToProfile(json: unknown): Partial<Profile> {
  let data = json;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      throw new Error(NOT_JSON_RESUME);
    }
  }
  if (!isObj(data) || !SECTION_KEYS.some((key) => key in data)) throw new Error(NOT_JSON_RESUME);
  const basics = isObj(data.basics) ? data.basics : {};

  return {
    basics: basicsFrom(basics),
    links: linksFrom(basics),
    summary: str(basics.summary),
    experience: objList(data.work)
      .map((w) => {
        const startDate = toYearMonth(w.startDate);
        const endDate = toYearMonth(w.endDate);
        return toExperience({
          company: str(w.name ?? w.company),
          title: str(w.position),
          location: str(w.location),
          startDate,
          endDate,
          current: Boolean(startDate) && !endDate,
          description: str(w.summary ?? w.description),
          highlights: strList(w.highlights),
          skills: strList(w.keywords),
        });
      })
      .filter((e) => e.company || e.title),
    education: objList(data.education)
      .map((e) =>
        toEducation({
          institution: str(e.institution),
          degree: str(e.studyType),
          field: str(e.area),
          location: str(e.location),
          startDate: toYearMonth(e.startDate),
          endDate: toYearMonth(e.endDate),
          grade: str(e.score ?? e.gpa),
          description: strList(e.courses).length ? `Courses: ${strList(e.courses).join(', ')}` : str(e.summary),
        }),
      )
      .filter((e) => e.institution || e.degree),
    skills: skillsFrom(data.skills),
    languages: objList(data.languages)
      .map((l) => toLanguage({ language: str(l.language), fluency: str(l.fluency) }))
      .filter((l) => l.language),
    projects: objList(data.projects)
      .map((p) =>
        toProject({
          name: str(p.name),
          role: strList(p.roles).join(', '),
          url: str(p.url),
          startDate: toYearMonth(p.startDate),
          endDate: toYearMonth(p.endDate),
          description: str(p.description ?? p.summary),
          highlights: strList(p.highlights),
          skills: strList(p.keywords),
        }),
      )
      .filter((p) => p.name),
    awards: objList(data.awards)
      .map((a) => toAward({ title: str(a.title), issuer: str(a.awarder), date: toYearMonth(a.date), description: str(a.summary) }))
      .filter((a) => a.title),
    certifications: objList(data.certificates)
      .map((c) => toCertification({ name: str(c.name), issuer: str(c.issuer), date: toYearMonth(c.date), url: str(c.url) }))
      .filter((c) => c.name),
  };
}
