import { createEmptyProfile } from '@/shared/defaults/profile';
import type { FillPlan } from '@/shared/messaging/fill';
import type { Profile } from '@/shared/types';

/** Loads a full HTML page into the global jsdom document. */
export function load(html: string): Document {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  document.head.innerHTML = parsed.head.innerHTML;
  document.body.innerHTML = parsed.body.innerHTML;
  document.title = parsed.title;
  return document;
}

export const DESCRIPTION_HTML = `
  <h2>About the role</h2>
  <p>We are looking for a Senior Frontend Engineer to join our product team in Berlin. You will work closely with designers and backend engineers to build fast, accessible interfaces that thousands of customers use every day.</p>
  <h3>Responsibilities</h3>
  <ul>
    <li>Build and maintain features in our React and TypeScript web application.</li>
    <li>Collaborate with product managers to shape the roadmap and refine requirements.</li>
    <li>Review code, mentor other engineers and improve our testing culture.</li>
  </ul>
  <h3>Requirements</h3>
  <ul>
    <li>5+ years of experience building web applications with JavaScript.</li>
    <li>Strong knowledge of React, TypeScript and modern CSS.</li>
    <li>Experience with automated testing and continuous integration.</li>
  </ul>
  <p>We offer a friendly team, flexible hours and a generous learning budget for every engineer.</p>
`;

export function sampleProfile(): Profile {
  const profile = createEmptyProfile();
  profile.basics.firstName = 'Ada';
  profile.basics.lastName = 'Lovelace';
  profile.basics.email = 'ada@example.com';
  profile.basics.phone = '+44 20 1234 5678';
  profile.basics.location = { address: '1 Main St', city: 'London', region: 'England', postalCode: 'N1 1AA', country: 'United Kingdom' };
  profile.links.linkedin = 'https://www.linkedin.com/in/ada';
  profile.experience = [
    { id: 'e1', company: 'Analytical Engines', title: 'Senior Engineer', location: '', startDate: '2018-01', endDate: '', current: true, description: '', highlights: [], skills: [] },
    { id: 'e2', company: 'Babbage Ltd', title: 'Engineer', location: '', startDate: '2014-01', endDate: '2018-06', current: false, description: '', highlights: [], skills: [] },
  ];
  profile.education = [
    { id: 'ed1', institution: 'University of London', degree: 'BSc', field: 'Mathematics', location: '', startDate: '2010', endDate: '2013-06', grade: '', description: '' },
  ];
  profile.eligibility.requiresSponsorship = 'no';
  profile.eligibility.willingToRelocate = 'yes';
  profile.eligibility.authorizedCountries = 'United Kingdom';
  return profile;
}

export function samplePlan(overrides: Partial<FillPlan> = {}): FillPlan {
  return {
    profile: sampleProfile(),
    answers: [],
    savedAnswers: [],
    mappings: [],
    coverLetterText: 'Dear hiring team, I would love to join.',
    files: { resume: null, coverLetter: null },
    options: {
      overwriteExisting: false,
      highlightFilled: true,
      fillEeo: false,
      fillAfterTailor: false,
      attachResume: true,
      attachCoverLetter: true,
    },
    ...overrides,
  };
}
