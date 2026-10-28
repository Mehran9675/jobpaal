import { describe, expect, it } from 'vitest';
import { TERMS_VERSION } from '@/shared/defaults/settings';
import { allStatementsChecked, createTermsAcceptance, hasAcceptedTerms, TERMS_STATEMENTS, TERMS_TEXT } from '@/shared/legal/terms';

describe('terms', () => {
  it('has exactly five statements with unique ids', () => {
    expect(TERMS_STATEMENTS).toHaveLength(5);
    expect(new Set(TERMS_STATEMENTS.map((s) => s.id)).size).toBe(5);
  });

  it('includes the key sections in the full text', () => {
    for (const phrase of ['never submits', 'No fabrication', 'telemetry', 'AI provider', 'No guarantee', 'liability', 'Changes to these terms']) {
      expect(TERMS_TEXT.toLowerCase()).toContain(phrase.toLowerCase());
    }
  });

  it('requires every statement', () => {
    const ids = TERMS_STATEMENTS.map((s) => s.id);
    expect(allStatementsChecked(ids)).toBe(true);
    expect(allStatementsChecked(ids.slice(1))).toBe(false);
  });

  it('records acceptance for the current version', () => {
    const acceptance = createTermsAcceptance(TERMS_STATEMENTS.map((s) => s.id), 123);
    expect(acceptance).toEqual({ version: TERMS_VERSION, acceptedAt: 123, statements: TERMS_STATEMENTS.map((s) => s.id) });
    expect(hasAcceptedTerms({ terms: acceptance })).toBe(true);
    expect(hasAcceptedTerms({ terms: { ...acceptance, version: '0.1' } })).toBe(false);
    expect(hasAcceptedTerms({ terms: null })).toBe(false);
    expect(hasAcceptedTerms(undefined)).toBe(false);
  });
});
