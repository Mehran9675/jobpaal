import type { Profile } from '@/shared/types';

export function createEmptyProfile(): Profile {
  return {
    basics: {
      firstName: '',
      lastName: '',
      headline: '',
      email: '',
      phone: '',
      location: { address: '', city: '', region: '', postalCode: '', country: '' },
      photo: '',
    },
    links: { linkedin: '', github: '', portfolio: '', website: '', twitter: '', other: [] },
    summary: '',
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    languages: [],
    projects: [],
    awards: [],
    eligibility: {
      authorizedCountries: '',
      requiresSponsorship: '',
      willingToRelocate: '',
      remotePreference: '',
      noticePeriod: '',
      availableFrom: '',
      salaryExpectation: '',
      hasDriversLicense: '',
    },
    eeo: {
      enabled: false,
      gender: '',
      pronouns: '',
      ethnicity: '',
      race: '',
      veteranStatus: '',
      disabilityStatus: '',
      sexualOrientation: '',
    },
    updatedAt: 0,
  };
}

/** Fills any missing keys of a stored (possibly older) profile with defaults. */
export function normalizeProfile(stored: Partial<Profile> | null | undefined): Profile {
  const empty = createEmptyProfile();
  if (!stored) return empty;
  return {
    ...empty,
    ...stored,
    basics: {
      ...empty.basics,
      ...stored.basics,
      location: { ...empty.basics.location, ...stored.basics?.location },
    },
    links: { ...empty.links, ...stored.links, other: stored.links?.other ?? [] },
    eligibility: { ...empty.eligibility, ...stored.eligibility },
    eeo: { ...empty.eeo, ...stored.eeo },
    skills: stored.skills ?? [],
    experience: stored.experience ?? [],
    education: stored.education ?? [],
    certifications: stored.certifications ?? [],
    languages: stored.languages ?? [],
    projects: stored.projects ?? [],
    awards: stored.awards ?? [],
  };
}
