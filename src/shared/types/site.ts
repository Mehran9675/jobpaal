import type { JobField } from './job';

/** Locates an element again on a later visit. */
export interface ElementLocator {
  selector: string;
  /** Fallback XPath-like path built from tag names and indexes. */
  path: string;
  /** Text sample used to verify the match and to find by text. */
  textSample: string;
  /** URL of the frame the element lives in ('' = top). */
  frameUrl: string;
}

/** Profile values a form field can be mapped to. */
export type ProfileKey =
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'email'
  | 'phone'
  | 'address'
  | 'city'
  | 'region'
  | 'postalCode'
  | 'country'
  | 'location'
  | 'headline'
  | 'summary'
  | 'linkedin'
  | 'github'
  | 'portfolio'
  | 'website'
  | 'twitter'
  | 'currentTitle'
  | 'currentCompany'
  | 'yearsExperience'
  | 'school'
  | 'degree'
  | 'fieldOfStudy'
  | 'graduationYear'
  | 'authorizedToWork'
  | 'requiresSponsorship'
  | 'willingToRelocate'
  | 'noticePeriod'
  | 'availableFrom'
  | 'salaryExpectation'
  | 'gender'
  | 'pronouns'
  | 'ethnicity'
  | 'race'
  | 'veteranStatus'
  | 'disabilityStatus'
  | 'sexualOrientation'
  | 'coverLetterText'
  | 'resumeFile'
  | 'coverLetterFile';

export interface FieldMapping {
  locator: ElementLocator;
  /** Either a profile key, or a saved answer id. */
  target: { type: 'profile'; key: ProfileKey } | { type: 'answer'; answerId: string };
  label: string;
}

export interface SiteMapping {
  host: string;
  jobFields: Partial<Record<JobField, ElementLocator>>;
  formFields: FieldMapping[];
  updatedAt: number;
}

/** A question/answer pair the user saved for reuse on future forms. */
export interface SavedAnswer {
  id: string;
  question: string;
  answer: string;
  createdAt: number;
  usedCount: number;
}
