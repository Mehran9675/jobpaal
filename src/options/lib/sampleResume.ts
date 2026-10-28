import { ALL_RESUME_SECTIONS, type ResumeContent } from '@/shared/types';

/** Placeholder content for the design preview when the profile is still empty. Clearly fictional. */
export const SAMPLE_RESUME: ResumeContent = {
  name: 'Alex Example',
  firstName: 'Alex',
  lastName: 'Example',
  headline: 'Product Designer',
  contact: {
    email: 'alex@example.com',
    phone: '+1 555 0100',
    location: 'Springfield',
    links: [{ label: 'Portfolio', url: 'https://example.com' }],
  },
  photo: '',
  summary: 'Sample content shown because your profile is empty. Fill in My profile to preview the design with your own details.',
  skills: [
    { name: 'Design', skills: ['User research', 'Prototyping', 'Design systems'] },
    { name: 'Tools', skills: ['Figma', 'HTML', 'CSS'] },
  ],
  experience: [
    {
      sourceId: 'sample-1',
      title: 'Product Designer',
      company: 'Example Co.',
      location: 'Springfield',
      startDate: '2021-03',
      endDate: '',
      current: true,
      description: 'Sample role description.',
      bullets: ['Sample highlight about a project you worked on.', 'Another sample highlight.'],
    },
    {
      sourceId: 'sample-2',
      title: 'Junior Designer',
      company: 'Sample Studio',
      location: 'Shelbyville',
      startDate: '2018-06',
      endDate: '2021-02',
      current: false,
      description: '',
      bullets: ['Sample highlight.'],
    },
  ],
  education: [
    {
      sourceId: 'sample-edu',
      institution: 'Example University',
      degree: 'BA',
      field: 'Design',
      location: '',
      startDate: '2014',
      endDate: '2018',
      grade: '',
      description: '',
    },
  ],
  certifications: [{ sourceId: 'sample-cert', name: 'Sample Certificate', issuer: 'Example Institute', date: '2022' }],
  languages: [{ sourceId: 'sample-lang', language: 'English', fluency: 'Native' }],
  projects: [{ sourceId: 'sample-proj', name: 'Sample project', role: 'Lead', url: '', description: 'A sample project.', bullets: [] }],
  awards: [],
  sectionOrder: [...ALL_RESUME_SECTIONS],
};
