import { describe, expect, it } from 'vitest';
import { jsonResumeToProfile } from '@/shared/import';
import { resumeToJsonResume } from '@/shared/documents';
import { resume } from '../documents/fixtures';

const sample = {
  basics: {
    name: 'Jane Mary Doe',
    label: 'Software Engineer',
    email: 'jane@example.com',
    phone: '+1 555 0100',
    url: 'https://jane.dev',
    summary: 'Builds things.',
    location: { address: '1 Main St', postalCode: '10115', city: 'Berlin', countryCode: 'DE', region: 'Berlin' },
    profiles: [
      { network: 'LinkedIn', username: 'janedoe', url: 'https://www.linkedin.com/in/janedoe' },
      { network: 'GitHub', username: 'janedoe' },
      { network: 'X', url: 'https://x.com/jane' },
      { network: 'Mastodon', url: 'https://fosstodon.org/@jane' },
      { url: 'https://dribbble.com/jane' },
    ],
  },
  work: [
    {
      name: 'Acme',
      position: 'Senior Engineer',
      startDate: '2021-03-01',
      summary: 'Platform team.',
      highlights: ['Led migration', '  '],
    },
    { company: 'Globex', position: 'Engineer', startDate: '2017-01', endDate: '2021-02-28' },
  ],
  education: [{ institution: 'TU Berlin', area: 'Computer Science', studyType: 'BSc', startDate: '2013', endDate: '2016', score: '1.7' }],
  skills: [{ name: 'Languages', keywords: ['TypeScript', 'Go'] }, { name: 'Docker' }, { name: 'Kubernetes', keywords: [] }],
  languages: [{ language: 'English', fluency: 'Native' }],
  projects: [{ name: 'OpenThing', roles: ['Maintainer'], url: 'https://github.com/janedoe/openthing', highlights: ['500 stars'] }],
  awards: [{ title: 'Hackathon winner', awarder: 'Acme', date: '2022-06-01' }],
  certificates: [{ name: 'AWS SA', issuer: 'Amazon', date: '2022-05-10' }],
};

describe('jsonResumeToProfile', () => {
  it('maps basics, location and links', () => {
    const p = jsonResumeToProfile(sample);
    expect(p.basics).toMatchObject({
      firstName: 'Jane',
      lastName: 'Mary Doe',
      headline: 'Software Engineer',
      email: 'jane@example.com',
      location: { address: '1 Main St', city: 'Berlin', region: 'Berlin', postalCode: '10115', country: 'DE' },
    });
    expect(p.summary).toBe('Builds things.');
    expect(p.links).toMatchObject({
      linkedin: 'https://www.linkedin.com/in/janedoe',
      github: 'https://github.com/janedoe',
      twitter: 'https://x.com/jane',
      website: 'https://jane.dev',
    });
    expect(p.links!.other.map((l) => [l.label, l.url])).toEqual([
      ['Mastodon', 'https://fosstodon.org/@jane'],
      ['dribbble.com', 'https://dribbble.com/jane'],
    ]);
    expect(p.links!.other.every((l) => l.id)).toBe(true);
  });

  it('maps work, education and other sections', () => {
    const p = jsonResumeToProfile(sample);
    expect(p.experience).toHaveLength(2);
    expect(p.experience![0]).toMatchObject({
      company: 'Acme',
      title: 'Senior Engineer',
      startDate: '2021-03',
      endDate: '',
      current: true,
      description: 'Platform team.',
      highlights: ['Led migration'],
    });
    expect(p.experience![1]).toMatchObject({ company: 'Globex', startDate: '2017-01', endDate: '2021-02', current: false });
    expect(p.experience!.every((e) => e.id)).toBe(true);
    expect(p.education![0]).toMatchObject({ institution: 'TU Berlin', degree: 'BSc', field: 'Computer Science', grade: '1.7' });
    expect(p.skills!.map((g) => [g.name, g.skills])).toEqual([
      ['Languages', ['TypeScript', 'Go']],
      ['Skills', ['Docker', 'Kubernetes']],
    ]);
    expect(p.languages![0]).toMatchObject({ language: 'English', fluency: 'Native' });
    expect(p.projects![0]).toMatchObject({ name: 'OpenThing', role: 'Maintainer', highlights: ['500 stars'] });
    expect(p.awards![0]).toMatchObject({ title: 'Hackathon winner', issuer: 'Acme', date: '2022-06' });
    expect(p.certifications![0]).toMatchObject({ name: 'AWS SA', issuer: 'Amazon', date: '2022-05' });
  });

  it('accepts a JSON string and round-trips exported resumes', () => {
    const p = jsonResumeToProfile(JSON.stringify(resumeToJsonResume(resume())));
    expect(p.basics?.firstName).toBe('Jane');
    expect(p.links?.linkedin).toContain('linkedin.com/in/janedoe');
    expect(p.experience?.[0]).toMatchObject({ company: 'Acme', current: true });
    expect(p.skills).toHaveLength(3);
  });

  it('rejects things that are not JSON Resumes', () => {
    expect(() => jsonResumeToProfile(null)).toThrow(/not a JSON Resume/);
    expect(() => jsonResumeToProfile([1, 2])).toThrow(/not a JSON Resume/);
    expect(() => jsonResumeToProfile({ foo: 'bar' })).toThrow(/not a JSON Resume/);
    expect(() => jsonResumeToProfile('not json')).toThrow(/not a JSON Resume/);
  });
});
