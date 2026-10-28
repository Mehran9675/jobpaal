import type { JobAnalysis, JobPosting, Profile } from '@/shared/types';
import { truncate } from '@/shared/utils/text';
import { totalExperienceYears } from '../truth/years';

const line = (label: string, value: string | undefined): string => (value && value.trim() ? `${label}: ${value.trim()}` : '');
const range = (start: string, end: string, current: boolean): string => `${start || '?'} – ${current ? 'present' : end || '?'}`;
const lines = (parts: string[]): string => parts.filter(Boolean).join('\n');

/** Compact text view of the profile for prompts. No photo, contact details or EEO data. */
export function profileDigest(profile: Profile, options: { eligibility?: boolean } = {}): string {
  const parts: string[] = [];
  const name = [profile.basics.firstName, profile.basics.lastName].filter(Boolean).join(' ');
  parts.push(lines([line('Name', name), line('Own headline', profile.basics.headline), line('Location', [profile.basics.location.city, profile.basics.location.country].filter(Boolean).join(', '))]));
  parts.push(`Total professional experience computed from dates: ${totalExperienceYears(profile.experience)} years`);
  if (profile.summary.trim()) parts.push(`SUMMARY:\n${profile.summary.trim()}`);
  if (profile.skills.length) {
    parts.push(`SKILLS:\n${profile.skills.filter((g) => g.skills.length).map((g) => `- ${g.name || 'Skills'}: ${g.skills.join(', ')}`).join('\n')}`);
  }
  if (profile.experience.length) {
    parts.push(
      `EXPERIENCE:\n${profile.experience
        .map((e) =>
          lines([
            `[id=${e.id}] ${e.title} at ${e.company}${e.location ? `, ${e.location}` : ''} (${range(e.startDate, e.endDate, e.current)})`,
            e.description.trim() ? `  Description: ${e.description.trim()}` : '',
            ...e.highlights.filter((h) => h.trim()).map((h) => `  - ${h.trim()}`),
            e.skills.length ? `  Skills: ${e.skills.join(', ')}` : '',
          ]),
        )
        .join('\n')}`,
    );
  }
  if (profile.projects.length) {
    parts.push(
      `PROJECTS:\n${profile.projects
        .map((p) =>
          lines([
            `[id=${p.id}] ${p.name}${p.role ? ` (${p.role})` : ''}`,
            p.description.trim() ? `  Description: ${p.description.trim()}` : '',
            ...p.highlights.filter((h) => h.trim()).map((h) => `  - ${h.trim()}`),
            p.skills.length ? `  Skills: ${p.skills.join(', ')}` : '',
          ]),
        )
        .join('\n')}`,
    );
  }
  if (profile.education.length) {
    parts.push(`EDUCATION:\n${profile.education.map((e) => `- ${[e.degree, e.field].filter(Boolean).join(', ')} — ${e.institution} (${range(e.startDate, e.endDate, false)})${e.grade ? `, ${e.grade}` : ''}`).join('\n')}`);
  }
  if (profile.certifications.length) {
    parts.push(`CERTIFICATIONS:\n${profile.certifications.map((c) => `- ${c.name}${c.issuer ? ` (${c.issuer})` : ''}${c.date ? `, ${c.date}` : ''}`).join('\n')}`);
  }
  if (profile.languages.length) parts.push(`LANGUAGES: ${profile.languages.map((l) => `${l.language}${l.fluency ? ` (${l.fluency})` : ''}`).join(', ')}`);
  if (profile.awards.length) parts.push(`AWARDS:\n${profile.awards.map((a) => `- ${a.title}${a.issuer ? ` (${a.issuer})` : ''}${a.date ? `, ${a.date}` : ''}`).join('\n')}`);
  if (options.eligibility) {
    const el = profile.eligibility;
    parts.push(
      `WORK ELIGIBILITY (empty means unknown):\n${lines([
        line('Authorised to work in', el.authorizedCountries),
        line('Requires visa sponsorship', el.requiresSponsorship),
        line('Willing to relocate', el.willingToRelocate),
        line('Remote preference', el.remotePreference),
        line('Notice period', el.noticePeriod),
        line('Available from', el.availableFrom),
        line('Salary expectation', el.salaryExpectation),
        line("Has driver's licence", el.hasDriversLicense),
      ]) || '(none provided)'}`,
    );
  }
  return parts.filter(Boolean).join('\n\n');
}

/** Job text for prompts, with a length cap to keep requests reasonable. */
export function jobDigest(job: JobPosting, maxDescription = 14000): string {
  return lines([
    line('Job title', job.title),
    line('Company', job.company),
    line('Location', job.location),
    line('Salary', job.salary),
    line('Employment type', job.employmentType),
    `Description:\n${truncate(job.description.trim(), maxDescription)}`,
  ]);
}

export function analysisDigest(analysis: JobAnalysis | null | undefined): string {
  if (!analysis) return '';
  return lines([
    line('Seniority', analysis.seniority),
    line('Required skills', analysis.requiredSkills.join(', ')),
    line('Preferred skills', analysis.preferredSkills.join(', ')),
    line('ATS keywords', analysis.atsKeywords.join(', ')),
    line('Must-prove themes', analysis.mustProveThemes.join('; ')),
    line('Candidate skills that match', analysis.matchedSkills.join(', ')),
    line('Requirements the candidate does NOT have (never claim these)', analysis.missingSkills.join(', ')),
  ]);
}
