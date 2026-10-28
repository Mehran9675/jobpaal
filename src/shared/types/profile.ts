export interface Location {
  address: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface ProfileLink {
  id: string;
  label: string;
  url: string;
}

export interface ProfileBasics {
  firstName: string;
  lastName: string;
  /** User-written headline. Tailoring never inflates it. */
  headline: string;
  email: string;
  phone: string;
  location: Location;
  /** Optional photo as a data URL (only shown when the design enables it). */
  photo: string;
}

export interface OnlinePresence {
  linkedin: string;
  github: string;
  portfolio: string;
  website: string;
  twitter: string;
  other: ProfileLink[];
}

export interface SkillGroup {
  id: string;
  name: string;
  skills: string[];
}

export interface Experience {
  id: string;
  company: string;
  title: string;
  location: string;
  /** YYYY-MM or YYYY. */
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  highlights: string[];
  skills: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  grade: string;
  description: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expires: string;
  credentialId: string;
  url: string;
}

export interface LanguageSkill {
  id: string;
  language: string;
  fluency: string;
}

export interface Project {
  id: string;
  name: string;
  role: string;
  url: string;
  startDate: string;
  endDate: string;
  description: string;
  highlights: string[];
  skills: string[];
}

export interface Award {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export interface WorkEligibility {
  authorizedCountries: string;
  requiresSponsorship: '' | 'yes' | 'no';
  willingToRelocate: '' | 'yes' | 'no';
  remotePreference: '' | 'remote' | 'hybrid' | 'onsite' | 'any';
  noticePeriod: string;
  availableFrom: string;
  salaryExpectation: string;
  hasDriversLicense: '' | 'yes' | 'no';
}

export interface EeoAnswers {
  /** When false, EEO fields are never filled. */
  enabled: boolean;
  gender: string;
  pronouns: string;
  ethnicity: string;
  race: string;
  veteranStatus: string;
  disabilityStatus: string;
  sexualOrientation: string;
}

export interface Profile {
  basics: ProfileBasics;
  links: OnlinePresence;
  summary: string;
  skills: SkillGroup[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  languages: LanguageSkill[];
  projects: Project[];
  awards: Award[];
  eligibility: WorkEligibility;
  eeo: EeoAnswers;
  updatedAt: number;
}
