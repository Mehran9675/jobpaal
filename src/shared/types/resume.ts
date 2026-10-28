/** The structured, editable content of a tailored resume. Rendered into files locally. */
export interface ResumeContact {
  email: string;
  phone: string;
  location: string;
  links: { label: string; url: string }[];
}

export interface ResumeExperienceEntry {
  /** Id of the source profile experience. Facts come from there. */
  sourceId: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  bullets: string[];
}

export interface ResumeEducationEntry {
  sourceId: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  grade: string;
  description: string;
}

export interface ResumeCertificationEntry {
  sourceId: string;
  name: string;
  issuer: string;
  date: string;
}

export interface ResumeLanguageEntry {
  sourceId: string;
  language: string;
  fluency: string;
}

export interface ResumeProjectEntry {
  sourceId: string;
  name: string;
  role: string;
  url: string;
  description: string;
  bullets: string[];
}

export interface ResumeAwardEntry {
  sourceId: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export type ResumeSectionKey =
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'certifications'
  | 'languages'
  | 'projects'
  | 'awards';

export const ALL_RESUME_SECTIONS: ResumeSectionKey[] = [
  'summary',
  'skills',
  'experience',
  'projects',
  'education',
  'certifications',
  'languages',
  'awards',
];

export interface ResumeContent {
  name: string;
  firstName: string;
  lastName: string;
  headline: string;
  contact: ResumeContact;
  photo: string;
  summary: string;
  skills: { name: string; skills: string[] }[];
  experience: ResumeExperienceEntry[];
  education: ResumeEducationEntry[];
  certifications: ResumeCertificationEntry[];
  languages: ResumeLanguageEntry[];
  projects: ResumeProjectEntry[];
  awards: ResumeAwardEntry[];
  /** Order suggested by tailoring; design settings may override. */
  sectionOrder: ResumeSectionKey[];
}

export interface CoverLetterContent {
  /** Plain text body, paragraphs separated by blank lines. */
  text: string;
  recipient: string;
  company: string;
  role: string;
}

export interface ScreeningAnswer {
  id: string;
  question: string;
  answer: string;
  /** Field on the page this answers, when it came from detection. */
  fieldId?: string;
  frameId?: number;
  source: 'generated' | 'manual' | 'saved';
  edited: boolean;
}

/** Generated content and its user-edited version (null when not edited). */
export interface Editable<T> {
  generated: T;
  edited: T | null;
}
