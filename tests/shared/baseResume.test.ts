import { describe, expect, it } from 'vitest';
import { createEmptyProfile } from '@/shared/defaults/profile';
import { buildBaseResume } from '@/shared/resume/baseResume';

describe('buildBaseResume', () => {
  it('keeps facts exactly and orders experience most recent first', () => {
    const profile = createEmptyProfile();
    profile.basics.firstName = 'Jane';
    profile.basics.lastName = 'Doe';
    profile.links.github = 'https://github.com/jane';
    profile.experience = [
      { id: 'a', company: 'Old Co', title: 'Developer', location: '', startDate: '2015-01', endDate: '2018-06', current: false, description: '', highlights: ['Built X'], skills: [] },
      { id: 'b', company: 'New Co', title: 'Engineer', location: 'Berlin', startDate: '2018-07', endDate: '', current: true, description: '', highlights: ['Led Y'], skills: [] },
    ];
    const resume = buildBaseResume(profile);
    expect(resume.name).toBe('Jane Doe');
    expect(resume.experience.map((e) => e.company)).toEqual(['New Co', 'Old Co']);
    expect(resume.headline).toBe('Engineer');
    expect(resume.experience[1].bullets).toEqual(['Built X']);
    expect(resume.contact.links).toEqual([{ label: 'GitHub', url: 'https://github.com/jane' }]);
  });
});
