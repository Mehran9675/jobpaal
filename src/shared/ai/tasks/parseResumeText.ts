import type {
  Award,
  Certification,
  Education,
  Experience,
  LanguageSkill,
  OnlinePresence,
  Profile,
  ProfileBasics,
  Project,
  SkillGroup,
} from '@/shared/types';
import { createId } from '@/shared/utils/id';
import { normalizeForCompare, uniqueStrings } from '@/shared/utils/text';
import { asArray, asBoolean, asObject, asString, asStringArray } from '../json';
import { PARSE_RESUME_PROMPT, parseResumeUserMessage } from '../prompts/parseResume';
import { runJsonTask } from './aiJson';

const MAX_INPUT_CHARS = 40_000;
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Normalises a resume date to YYYY-MM or YYYY when possible; "present"-like values become ''. */
export function normalizeDate(value: unknown): string {
  const v = asString(value).trim();
  if (!v || /^(present|current|now|today|ongoing|to date|-)$/i.test(v)) return '';
  let m = /^(\d{4})[-/.](\d{1,2})(?:[-/.]\d{1,2})?$/.exec(v);
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) return `${m[1]}-${m[2].padStart(2, '0')}`;
  m = /^(\d{1,2})[-/.](\d{4})$/.exec(v);
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= 12) return `${m[2]}-${m[1].padStart(2, '0')}`;
  m = /^([A-Za-z]{3,})\.?,?\s+(\d{4})$/.exec(v);
  if (m) {
    const month = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    if (month >= 0) return `${m[2]}-${String(month + 1).padStart(2, '0')}`;
  }
  m = /^(?:(?:spring|summer|fall|autumn|winter)\s+)?(\d{4})$/i.exec(v);
  if (m) return m[1];
  return v;
}

const isPresent = (value: unknown): boolean => /^(present|current|now|today|ongoing|to date)$/i.test(asString(value));

/** Only keeps a value that literally appears in the source text (case/spacing-insensitive). */
function inText(value: string, source: string): string {
  if (!value) return '';
  return normalizeForCompare(source).includes(normalizeForCompare(value)) ? value : '';
}

function digitsIn(value: string, source: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 6 && source.replace(/\D/g, '').includes(digits) ? value : '';
}

function urlInText(value: string, source: string): string {
  const v = value.trim();
  if (!v) return '';
  const core = v.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '').toLowerCase();
  return core && source.toLowerCase().includes(core) ? v : '';
}

export function profileFromParsed(data: Record<string, unknown>, sourceText: string): Partial<Profile> {
  const b = asObject(data.basics);
  const loc = asObject(b.location);
  const basics: ProfileBasics = {
    firstName: inText(asString(b.firstName), sourceText),
    lastName: inText(asString(b.lastName), sourceText),
    headline: inText(asString(b.headline), sourceText),
    email: inText(asString(b.email), sourceText),
    phone: digitsIn(asString(b.phone), sourceText),
    location: {
      address: '',
      city: inText(asString(loc.city), sourceText),
      region: inText(asString(loc.region), sourceText),
      postalCode: '',
      country: inText(asString(loc.country), sourceText),
    },
    photo: '',
  };
  const l = asObject(data.links);
  const links: OnlinePresence = {
    linkedin: urlInText(asString(l.linkedin), sourceText),
    github: urlInText(asString(l.github), sourceText),
    portfolio: urlInText(asString(l.portfolio), sourceText),
    website: urlInText(asString(l.website), sourceText),
    twitter: urlInText(asString(l.twitter), sourceText),
    other: [],
  };
  const keepSkills = (values: unknown): string[] => uniqueStrings(asStringArray(values, 100).filter((s) => inText(s, sourceText)));

  const skills: SkillGroup[] = asArray(data.skills)
    .map((g) => {
      if (typeof g === 'string') return { id: createId('skg'), name: 'Skills', skills: keepSkills([g]) };
      const obj = asObject(g);
      return { id: createId('skg'), name: asString(obj.name) || 'Skills', skills: keepSkills(obj.skills) };
    })
    .filter((g) => g.skills.length);

  const experience: Experience[] = asArray(data.experience)
    .map(asObject)
    .map((e) => ({
      id: createId('exp'),
      company: asString(e.company),
      title: asString(e.title),
      location: asString(e.location),
      startDate: normalizeDate(e.startDate),
      endDate: normalizeDate(e.endDate),
      current: asBoolean(e.current) || isPresent(e.endDate),
      description: asString(e.description),
      highlights: asStringArray(e.highlights, 30),
      skills: keepSkills(e.skills),
    }))
    .filter((e) => inText(e.company, sourceText) || inText(e.title, sourceText));

  const education: Education[] = asArray(data.education)
    .map(asObject)
    .map((e) => ({
      id: createId('edu'),
      institution: asString(e.institution),
      degree: asString(e.degree),
      field: asString(e.field),
      location: asString(e.location),
      startDate: normalizeDate(e.startDate),
      endDate: normalizeDate(e.endDate),
      grade: asString(e.grade),
      description: asString(e.description),
    }))
    .filter((e) => inText(e.institution, sourceText) || inText(e.degree, sourceText));

  const certifications: Certification[] = asArray(data.certifications)
    .map(asObject)
    .map((c) => ({
      id: createId('cert'),
      name: asString(c.name),
      issuer: asString(c.issuer),
      date: normalizeDate(c.date),
      expires: normalizeDate(c.expires),
      credentialId: inText(asString(c.credentialId), sourceText),
      url: urlInText(asString(c.url), sourceText),
    }))
    .filter((c) => inText(c.name, sourceText));

  const languages: LanguageSkill[] = asArray(data.languages)
    .map((x) => (typeof x === 'string' ? { language: x } : asObject(x)))
    .map((x) => ({ id: createId('lang'), language: asString(x.language), fluency: asString(x.fluency) }))
    .filter((x) => inText(x.language, sourceText));

  const projects: Project[] = asArray(data.projects)
    .map(asObject)
    .map((p) => ({
      id: createId('proj'),
      name: asString(p.name),
      role: asString(p.role),
      url: urlInText(asString(p.url), sourceText),
      startDate: normalizeDate(p.startDate),
      endDate: normalizeDate(p.endDate),
      description: asString(p.description),
      highlights: asStringArray(p.highlights, 20),
      skills: keepSkills(p.skills),
    }))
    .filter((p) => inText(p.name, sourceText));

  const awards: Award[] = asArray(data.awards)
    .map(asObject)
    .map((a) => ({
      id: createId('award'),
      title: asString(a.title),
      issuer: asString(a.issuer),
      date: normalizeDate(a.date),
      description: asString(a.description),
    }))
    .filter((a) => inText(a.title, sourceText));

  return {
    basics,
    links,
    summary: asString(data.summary),
    skills,
    experience,
    education,
    certifications,
    languages,
    projects,
    awards,
  };
}

/** Parses resume text into profile data. Only what is in the text; every entry gets an id. */
export async function parseResumeText(text: string): Promise<Partial<Profile>> {
  const source = (text ?? '').replace(/\r\n/g, '\n').trim();
  if (!source) return {};
  const clipped = source.slice(0, MAX_INPUT_CHARS);
  const { data } = await runJsonTask('parse-resume', PARSE_RESUME_PROMPT, parseResumeUserMessage(clipped), { temperature: 0 });
  return profileFromParsed(data, clipped);
}
