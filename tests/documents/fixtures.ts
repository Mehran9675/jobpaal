import { ALL_RESUME_SECTIONS, type DesignSettings, type ResumeContent } from '@/shared/types';

export function design(overrides: Partial<DesignSettings> = {}): DesignSettings {
  return {
    template: 'modern',
    accent: '#2563eb',
    density: 'normal',
    pageSize: 'A4',
    sectionOrder: [...ALL_RESUME_SECTIONS],
    hiddenSections: [],
    showPhoto: false,
    customFont: null,
    outputFormats: ['pdf'],
    ...overrides,
  };
}

// 1x1 transparent PNG.
export const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

export function resume(overrides: Partial<ResumeContent> = {}): ResumeContent {
  return {
    name: 'Jane Doe',
    firstName: 'Jane',
    lastName: 'Doe',
    headline: 'Senior Software Engineer',
    contact: {
      email: 'jane@example.com',
      phone: '+1 555 0100',
      location: 'Berlin, Germany',
      links: [
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/janedoe' },
        { label: 'GitHub', url: 'https://github.com/janedoe' },
        { label: 'Website', url: 'https://jane.dev' },
      ],
    },
    photo: '',
    summary: 'Engineer with eight years of experience building web platforms.',
    skills: [
      { name: 'Languages', skills: ['TypeScript', 'Go', 'SQL'] },
      { name: 'Tools', skills: ['React', 'PostgreSQL', 'Docker'] },
      { name: 'Practices', skills: ['Testing', 'Code review'] },
    ],
    experience: [
      {
        sourceId: 'e1',
        title: 'Senior Engineer',
        company: 'Acme',
        location: 'Berlin',
        startDate: '2021-03',
        endDate: '',
        current: true,
        description: 'Platform team.',
        bullets: ['Led the migration to TypeScript.', 'Reduced build times by 40%.'],
      },
      {
        sourceId: 'e2',
        title: 'Engineer',
        company: 'Globex',
        location: 'Hamburg',
        startDate: '2017-01',
        endDate: '2021-02',
        current: false,
        description: '',
        bullets: ['Built the billing service.'],
      },
    ],
    education: [
      {
        sourceId: 'ed1',
        institution: 'TU Berlin',
        degree: 'BSc',
        field: 'Computer Science',
        location: 'Berlin',
        startDate: '2013',
        endDate: '2016',
        grade: '1.7',
        description: '',
      },
    ],
    certifications: [{ sourceId: 'c1', name: 'AWS Solutions Architect', issuer: 'Amazon', date: '2022-05' }],
    languages: [
      { sourceId: 'l1', language: 'English', fluency: 'Native' },
      { sourceId: 'l2', language: 'German', fluency: 'C1' },
    ],
    projects: [
      { sourceId: 'p1', name: 'OpenThing', role: 'Maintainer', url: 'github.com/janedoe/openthing', description: 'A tool.', bullets: ['500 stars.'] },
    ],
    awards: [{ sourceId: 'a1', title: 'Hackathon winner', issuer: 'Acme', date: '2022', description: '' }],
    sectionOrder: [...ALL_RESUME_SECTIONS],
    ...overrides,
  };
}

export function longResume(): ResumeContent {
  const base = resume();
  const experience = Array.from({ length: 14 }, (_, i) => ({
    ...base.experience[0],
    sourceId: `e${i}`,
    company: `Company ${i}`,
    current: false,
    startDate: `${2000 + i}-01`,
    endDate: `${2001 + i}-01`,
    description: 'Worked on many things across the stack, with a focus on reliability and developer experience. '.repeat(3),
    bullets: Array.from({ length: 5 }, (_, j) => `Accomplishment ${j} with a fairly long description that wraps onto another line in most templates.`),
  }));
  return { ...base, experience };
}
