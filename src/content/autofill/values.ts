import type { FillPlan } from '@/shared/messaging/fill';
import type { AutofillSettings, Education, Experience, Profile, ProfileKey } from '@/shared/types';

const EEO_KEYS: ProfileKey[] = ['gender', 'pronouns', 'ethnicity', 'race', 'veteranStatus', 'disabilityStatus', 'sexualOrientation'];

export function isEeoKey(key: ProfileKey): boolean {
  return EEO_KEYS.includes(key);
}

/** YYYY-MM / YYYY / free text → month index (year * 12 + month), or null. */
export function monthIndex(value: string): number | null {
  const text = (value ?? '').trim();
  let match = /^(\d{4})-(\d{1,2})/.exec(text);
  if (match) return Number(match[1]) * 12 + Math.min(11, Math.max(0, Number(match[2]) - 1));
  match = /^(\d{4})$/.exec(text);
  if (match) return Number(match[1]) * 12;
  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) {
    const date = new Date(parsed);
    return date.getFullYear() * 12 + date.getMonth();
  }
  match = /(19|20)\d{2}/.exec(text);
  return match ? Number(match[0]) * 12 : null;
}

function nowIndex(): number {
  const now = new Date();
  return now.getFullYear() * 12 + now.getMonth();
}

/** Whole years of experience from date ranges, with overlapping ranges merged. */
export function yearsOfExperience(experience: Experience[]): number {
  const ranges: [number, number][] = [];
  for (const item of experience ?? []) {
    const start = monthIndex(item.startDate);
    if (start === null) continue;
    const end = item.current || !item.endDate ? nowIndex() : monthIndex(item.endDate) ?? nowIndex();
    // A year-only end date covers that whole year.
    const endInclusive = /^\d{4}$/.test((item.endDate ?? '').trim()) && !item.current ? end + 11 : end;
    if (endInclusive >= start) ranges.push([start, endInclusive + 1]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  let total = 0;
  let current: [number, number] | null = null;
  for (const range of ranges) {
    if (!current) current = [...range];
    else if (range[0] <= current[1]) current[1] = Math.max(current[1], range[1]);
    else {
      total += current[1] - current[0];
      current = [...range];
    }
  }
  if (current) total += current[1] - current[0];
  return Math.floor(total / 12);
}

/** Most recent role: current first, then latest end / start date. */
export function latestExperience(experience: Experience[]): Experience | null {
  const list = [...(experience ?? [])];
  if (!list.length) return null;
  const score = (item: Experience): number =>
    item.current ? 1e9 + (monthIndex(item.startDate) ?? 0) : monthIndex(item.endDate) ?? monthIndex(item.startDate) ?? 0;
  list.sort((a, b) => score(b) - score(a));
  return list[0];
}

export function latestEducation(education: Education[]): Education | null {
  const list = [...(education ?? [])];
  if (!list.length) return null;
  const score = (item: Education): number => monthIndex(item.endDate) ?? monthIndex(item.startDate) ?? 0;
  list.sort((a, b) => score(b) - score(a));
  return list[0];
}

function yesNo(value: '' | 'yes' | 'no'): string {
  return value === 'yes' ? 'Yes' : value === 'no' ? 'No' : '';
}

/** Profile key → the text to put in a field ('' when the profile has no value). */
export function profileValue(key: ProfileKey, profile: Profile, options?: Pick<AutofillSettings, 'fillEeo'>): string {
  try {
    const basics = profile.basics;
    const loc = basics?.location;
    const links = profile.links;
    const eligibility = profile.eligibility;
    switch (key) {
      case 'firstName':
        return basics.firstName ?? '';
      case 'lastName':
        return basics.lastName ?? '';
      case 'fullName':
        return [basics.firstName, basics.lastName].filter(Boolean).join(' ');
      case 'email':
        return basics.email ?? '';
      case 'phone':
        return basics.phone ?? '';
      case 'address':
        return loc?.address ?? '';
      case 'city':
        return loc?.city ?? '';
      case 'region':
        return loc?.region ?? '';
      case 'postalCode':
        return loc?.postalCode ?? '';
      case 'country':
        return loc?.country ?? '';
      case 'location':
        return [loc?.city, loc?.region, loc?.country].filter(Boolean).join(', ');
      case 'headline':
        return basics.headline ?? '';
      case 'summary':
        return profile.summary ?? '';
      case 'linkedin':
        return links?.linkedin ?? '';
      case 'github':
        return links?.github ?? '';
      case 'portfolio':
        return links?.portfolio || links?.website || '';
      case 'website':
        return links?.website || links?.portfolio || '';
      case 'twitter':
        return links?.twitter ?? '';
      case 'currentTitle':
        return latestExperience(profile.experience)?.title ?? '';
      case 'currentCompany':
        return latestExperience(profile.experience)?.company ?? '';
      case 'yearsExperience': {
        if (!profile.experience?.length) return '';
        return String(yearsOfExperience(profile.experience));
      }
      case 'school':
        return latestEducation(profile.education)?.institution ?? '';
      case 'degree':
        return latestEducation(profile.education)?.degree ?? '';
      case 'fieldOfStudy':
        return latestEducation(profile.education)?.field ?? '';
      case 'graduationYear': {
        const end = latestEducation(profile.education)?.endDate ?? '';
        return /(\d{4})/.exec(end)?.[1] ?? '';
      }
      case 'authorizedToWork':
        return eligibility?.authorizedCountries?.trim() ? 'Yes' : '';
      case 'requiresSponsorship':
        return yesNo(eligibility?.requiresSponsorship ?? '');
      case 'willingToRelocate':
        return yesNo(eligibility?.willingToRelocate ?? '');
      case 'noticePeriod':
        return eligibility?.noticePeriod ?? '';
      case 'availableFrom':
        return eligibility?.availableFrom ?? '';
      case 'salaryExpectation':
        return eligibility?.salaryExpectation ?? '';
      case 'gender':
      case 'pronouns':
      case 'ethnicity':
      case 'race':
      case 'veteranStatus':
      case 'disabilityStatus':
      case 'sexualOrientation':
        if (!options?.fillEeo || !profile.eeo?.enabled) return '';
        return profile.eeo[key] ?? '';
      default:
        return '';
    }
  } catch {
    return '';
  }
}

/** Like profileValue, plus plan-level values (cover letter text). Files are handled separately. */
export function planValue(key: ProfileKey, plan: FillPlan): string {
  if (key === 'coverLetterText') return plan.coverLetterText ?? '';
  if (key === 'resumeFile' || key === 'coverLetterFile') return '';
  return profileValue(key, plan.profile, plan.options);
}
