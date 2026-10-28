import { describe, expect, it } from 'vitest';
import { isLinkedInProfilePage, scanLinkedInProfile } from '@/content/linkedin';
import { load } from './helpers';

const s = (text: string): string => `<span aria-hidden="true">${text}</span><span class="visually-hidden">${text}</span>`;

const PAGE = `<html><body><main>
  <section><div class="pv-text-details__left-panel"><h1 class="text-heading-xlarge">Ada Lovelace</h1>
    <div class="text-body-medium break-words">Senior Engineer at Analytical Engines</div>
    <span class="text-body-small inline t-black--light break-words">London, England, United Kingdom</span></div></section>
  <section><div id="about"></div><div>${s('About')}</div>
    <div class="inline-show-more-text">${s('I build engines that compute things.')}</div></section>
  <section><div id="experience"></div><div>${s('Experience')}</div><ul>
    <li><div>${s('Senior Engineer')}${s('Analytical Engines · Full-time')}${s('Jan 2018 - Present · 8 yrs')}${s('London, England, United Kingdom')}</div>
      <ul><li>${s('Led the design of the difference engine.')}</li><li>${s('Skills: Mathematics · Engineering')}</li></ul></li>
    <li><div>${s('Babbage Ltd')}${s('4 yrs 6 mos')}</div><ul>
      <li>${s('Engineer')}${s('Mar 2016 - Jun 2018 · 2 yrs 4 mos')}</li>
      <li>${s('Junior Engineer')}${s('Jan 2014 - Feb 2016 · 2 yrs 2 mos')}</li></ul></li>
  </ul></section>
  <section><div id="education"></div><div>${s('Education')}</div><ul>
    <li>${s('University of London')}${s('BSc, Mathematics')}${s('2010 - 2013')}</li></ul></section>
  <section><div id="skills"></div><ul><li>${s('TypeScript')}</li><li>${s('Mathematics')}</li></ul></section>
  <section><div id="licenses_and_certifications"></div><ul><li>${s('AWS Certified Developer')}${s('Amazon Web Services (AWS)')}${s('Issued Jan 2022 · Expires Jan 2025')}${s('Credential ID ABC123')}</li></ul></section>
  <section><div id="languages"></div><ul><li>${s('French')}${s('Professional working proficiency')}</li></ul></section>
</main></body></html>`;

describe('LinkedIn profile scan', () => {
  it('detects profile URLs', () => {
    expect(isLinkedInProfilePage('https://www.linkedin.com/in/ada-lovelace/')).toBe(true);
    expect(isLinkedInProfilePage('https://www.linkedin.com/jobs/view/123')).toBe(false);
  });

  it('reads the profile', () => {
    load(PAGE);
    const profile = scanLinkedInProfile(document)!;
    expect(profile.basics).toMatchObject({ firstName: 'Ada', lastName: 'Lovelace', headline: 'Senior Engineer at Analytical Engines' });
    expect(profile.basics!.location).toMatchObject({ city: 'London', region: 'England', country: 'United Kingdom' });
    expect(profile.summary).toBe('I build engines that compute things.');
    const exp = profile.experience!;
    expect(exp).toHaveLength(3);
    expect(exp[0]).toMatchObject({ title: 'Senior Engineer', company: 'Analytical Engines', startDate: '2018-01', current: true, location: 'London, England, United Kingdom' });
    expect(exp[0].description).toContain('difference engine');
    expect(exp[0].skills).toEqual(['Mathematics', 'Engineering']);
    expect(exp[1]).toMatchObject({ title: 'Engineer', company: 'Babbage Ltd', startDate: '2016-03', endDate: '2018-06', current: false });
    expect(exp[2]).toMatchObject({ title: 'Junior Engineer', company: 'Babbage Ltd' });
    expect(profile.education![0]).toMatchObject({ institution: 'University of London', degree: 'BSc', field: 'Mathematics', startDate: '2010', endDate: '2013' });
    expect(profile.skills![0].skills).toEqual(['TypeScript', 'Mathematics']);
    expect(profile.certifications![0]).toMatchObject({ name: 'AWS Certified Developer', issuer: 'Amazon Web Services (AWS)', date: '2022-01', expires: '2025-01', credentialId: 'ABC123' });
    expect(profile.languages![0]).toMatchObject({ language: 'French', fluency: 'Professional working proficiency' });
  });

  it('returns null on an unreadable page', () => {
    load('<html><body><div>nothing</div></body></html>');
    expect(scanLinkedInProfile(document)).toBeNull();
  });
});
