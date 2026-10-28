import { describe, expect, it } from 'vitest';
import { guardBullets, maxBullets } from '@/shared/ai/truth/bullets';
import { buildTruthContext, filterSentences, findViolations } from '@/shared/ai/truth/context';
import { buildHeadline, guardHeadline, headlineProblems } from '@/shared/ai/truth/headline';
import { extractNumbers, findUnsupportedNumbers } from '@/shared/ai/truth/numbers';
import { findUnsupportedSeniority } from '@/shared/ai/truth/seniority';
import { findUnsupportedSkills, jobSkillTerms } from '@/shared/ai/truth/skills';
import { guardSummary, neutralSummary } from '@/shared/ai/truth/summary';
import { containsTerm } from '@/shared/ai/truth/terms';
import { findExcessYearClaims, totalExperienceYears, yearClaims } from '@/shared/ai/truth/years';
import { makeAnalysis, makeJob, makeProfile } from './fixtures';

const NOW = new Date(2026, 9, 28);

describe('numbers guard', () => {
  it('extracts percents, currency, multipliers, ranges and words', () => {
    const values = extractNumbers('Cut costs by 40% ($1.2M), 3x faster, 10-20 users, 5k rps, doubled revenue, twelve people');
    expect(values.map((v) => `${v.kind}:${v.value}`)).toEqual(
      expect.arrayContaining(['percent:40', 'plain:1200000', 'times:3', 'plain:10', 'plain:20', 'plain:5000', 'times:2', 'plain:12']),
    );
  });

  it('does not treat tech names as numbers', () => {
    expect(extractNumbers('Deployed on EC2 and S3 with OAuth2 and k8s')).toEqual([]);
  });

  it('allows numbers present in the source', () => {
    expect(findUnsupportedNumbers('Cut latency 40 percent', 'Reduced API latency by 40%')).toEqual([]);
    expect(findUnsupportedNumbers('Saved $1,200,000', 'saved 1.2M dollars')).toEqual([]);
    expect(findUnsupportedNumbers('Moved twelve services', 'Migrated 12 services')).toEqual([]);
  });

  it('flags new metrics, changed units and ranges', () => {
    expect(findUnsupportedNumbers('Reduced latency by 60%', 'Reduced latency by 40%')).toEqual(['60%']);
    expect(findUnsupportedNumbers('Migrated 12 services, 3x faster', 'Migrated 12 services')).toEqual(['3x']);
    expect(findUnsupportedNumbers('Grew team 12%', 'Team of 12')).toEqual(['12%']);
    expect(findUnsupportedNumbers('Served 10-20k users', 'Served many users')).toHaveLength(2);
  });
});

describe('skills guard', () => {
  const profileText = 'Go, Python, C++, Node.js, Kubernetes, .NET';
  it('matches tricky tech names with word boundaries', () => {
    expect(containsTerm('Wrote C++ code', 'C++')).toBe(true);
    expect(containsTerm('Built Node.js APIs', 'Node.js')).toBe(true);
    expect(containsTerm('Ported to .NET.', '.NET')).toBe(true);
    expect(containsTerm('Used Java daily', 'JavaScript')).toBe(false);
    expect(containsTerm('Used JavaScript daily', 'Java')).toBe(false);
    expect(containsTerm('Built NodeJS services', 'Node.js')).toBe(true);
  });

  it('treats short or everyday-word skills case-sensitively', () => {
    expect(containsTerm('we go further', 'Go')).toBe(false);
    expect(containsTerm('Wrote Go services', 'Go')).toBe(true);
  });

  it('flags job skills that the profile lacks', () => {
    const terms = ['Go', 'Kafka', 'Terraform', 'C#', 'Rust'];
    expect(findUnsupportedSkills('Built Go and Kafka pipelines with Terraform', terms, profileText)).toEqual(['Kafka', 'Terraform']);
    expect(findUnsupportedSkills('Wrote C# services', terms, profileText)).toEqual(['C#']);
    expect(findUnsupportedSkills('Wrote C++ services in Go', terms, profileText)).toEqual([]);
  });

  it('collects job terms and skips generic words', () => {
    const terms = jobSkillTerms(makeJob(), makeAnalysis({ atsKeywords: ['experience', 'microservices'] }));
    expect(terms).toContain('Kafka');
    expect(terms).toContain('microservices');
    expect(terms).not.toContain('experience');
  });
});

describe('seniority guard', () => {
  it('flags seniority words not in the allowed text', () => {
    expect(findUnsupportedSeniority('Senior Backend Engineer', 'Backend Engineer')).toEqual(['senior']);
    expect(findUnsupportedSeniority('Sr. Engineer and Tech Lead', 'Engineer')).toEqual(['senior', 'lead']);
    expect(findUnsupportedSeniority('VP of Engineering', 'Engineer')).toEqual(['vp']);
    expect(findUnsupportedSeniority('Engineering Manager', 'Engineering Manager')).toEqual([]);
    expect(findUnsupportedSeniority('Senior Engineer', 'Sr Engineer')).toEqual([]);
  });

  it('does not confuse verbs and substrings', () => {
    expect(findUnsupportedSeniority('Managed releases, led the migration, architected services', 'Engineer')).toEqual([]);
  });
});

describe('years guard', () => {
  it('computes total years with overlaps merged', () => {
    const years = totalExperienceYears(makeProfile().experience, NOW);
    // 2019-01 .. 2026-10 = 7 years 10 months
    expect(years).toBeGreaterThan(7.8);
    expect(years).toBeLessThan(7.9);
    const overlapping = totalExperienceYears(
      [
        { ...makeProfile().experience[1], startDate: '2020', endDate: '2021', current: false },
        { ...makeProfile().experience[1], startDate: '2021-01', endDate: '2021-12', current: false },
      ],
      NOW,
    );
    expect(overlapping).toBe(2);
  });

  it('extracts and checks claims', () => {
    expect(yearClaims('8+ years of Go, five years in fintech, over a decade')).toEqual([8, 5, 10]);
    expect(findExcessYearClaims('7 years building APIs', 7.8)).toEqual([]);
    expect(findExcessYearClaims('8+ years building APIs', 7.8)).toEqual([8]);
  });
});

describe('headline builder', () => {
  const profile = makeProfile();
  const job = makeJob();
  const ctx = buildTruthContext(profile, job, makeAnalysis(), NOW);

  it('uses the real most recent title and genuine job-relevant skills', () => {
    expect(buildHeadline(profile, ['Kubernetes', 'Kafka', 'Go', 'PostgreSQL', 'Python'])).toBe(
      'Backend Engineer · Kubernetes, Go, PostgreSQL',
    );
    expect(buildHeadline(profile, ['Kafka'])).toBe('Backend Engineer');
  });

  it('rejects posting titles, seniority upgrades and fake skills', () => {
    expect(guardHeadline('Senior Backend Engineer', profile, job, ctx)).not.toMatch(/Senior/);
    expect(headlineProblems('Senior Backend Engineer · Go', profile, job, ctx).length).toBeGreaterThan(0);
    expect(headlineProblems('Backend Engineer · Go, Kafka', profile, job, ctx).length).toBeGreaterThan(0);
    expect(headlineProblems('Platform Wizard · Go', profile, job, ctx)).toContain('does not start with the real most recent title');
    expect(guardHeadline('Backend Engineer · Go, Kubernetes', profile, job, ctx)).toBe('Backend Engineer · Go, Kubernetes');
  });
});

describe('bullets guard', () => {
  const source = { highlights: ['Reduced API latency by 40%', 'Migrated 12 services'], description: '' };
  const passes = (b: string) => findViolations(b, buildTruthContext(makeProfile(), makeJob(), makeAnalysis(), NOW), {
    numberSource: 'Reduced API latency by 40% Migrated 12 services',
  }).length === 0;

  it('falls back to the original highlight when a bullet fails', () => {
    expect(guardBullets(['Cut API latency by 75%', 'Moved 12 services to Kubernetes'], source, passes)).toEqual([
      'Reduced API latency by 40%',
      'Moved 12 services to Kubernetes',
    ]);
  });

  it('never exceeds the source bullet count and drops empties/duplicates', () => {
    expect(maxBullets(source)).toBe(2);
    expect(maxBullets({ ...source, description: 'x' })).toBe(3);
    expect(guardBullets(['A one', '', 'A one', 'B two', 'C three'], source, () => true)).toEqual(['A one', 'B two']);
    expect(guardBullets([], source, () => true)).toEqual(source.highlights);
  });
});

describe('summary guard', () => {
  const profile = makeProfile();
  const ctx = buildTruthContext(profile, makeJob(), makeAnalysis(), NOW);
  it('keeps a truthful summary', () => {
    const text = 'Backend engineer who builds Go services on Kubernetes.';
    expect(guardSummary(text, profile, ctx)).toBe(text);
  });
  it('falls back on fabricated metrics, skills, seniority or years', () => {
    for (const bad of [
      'Senior backend engineer with Go.',
      'Backend engineer with 10 years of Go.',
      'Backend engineer fluent in Kafka.',
      'Backend engineer who cut costs by 90%.',
    ]) {
      expect(guardSummary(bad, profile, ctx)).toBe(profile.summary);
    }
  });
  it('builds a neutral summary when the profile has none', () => {
    const p = { ...profile, summary: '' };
    expect(neutralSummary(p, ['Kubernetes'])).toMatch(/^Backend Engineer with hands-on experience in Kubernetes/);
  });
});

describe('sentence filter', () => {
  it('drops failing sentences and keeps paragraphs', () => {
    const out = filterSentences('Good one. Bad 99%.\n\nAnother good one.', (s) => !s.includes('%'));
    expect(out).toBe('Good one.\n\nAnother good one.');
  });
});
