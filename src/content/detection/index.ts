/** Page reading: job boards / ATS adapters, structured data, generic reader. Runs in content scripts (any frame). */
export type { JobDetectionResult, KnownSite } from './types';
export { detectJob } from './detect';
export { identifySite } from './identify';
