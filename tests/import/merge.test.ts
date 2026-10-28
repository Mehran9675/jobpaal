import { describe, expect, it } from 'vitest';
import { createEmptyProfile } from '@/shared/defaults/profile';
import { mergeProfile } from '@/shared/import';
import type { Experience, Profile } from '@/shared/types';

function exp(overrides: Partial<Experience>): Experience {
  return {
    id: '',
    company: 'Acme',
    title: 'Engineer',
    location: '',
    startDate: '2020-01',
    endDate: '',
    current: true,
    description: '',
    highlights: [],
    skills: [],
    ...overrides,
  };
}

function base(): Profile {
  const p = createEmptyProfile();
  p.basics.firstName = 'Jane';
  p.basics.email = 'jane@old.com';
  p.summary = 'Old summary';
  p.skills = [{ id: 's1', name: 'Languages', skills: ['TypeScript'] }];
  p.experience = [exp({ id: 'x1', highlights: ['A'] })];
  p.education = [{ id: 'ed1', institution: 'TU Berlin', degree: 'BSc', field: '', location: '', startDate: '', endDate: '', grade: '', description: '' }];
  return p;
}

describe('mergeProfile', () => {
  it('fills empty scalars only, unless overwrite', () => {
    const incoming: Partial<Profile> = {
      basics: { ...createEmptyProfile().basics, firstName: 'Janet', lastName: 'Doe', email: 'jane@new.com', location: { ...createEmptyProfile().basics.location, city: 'Berlin' } },
      summary: 'New summary',
    };
    const kept = mergeProfile(base(), incoming, false);
    expect(kept.basics).toMatchObject({ firstName: 'Jane', lastName: 'Doe', email: 'jane@old.com' });
    expect(kept.basics.location.city).toBe('Berlin');
    expect(kept.summary).toBe('Old summary');

    const replaced = mergeProfile(base(), incoming, true);
    expect(replaced.basics).toMatchObject({ firstName: 'Janet', lastName: 'Doe', email: 'jane@new.com' });
    expect(replaced.summary).toBe('New summary');
  });

  it('never clears values with empty incoming data', () => {
    const merged = mergeProfile(base(), { basics: createEmptyProfile().basics, summary: '' }, true);
    expect(merged.basics.firstName).toBe('Jane');
    expect(merged.summary).toBe('Old summary');
  });

  it('dedupes experience and education, appending new entries with ids', () => {
    const merged = mergeProfile(
      base(),
      {
        experience: [
          exp({ company: ' acme ', title: 'ENGINEER', highlights: ['A', 'B'], location: 'Berlin' }),
          exp({ company: 'Globex', title: 'Intern', startDate: '2018-01' }),
        ],
        education: [{ id: '', institution: 'TU Berlin', degree: 'BSc', field: 'CS', location: '', startDate: '', endDate: '', grade: '', description: '' }],
      },
      false,
    );
    expect(merged.experience).toHaveLength(2);
    expect(merged.experience[0]).toMatchObject({ id: 'x1', highlights: ['A', 'B'], location: 'Berlin' });
    expect(merged.experience[1].company).toBe('Globex');
    expect(merged.experience[1].id).toBeTruthy();
    expect(merged.education).toHaveLength(1);
    expect(merged.education[0].field).toBe('CS');
  });

  it('merges skills into groups by name', () => {
    const merged = mergeProfile(
      base(),
      {
        skills: [
          { id: '', name: 'languages', skills: ['typescript', 'Go'] },
          { id: '', name: 'Tools', skills: ['Docker'] },
          { id: '', name: 'Empty', skills: [] },
        ],
      },
      false,
    );
    expect(merged.skills.map((g) => [g.name, g.skills])).toEqual([
      ['Languages', ['TypeScript', 'Go']],
      ['Tools', ['Docker']],
    ]);
    expect(merged.skills.every((g) => g.id)).toBe(true);
  });

  it('handles partial entries from loose sources and sets updatedAt', () => {
    const before = Date.now();
    const merged = mergeProfile(
      createEmptyProfile(),
      { projects: [{ name: 'Thing' } as never], links: { ...createEmptyProfile().links, github: 'https://github.com/j', other: [{ id: '', label: 'Blog', url: 'https://blog.dev' }] } },
      false,
    );
    expect(merged.projects[0]).toMatchObject({ name: 'Thing', highlights: [], skills: [], role: '' });
    expect(merged.projects[0].id).toBeTruthy();
    expect(merged.links.github).toBe('https://github.com/j');
    expect(merged.links.other[0].id).toBeTruthy();
    expect(merged.updatedAt).toBeGreaterThanOrEqual(before);

    const again = mergeProfile(merged, { links: { ...createEmptyProfile().links, other: [{ id: '', label: 'Blog', url: 'http://www.blog.dev/' }] } }, false);
    expect(again.links.other).toHaveLength(1);
  });

  it('does not mutate the inputs', () => {
    const b = base();
    const snapshot = JSON.stringify(b);
    mergeProfile(b, { skills: [{ id: '', name: 'Languages', skills: ['Go'] }], experience: [exp({ highlights: ['Z'] })] }, true);
    expect(JSON.stringify(b)).toBe(snapshot);
  });
});
