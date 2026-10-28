import { describe, expect, it } from 'vitest';
import { applicationHash, parseHash, routeToHash } from '@/options/lib/routes';

describe('parseHash', () => {
  it('defaults to the dashboard', () => {
    expect(parseHash('')).toEqual({ section: 'dashboard' });
    expect(parseHash('#')).toEqual({ section: 'dashboard' });
    expect(parseHash('#nope')).toEqual({ section: 'dashboard' });
  });

  it('parses every section', () => {
    for (const section of ['dashboard', 'profile', 'documents', 'applications', 'designs', 'providers', 'prompts', 'settings', 'terms'] as const) {
      expect(parseHash(`#${section}`)).toEqual({ section });
    }
  });

  it('parses application detail and edit routes', () => {
    expect(parseHash('#applications/app_123')).toEqual({ section: 'applications', applicationId: 'app_123', view: 'detail' });
    expect(parseHash('#applications/app_123/edit')).toEqual({ section: 'applications', applicationId: 'app_123', view: 'edit' });
    expect(parseHash('#applications/app%20x/')).toEqual({ section: 'applications', applicationId: 'app x', view: 'detail' });
  });

  it('maps #usage to the usage report in providers', () => {
    expect(parseHash('#usage')).toEqual({ section: 'providers', focus: 'usage' });
    expect(parseHash('#providers/usage')).toEqual({ section: 'providers', focus: 'usage' });
  });

  it('tolerates a leading slash and case', () => {
    expect(parseHash('#/Settings')).toEqual({ section: 'settings' });
  });
});

describe('routeToHash', () => {
  it('round-trips', () => {
    for (const hash of ['#dashboard', '#usage', '#applications/abc', '#applications/abc/edit', '#terms']) {
      expect(routeToHash(parseHash(hash))).toBe(hash);
    }
  });

  it('builds application hashes', () => {
    expect(applicationHash('a/b')).toBe('#applications/a%2Fb');
    expect(applicationHash('x', true)).toBe('#applications/x/edit');
  });
});
