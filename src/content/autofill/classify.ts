import type { ProfileKey } from '@/shared/types';
import { humanize } from './labels';

export interface ClassifyInput {
  /** Lower-cased input type ('text', 'email', 'file', 'textarea', 'select', 'radio', 'checkbox', 'contenteditable'). */
  type: string;
  label: string;
  name?: string;
  id?: string;
  autocomplete?: string;
  /** Extra hint text (accept attribute, nearby words) used for file inputs. */
  hint?: string;
}

const AUTOCOMPLETE: Record<string, ProfileKey> = {
  'given-name': 'firstName',
  'family-name': 'lastName',
  name: 'fullName',
  email: 'email',
  tel: 'phone',
  'tel-national': 'phone',
  'street-address': 'address',
  'address-line1': 'address',
  'address-level2': 'city',
  'address-level1': 'region',
  'postal-code': 'postalCode',
  country: 'country',
  'country-name': 'country',
  organization: 'currentCompany',
  'organization-title': 'currentTitle',
  url: 'website',
  sex: 'gender',
};

interface Rule {
  key: ProfileKey;
  re: RegExp;
  /** Also applies to long, question-like labels. */
  long?: boolean;
  /** Only for these field types. */
  types?: string[];
  /** Never for these field types. */
  notTypes?: string[];
}

const TEXT_TYPES = ['text', 'textarea', 'contenteditable', 'email', 'tel', 'url', 'number', 'combobox', 'search'];

/** Ordered: more specific first. Labels are lower-cased before matching. */
const RULES: Rule[] = [
  { key: 'coverLetterFile', re: /cover\s*letter|motivation(al)?\s*letter|letter of motivation/, types: ['file'], long: true },
  { key: 'coverLetterText', re: /cover\s*letter|motivation(al)?\s*letter|letter of motivation/, notTypes: ['file', 'select', 'radio', 'checkbox'], long: true },
  { key: 'resumeFile', re: /r[eé]sum[eé]|\bcv\b|curriculum/, types: ['file'], long: true },
  { key: 'linkedin', re: /linked\s*-?in/, notTypes: ['file', 'radio', 'checkbox'], long: true },
  { key: 'github', re: /git\s*hub/, notTypes: ['file', 'radio', 'checkbox'], long: true },
  { key: 'twitter', re: /twitter|\bx\.com\b|x \(twitter\)/, notTypes: ['file', 'radio', 'checkbox'] },
  { key: 'portfolio', re: /portfolio|dribbble|behance/, notTypes: ['file', 'radio', 'checkbox'], long: true },
  { key: 'website', re: /website|personal (site|url|page)|\bblog\b|homepage|^url$|web site/, notTypes: ['file', 'radio', 'checkbox'] },
  { key: 'email', re: /e-?mail/, notTypes: ['file', 'radio', 'checkbox', 'select'] },
  { key: 'phone', re: /phone|mobile|\bcell\b|telephone|^tel$/, notTypes: ['file', 'radio', 'checkbox'] },
  // EEO
  { key: 'sexualOrientation', re: /sexual orientation/, long: true },
  { key: 'pronouns', re: /pronoun/, long: true },
  { key: 'gender', re: /\bgender\b|^sex$|\bsex\b/, long: true },
  { key: 'race', re: /\brace\b/, long: true },
  { key: 'ethnicity', re: /ethnic|hispanic|latin[oax]/, long: true },
  { key: 'veteranStatus', re: /veteran|military service|armed forces/, long: true },
  { key: 'disabilityStatus', re: /disabilit/, long: true },
  // Names (after links so "LinkedIn profile name" etc. do not land here)
  { key: 'firstName', re: /first\s*name|given\s*name|forename|preferred (first )?name|^first$/, types: TEXT_TYPES },
  { key: 'lastName', re: /last\s*name|family\s*name|surname|^last$/, types: TEXT_TYPES },
  { key: 'fullName', re: /^(your\s+)?(full\s+|legal\s+|full\s+legal\s+)?name$|full\s*(legal\s*)?name|legal name|candidate name|applicant name/, types: TEXT_TYPES },
  // Eligibility
  { key: 'requiresSponsorship', re: /(require|need|requiring).{0,40}(sponsor|visa)|sponsorship (required|needed)|visa sponsorship/, long: true },
  { key: 'authorizedToWork', re: /authori[sz]ed to work|eligible to work|right to work|legally (authori[sz]ed|able|permitted|eligible)|work (permit|authori[sz]ation)|entitled to work/, long: true },
  { key: 'requiresSponsorship', re: /sponsor/, long: true },
  { key: 'willingToRelocate', re: /relocat/, long: true },
  { key: 'noticePeriod', re: /notice period|period of notice|weeks? notice|notice required/, long: true },
  { key: 'availableFrom', re: /start date|earliest (possible )?start|available (to start|from|start date)|availability date|when (can|could) you start|date available/, long: true },
  { key: 'salaryExpectation', re: /salary|compensation|pay expectation|expected pay|desired pay|desired (salary|compensation)|rate expectation/, long: true, notTypes: ['file', 'checkbox'] },
  { key: 'yearsExperience', re: /^(total |overall )?(years of (professional |relevant |work |industry )?experience|experience \(years\)|years experience)$|^how many years of (professional |work |relevant )?experience do you have\??$/ },
  // Current role
  { key: 'currentTitle', re: /current (job )?title|current (position|role)|^job title$|^title$|most recent (job )?title|current designation/, types: TEXT_TYPES },
  { key: 'currentCompany', re: /current (company|employer|organi[sz]ation)|^company$|^employer$|most recent (employer|company)|company name|current workplace/, types: TEXT_TYPES },
  // Education
  { key: 'school', re: /school|university|college|institution/, notTypes: ['file', 'radio', 'checkbox'] },
  { key: 'fieldOfStudy', re: /field of study|\bmajor\b|discipline|area of study|course of study/, notTypes: ['file', 'radio', 'checkbox'] },
  { key: 'graduationYear', re: /graduat/, notTypes: ['file', 'radio', 'checkbox'] },
  { key: 'degree', re: /\bdegree\b|education level|level of education|highest (level of )?education/, notTypes: ['file', 'radio', 'checkbox'] },
  // Location
  { key: 'location', re: /^(current )?location$|where are you (currently )?(based|located)|city.{0,5}(state|country)|current (city|location)|based in|^location \(city\)$/, notTypes: ['file', 'radio', 'checkbox'] },
  { key: 'postalCode', re: /zip|postal|post code|postcode/, types: TEXT_TYPES },
  { key: 'address', re: /^(street )?address( line)?( 1)?$|street|address line 1|home address|mailing address|^address$/, types: TEXT_TYPES },
  { key: 'city', re: /\bcity\b|\btown\b/, notTypes: ['file', 'radio', 'checkbox'] },
  { key: 'region', re: /^(state|province|region|county|state ?\/ ?province)$|state or province/, notTypes: ['file', 'radio', 'checkbox'] },
  { key: 'country', re: /^country$|country of residence|country \/ region|^country\b(?! code)/, notTypes: ['file', 'radio', 'checkbox'] },
  { key: 'headline', re: /^(professional )?headline$/, types: TEXT_TYPES },
  { key: 'summary', re: /^(professional )?summary$|^about (me|yourself)$|^profile summary$/, types: ['textarea', 'contenteditable'] },
];

/** Labels that are not profile values even when they contain a matching word. */
const NEVER = /phone (type|device)|country (phone )?code|address line 2|\bapt\b|\bsuite\b|\breferences?\b|referr|emergency|manager'?s? (name|email|phone)|recruiter|hiring manager|how did you hear/;

function isLong(label: string): boolean {
  return label.length > 60 || label.split(/\s+/).length > 9;
}

function testRules(text: string, type: string, long: boolean): ProfileKey | null {
  if (!text || NEVER.test(text)) return null;
  for (const rule of RULES) {
    if (rule.types && !rule.types.includes(type)) continue;
    if (rule.notTypes && rule.notTypes.includes(type)) continue;
    if (long && !rule.long) continue;
    if (rule.re.test(text)) return rule.key;
  }
  return null;
}

/** Maps a form field to a profile value it should hold, or null (screening question / unknown). */
export function classifyField(input: ClassifyInput): ProfileKey | null {
  try {
    const type = (input.type || 'text').toLowerCase();
    const label = (input.label ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

    const tokens = (input.autocomplete ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    for (const token of tokens.reverse()) {
      const key = AUTOCOMPLETE[token];
      if (key && !(label && NEVER.test(label))) return key;
    }

    if (type === 'file') {
      const text = `${label} ${humanize(input.name ?? '')} ${humanize(input.id ?? '')} ${(input.hint ?? '').toLowerCase()}`;
      if (/cover\s*letter|motivation/.test(text)) return 'coverLetterFile';
      if (/r[eé]sum[eé]|\bcv\b|curriculum/.test(text)) return 'resumeFile';
      return null;
    }

    const fromLabel = testRules(label, type, isLong(label));
    if (fromLabel) return fromLabel;

    if (!label || label.length < 40) {
      for (const raw of [input.name, input.id]) {
        const text = humanize(raw ?? '');
        if (!text || text.length > 40) continue;
        const key = testRules(text, type, false);
        if (key) return key;
      }
    }

    if (type === 'email') return label && NEVER.test(label) ? null : 'email';
    if (type === 'tel') return label && NEVER.test(label) ? null : 'phone';
    if (type === 'url' && !label) return 'website';
    return null;
  } catch {
    return null;
  }
}
