import { describe, expect, it } from 'vitest';
import { checkJobDescriptionProse } from '@/shared/text/prose';

const REAL = `About the role
We are looking for a backend engineer to join our payments team. You will design, build and operate services that move money reliably for millions of customers.
What you will do
You will own services written in Go and run them on Kubernetes. You will work closely with product managers and other engineers to plan the roadmap, and you will review code and mentor teammates.
What we are looking for
You have experience building distributed systems in production. You are comfortable with PostgreSQL and message queues, and you care about testing, observability and clear documentation.`;

describe('checkJobDescriptionProse', () => {
  it('accepts a real description', () => {
    expect(checkJobDescriptionProse(REAL).ok).toBe(true);
  });

  it('rejects short snippets', () => {
    expect(checkJobDescriptionProse('Senior Engineer – Remote – Apply now').ok).toBe(false);
  });

  it('rejects select options and labels', () => {
    const options = Array.from({ length: 40 }, (_, i) => `Option ${i} United States Canada Germany Yes No Other`).join(' ');
    expect(checkJobDescriptionProse(options).ok).toBe(false);
  });

  it('rejects navigation text', () => {
    const nav = 'Home Jobs Companies Salaries Reviews Sign In Post a Job Employers Careers About Help Privacy Terms '.repeat(6);
    expect(checkJobDescriptionProse(nav).ok).toBe(false);
  });

  it('rejects empty text', () => {
    expect(checkJobDescriptionProse('').ok).toBe(false);
  });
});
