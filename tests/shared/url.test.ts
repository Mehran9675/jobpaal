import { describe, expect, it } from 'vitest';
import { hostFromUrl, pageKeyFromUrl } from '@/shared/utils/url';

describe('pageKeyFromUrl', () => {
  it('drops tracking parameters, hash and trailing slash', () => {
    expect(pageKeyFromUrl('https://Jobs.Lever.co/acme/123/?utm_source=x&lever-source=y#apply')).toBe(
      'https://jobs.lever.co/acme/123?lever-source=y',
    );
  });

  it('keeps meaningful parameters sorted', () => {
    expect(pageKeyFromUrl('https://www.linkedin.com/jobs/view/?trk=abc&currentJobId=42')).toBe(
      'https://www.linkedin.com/jobs/view?currentJobId=42',
    );
  });

  it('returns the input for invalid URLs', () => {
    expect(pageKeyFromUrl('not a url')).toBe('not a url');
  });
});

describe('hostFromUrl', () => {
  it('strips www and lowercases', () => {
    expect(hostFromUrl('https://WWW.Indeed.com/viewjob?jk=1')).toBe('indeed.com');
  });
});
