import type { Certification, Education, Experience, LanguageSkill, Profile } from '@/shared/types';
import { createId } from '@/shared/utils/id';
import { cleanInline } from '@/content/picker/dom';
import { elementText } from '@/content/picker/elementText';
import {
  isDateLine,
  isDurationLine,
  isEmploymentType,
  isLocationLine,
  parseDateRange,
  parseLinkedInDate,
  splitLocation,
  stripMeta,
} from './parse';

const MAX_ITEMS = 40;

export function isLinkedInProfilePage(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /(^|\.)linkedin\.com$/i.test(parsed.hostname) && /^\/in\/[^/]+/.test(parsed.pathname);
  } catch {
    return false;
  }
}

function text(doc: Document | Element, selectors: string[], max = 300): string {
  for (const selector of selectors) {
    try {
      const el = doc.querySelector(selector);
      const value = cleanInline(el?.textContent, max);
      if (value) return value;
    } catch {
      /* ignore */
    }
  }
  return '';
}

/** Section of the profile holding the anchor `div#<id>` (logged-in) or `section[data-section]` (public). */
function sectionFor(doc: Document, id: string, publicSelector: string): Element | null {
  try {
    const anchor = doc.getElementById(id);
    const section = anchor?.closest('section');
    if (section) return section;
    return doc.querySelector(publicSelector);
  } catch {
    return null;
  }
}

/** Visible text lines of an element: LinkedIn's aria-hidden spans, else block text lines. */
function linesOf(el: Element, exclude: Element[] = []): string[] {
  const spans = Array.from(el.querySelectorAll('span[aria-hidden="true"]')).filter(
    (span) =>
      !span.parentElement?.closest('span[aria-hidden="true"]') && !exclude.some((ex) => ex !== el && ex.contains(span)),
  );
  let lines: string[];
  if (spans.length) lines = spans.map((span) => elementText(span)).flatMap((t) => t.split('\n'));
  else lines = elementText(el).split('\n');
  const out: string[] = [];
  for (const raw of lines) {
    const line = cleanInline(raw.replace(/^•\s*/, ''), 2000);
    if (!line || /^(…|\.\.\.)?\s*see more$|^show (all|more)|^…more$/i.test(line)) continue;
    if (out[out.length - 1] === line) continue;
    out.push(line);
  }
  return out;
}

/** Top-level list items of a section (not nested sub-items). */
function topItems(section: Element): Element[] {
  const all = Array.from(section.querySelectorAll('li'));
  return all
    .filter((li) => {
      const parent = li.parentElement?.closest('li');
      return !parent || !section.contains(parent);
    })
    .slice(0, MAX_ITEMS);
}

function linesWithoutHeading(lines: string[], heading: RegExp): string[] {
  return lines[0] && heading.test(lines[0]) ? lines.slice(1) : lines;
}

function describe(lines: string[]): { description: string; skills: string[] } {
  const skills: string[] = [];
  const rest: string[] = [];
  for (const line of lines) {
    const skillMatch = /^skills?:\s*(.+)$/i.exec(line);
    if (skillMatch) skills.push(...skillMatch[1].split(/\s*[·,]\s*/).filter(Boolean));
    else rest.push(line);
  }
  return { description: rest.join('\n').slice(0, 5000), skills };
}

/** Parses [title, (company line), dates, (location), ...description]. */
function parseRole(lines: string[], company: string | null): Experience | null {
  if (!lines.length) return null;
  const dateIndex = lines.findIndex((line, index) => index > 0 && index <= 3 && isDateLine(line));
  if (dateIndex < 0) return null;
  const title = lines[0];
  let companyName = company ?? '';
  if (!company && dateIndex >= 2) companyName = stripMeta(lines[1]).main;
  const range = parseDateRange(lines[dateIndex]);
  let cursor = dateIndex + 1;
  let location = '';
  if (lines[cursor] && isLocationLine(lines[cursor]) && !isDurationLine(lines[cursor])) {
    location = stripMeta(lines[cursor]).main;
    cursor++;
  }
  const { description, skills } = describe(lines.slice(cursor));
  return {
    id: createId('exp'),
    company: companyName,
    title,
    location,
    startDate: range?.start ?? '',
    endDate: range?.end ?? '',
    current: range?.current ?? false,
    description,
    highlights: [],
    skills,
  };
}

function scanExperience(doc: Document): Experience[] {
  const section = sectionFor(doc, 'experience', 'section[data-section="experience"], section.experience');
  if (!section) return [];
  const out: Experience[] = [];

  // Public profile markup.
  const publicItems = section.querySelectorAll('li.experience-item, li.profile-section-card');
  if (publicItems.length && !section.querySelector('span[aria-hidden="true"]')) {
    for (const item of Array.from(publicItems).slice(0, MAX_ITEMS)) {
      const range = parseDateRange(text(item, ['.date-range time:first-child', '.date-range']).replace(/\s+-\s+/, ' - '));
      const dates = Array.from(item.querySelectorAll('.date-range time')).map((t) => cleanInline(t.textContent));
      out.push({
        id: createId('exp'),
        title: text(item, ['.experience-item__title', '.profile-section-card__title', 'h3']),
        company: text(item, ['.experience-item__subtitle', '.profile-section-card__subtitle', 'h4']),
        location: text(item, ['.experience-item__location', '.experience-item__meta-item:last-child']),
        startDate: dates[0] ? parseLinkedInDate(dates[0]) : range?.start ?? '',
        endDate: dates[1] ? parseLinkedInDate(dates[1]) : range?.end ?? '',
        current: dates.length === 1 || (range?.current ?? false),
        description: text(item, ['.show-more-less-text__text--less', '.experience-item__description'], 5000),
        highlights: [],
        skills: [],
      });
    }
    return out.filter((e) => e.title || e.company);
  }

  for (const item of topItems(section)) {
    try {
      const nested = Array.from(item.querySelectorAll('li')).filter((li) => linesOf(li).some((line, i) => i > 0 && i <= 3 && isDateLine(line)));
      const subRoles = nested.filter((li) => !nested.some((other) => other !== li && other.contains(li)));
      const header = linesOf(item, subRoles);
      const headerHasDates = header.slice(0, 4).some((line, i) => i > 0 && isDateLine(line));
      if (subRoles.length && !headerHasDates) {
        const company = stripMeta(header[0] ?? '').main;
        for (const li of subRoles) {
          const lines = linesOf(li).filter((line) => !isEmploymentType(line));
          const role = parseRole(lines, company);
          if (role) out.push(role);
        }
        continue;
      }
      const role = parseRole(linesOf(item), null);
      if (role) out.push(role);
    } catch {
      /* skip unreadable item */
    }
  }
  return out;
}

function scanEducation(doc: Document): Education[] {
  const section = sectionFor(doc, 'education', 'section[data-section="educationsDetails"], section.education');
  if (!section) return [];
  const out: Education[] = [];
  for (const item of topItems(section)) {
    const lines = linesOf(item);
    if (!lines.length || /^education$/i.test(lines[0])) continue;
    const institution = lines[0];
    let degree = '';
    let field = '';
    let range = null as ReturnType<typeof parseDateRange>;
    let grade = '';
    const rest: string[] = [];
    for (const line of lines.slice(1)) {
      if (!range && isDateLine(line)) range = parseDateRange(line);
      else if (!degree && !range && !/^grade/i.test(line)) {
        const [first, ...others] = line.split(/,\s*/);
        degree = first.trim();
        field = others.join(', ').trim();
      } else if (/^grade:?/i.test(line)) grade = line.replace(/^grade:?\s*/i, '');
      else rest.push(line);
    }
    out.push({
      id: createId('edu'),
      institution,
      degree,
      field,
      location: '',
      startDate: range?.start ?? '',
      endDate: range?.end ?? '',
      grade,
      description: describe(rest).description,
    });
  }
  return out;
}

function scanSkills(doc: Document): string[] {
  const section = sectionFor(doc, 'skills', 'section[data-section="skills"], section.skills');
  if (!section) return [];
  const skills: string[] = [];
  for (const item of topItems(section)) {
    const first = linesOf(item)[0];
    if (first && first.length <= 80 && !/endorse/i.test(first) && !skills.includes(first)) skills.push(first);
  }
  return skills.slice(0, 100);
}

function scanCertifications(doc: Document): Certification[] {
  const section = sectionFor(doc, 'licenses_and_certifications', 'section[data-section="certifications"], section.certifications');
  if (!section) return [];
  const out: Certification[] = [];
  for (const item of topItems(section)) {
    const lines = linesOf(item);
    if (!lines.length) continue;
    const issuedLine = lines.find((l) => /^issued/i.test(l)) ?? '';
    const credential = lines.find((l) => /^credential id/i.test(l)) ?? '';
    const issuer = lines[1] && !/^(issued|credential)/i.test(lines[1]) ? lines[1] : '';
    const [issued, expires] = issuedLine.split('·').map((part) => part.trim());
    const link = item.querySelector('a[href*="credential"]')?.getAttribute('href') ?? '';
    out.push({
      id: createId('cert'),
      name: lines[0],
      issuer,
      date: issued ? parseLinkedInDate(issued.replace(/^issued\s*/i, '')) : '',
      expires: expires ? parseLinkedInDate(expires.replace(/^expires\s*/i, '')) : '',
      credentialId: credential.replace(/^credential id\s*/i, ''),
      url: link,
    });
  }
  return out;
}

function scanLanguages(doc: Document): LanguageSkill[] {
  const section = sectionFor(doc, 'languages', 'section[data-section="languages"], section.languages');
  if (!section) return [];
  const out: LanguageSkill[] = [];
  for (const item of topItems(section)) {
    const lines = linesOf(item);
    if (!lines.length) continue;
    out.push({ id: createId('lang'), language: lines[0], fluency: lines[1] ?? '' });
  }
  return out;
}

function scanAbout(doc: Document): string {
  const section = sectionFor(doc, 'about', 'section[data-section="summary"], section.summary');
  if (!section) return '';
  const focused = section.querySelector('.inline-show-more-text, .pv-shared-text-with-see-more, .core-section-container__content');
  const lines = focused ? linesOf(focused) : linesWithoutHeading(linesOf(section), /^about$/i);
  return lines.join('\n').slice(0, 5000);
}

function splitName(full: string): { firstName: string; lastName: string } {
  const name = cleanInline(full.split(',')[0].replace(/\(.*?\)/g, ''));
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/** Reads the open LinkedIn profile page into profile data, or null when it is not readable. */
export function scanLinkedInProfile(doc: Document): Partial<Profile> | null {
  try {
    const name = text(doc, ['main h1.text-heading-xlarge', '.pv-text-details__left-panel h1', '.top-card-layout__title', 'main h1', 'h1'], 120);
    const headline = text(doc, [
      'main .pv-text-details__left-panel .text-body-medium',
      'main .text-body-medium.break-words',
      '.top-card-layout__headline',
    ]);
    const locationText = text(doc, [
      'main .pv-text-details__left-panel .text-body-small.inline',
      'main .text-body-small.inline.t-black--light.break-words',
      '.top-card__subline-item',
      '.top-card-layout__first-subline .not-first-middot span',
    ]);
    const safe = <T,>(fn: () => T, fallback: T): T => {
      try {
        return fn();
      } catch {
        return fallback;
      }
    };
    const experience = safe(() => scanExperience(doc), [] as Experience[]);
    const education = safe(() => scanEducation(doc), [] as Education[]);
    const skills = safe(() => scanSkills(doc), [] as string[]);
    const certifications = safe(() => scanCertifications(doc), [] as Certification[]);
    const languages = safe(() => scanLanguages(doc), [] as LanguageSkill[]);
    const summary = safe(() => scanAbout(doc), '');

    if (!name && !experience.length && !education.length) return null;

    const { firstName, lastName } = splitName(name);
    const loc = splitLocation(locationText);
    const url = (() => {
      try {
        const parsed = new URL(doc.URL);
        return isLinkedInProfilePage(doc.URL) ? `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '') : '';
      } catch {
        return '';
      }
    })();

    const result: Partial<Profile> = {
      basics: {
        firstName,
        lastName,
        headline,
        email: '',
        phone: '',
        location: { address: '', city: loc.city, region: loc.region, postalCode: '', country: loc.country },
        photo: '',
      },
      links: { linkedin: url, github: '', portfolio: '', website: '', twitter: '', other: [] },
    };
    if (summary) result.summary = summary;
    if (experience.length) result.experience = experience;
    if (education.length) result.education = education;
    if (skills.length) result.skills = [{ id: createId('skills'), name: 'Skills', skills }];
    if (certifications.length) result.certifications = certifications;
    if (languages.length) result.languages = languages;
    return result;
  } catch {
    return null;
  }
}
