import { ALL_RESUME_SECTIONS, type Profile, type ResumeContent } from '@/shared/types';

function locationLine(profile: Profile): string {
  const { city, region, country } = profile.basics.location;
  return [city, region, country].filter(Boolean).join(', ');
}

function contactLinks(profile: Profile): { label: string; url: string }[] {
  const { linkedin, github, portfolio, website, twitter, other } = profile.links;
  return [
    { label: 'LinkedIn', url: linkedin },
    { label: 'GitHub', url: github },
    { label: 'Portfolio', url: portfolio },
    { label: 'Website', url: website },
    { label: 'X / Twitter', url: twitter },
    ...other.map((link) => ({ label: link.label, url: link.url })),
  ].filter((link) => link.url.trim());
}

/** Experience sorted most-recent first (current roles first, then by end/start date). */
export function sortedExperience(profile: Profile): Profile['experience'] {
  return [...profile.experience].sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1;
    const aKey = a.endDate || a.startDate;
    const bKey = b.endDate || b.startDate;
    return bKey.localeCompare(aKey);
  });
}

/**
 * The untailored resume: every fact exactly as in the profile.
 * Tailoring starts from this and only rewords, reorders, trims and emphasises.
 */
export function buildBaseResume(profile: Profile): ResumeContent {
  const { basics } = profile;
  const experience = sortedExperience(profile);
  return {
    name: [basics.firstName, basics.lastName].filter(Boolean).join(' '),
    firstName: basics.firstName,
    lastName: basics.lastName,
    headline: basics.headline || experience[0]?.title || '',
    contact: { email: basics.email, phone: basics.phone, location: locationLine(profile), links: contactLinks(profile) },
    photo: basics.photo,
    summary: profile.summary,
    skills: profile.skills.filter((g) => g.skills.length).map((g) => ({ name: g.name, skills: [...g.skills] })),
    experience: experience.map((e) => ({
      sourceId: e.id,
      title: e.title,
      company: e.company,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
      description: e.description,
      bullets: [...e.highlights],
    })),
    education: profile.education.map((e) => ({
      sourceId: e.id,
      institution: e.institution,
      degree: e.degree,
      field: e.field,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      grade: e.grade,
      description: e.description,
    })),
    certifications: profile.certifications.map((c) => ({ sourceId: c.id, name: c.name, issuer: c.issuer, date: c.date })),
    languages: profile.languages.map((l) => ({ sourceId: l.id, language: l.language, fluency: l.fluency })),
    projects: profile.projects.map((p) => ({
      sourceId: p.id,
      name: p.name,
      role: p.role,
      url: p.url,
      description: p.description,
      bullets: [...p.highlights],
    })),
    awards: profile.awards.map((a) => ({
      sourceId: a.id,
      title: a.title,
      issuer: a.issuer,
      date: a.date,
      description: a.description,
    })),
    sectionOrder: [...ALL_RESUME_SECTIONS],
  };
}
