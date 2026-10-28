import { normalizeProfile } from '@/shared/defaults/profile';
import type { Profile } from '@/shared/types';
import { normalizeForCompare, uniqueStrings } from '@/shared/utils/text';
import { toAward, toCertification, toEducation, toExperience, toLanguage, toLink, toProject, toSkillGroup } from './entries';

type Scalars = Record<string, unknown>;

const isEmpty = (value: unknown) => value === undefined || value === null || (typeof value === 'string' && !value.trim());

/**
 * Copies scalar (string/boolean/number) fields: an incoming non-empty value replaces an empty
 * base value, or any base value when `overwrite`. Empty incoming values never clear data.
 */
function mergeScalars<T extends object>(base: T, incoming: Partial<T> | undefined, overwrite: boolean): T {
  if (!incoming) return { ...base };
  const out = { ...base } as Scalars;
  for (const [key, value] of Object.entries(incoming as Scalars)) {
    if (!(key in out) || isEmpty(value)) continue;
    const current = out[key];
    if (typeof value !== 'string' && typeof value !== 'boolean' && typeof value !== 'number') continue;
    if (typeof current !== typeof value) continue;
    if (overwrite || isEmpty(current) || (typeof value === 'boolean' && current === false)) out[key] = value;
  }
  return out as T;
}

const key = (...parts: string[]) => parts.map((p) => normalizeForCompare(p ?? '')).join('|');

/**
 * Appends incoming entries that are not duplicates (by `keyOf`). Duplicates are merged into the
 * existing entry: scalar fields as in mergeScalars, string lists unioned.
 */
function mergeList<T extends { id: string }>(
  base: T[],
  incoming: T[] | undefined,
  normalize: (entry: T) => T,
  keyOf: (entry: T) => string,
  overwrite: boolean,
): T[] {
  const out = base.map(normalize);
  for (const raw of incoming ?? []) {
    const entry = normalize(raw);
    const k = keyOf(entry);
    const index = k.replace(/\|/g, '').trim() ? out.findIndex((e) => keyOf(e) === k) : -1;
    if (index < 0) {
      out.push(out.some((e) => e.id === entry.id) ? normalize({ ...entry, id: '' }) : entry);
      continue;
    }
    const existing = out[index];
    const merged = mergeScalars(existing, { ...entry, id: existing.id }, overwrite) as T & Scalars;
    for (const [field, value] of Object.entries(entry)) {
      const current = (existing as Scalars)[field];
      if (Array.isArray(value) && Array.isArray(current)) merged[field as keyof T] = uniqueStrings([...current, ...value]) as T[keyof T];
    }
    out[index] = merged;
  }
  return out;
}

/** Merges imported data into a profile, generating ids for new entries. */
export function mergeProfile(base: Profile, incoming: Partial<Profile>, overwrite: boolean): Profile {
  const b = normalizeProfile(base);
  const inc = incoming ?? {};

  const skills = b.skills.map(toSkillGroup);
  for (const raw of inc.skills ?? []) {
    const group = toSkillGroup(raw);
    if (!group.skills.length) continue;
    const existing = skills.find((g) => normalizeForCompare(g.name) === normalizeForCompare(group.name));
    if (existing) existing.skills = uniqueStrings([...existing.skills, ...group.skills]);
    else skills.push(skills.some((g) => g.id === group.id) ? toSkillGroup({ ...group, id: '' }) : group);
  }

  const summary = !isEmpty(inc.summary) && (overwrite || isEmpty(b.summary)) ? (inc.summary as string).trim() : b.summary;

  return {
    ...b,
    basics: {
      ...mergeScalars(b.basics, inc.basics, overwrite),
      location: mergeScalars(b.basics.location, inc.basics?.location, overwrite),
    },
    links: {
      ...mergeScalars(b.links, inc.links, overwrite),
      other: mergeList(b.links.other, inc.links?.other, toLink, (l) => key(l.url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '')), overwrite),
    },
    summary,
    skills,
    experience: mergeList(b.experience, inc.experience, toExperience, (e) => key(e.company, e.title, e.startDate), overwrite),
    education: mergeList(b.education, inc.education, toEducation, (e) => key(e.institution, e.degree), overwrite),
    certifications: mergeList(b.certifications, inc.certifications, toCertification, (c) => key(c.name, c.issuer), overwrite),
    languages: mergeList(b.languages, inc.languages, toLanguage, (l) => key(l.language), overwrite),
    projects: mergeList(b.projects, inc.projects, toProject, (p) => key(p.name), overwrite),
    awards: mergeList(b.awards, inc.awards, toAward, (a) => key(a.title, a.issuer), overwrite),
    eligibility: mergeScalars(b.eligibility, inc.eligibility, overwrite),
    eeo: mergeScalars(b.eeo, inc.eeo, overwrite),
    updatedAt: Date.now(),
  };
}
