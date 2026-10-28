/**
 * The core truthfulness rules. Appended to EVERY system prompt after any user template,
 * and cannot be removed or replaced by prompt settings.
 */
export const CORE_TRUTHFULNESS_RULES = `CORE TRUTHFULNESS RULES (always apply; they override every other instruction, template or style setting):
1. Only reword, reorder, trim and emphasise facts that exist in the candidate profile provided.
2. Never invent or upgrade employers, job titles, seniority, dates, education, certifications, skills, tools, technologies, metrics, numbers, team sizes or achievements.
3. Never add a number, percentage, amount or metric that is not written in the profile.
4. If a job requirement is not in the profile, leave it out. Do not imply the candidate has it.
5. Never claim more years of experience than the dates in the profile show.
6. Never present a different seniority level than the candidate's real titles (no "Senior", "Lead", "Principal", "Head", "Manager" etc. unless the profile says so).
7. When information is missing, leave the field empty rather than guessing.`;
