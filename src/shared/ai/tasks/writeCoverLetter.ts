import type { CoverLetterContent, JobAnalysis, JobPosting, Profile, ResumeContent } from '@/shared/types';
import { wordCount } from '@/shared/utils/text';
import { asString } from '../json';
import { COVER_LETTER_PROMPT, coverLetterUserMessage } from '../prompts/coverLetter';
import { buildTruthContext, filterSentences, passesGuards, type TruthContext } from '../truth/context';
import { mostRecentTitle } from '../truth/profileText';
import { relevantProfileSkills } from '../truth/headline';
import { runJsonTask } from './aiJson';

const DEFAULT_RECIPIENT = 'Hiring Team';
const CLOSING_RE = /^(sincerely|kind regards|best regards|warm regards|regards|best|yours (sincerely|faithfully|truly)|thank you|many thanks|respectfully|cheers)[,.!]?$/i;

/** Uses the recipient only when the posting really names them; otherwise "Hiring Team". */
export function resolveRecipient(candidate: string, job: JobPosting): string {
  const name = candidate.replace(/^dear\s+/i, '').replace(/[,:]$/, '').trim();
  if (!name || /hiring|recruit|team|manager|sir|madam|whom/i.test(name)) return DEFAULT_RECIPIENT;
  return job.description.toLowerCase().includes(name.toLowerCase()) ? name : DEFAULT_RECIPIENT;
}

/** Removes any salutation, closing or signature the model added to the body. */
export function stripLetterFrame(body: string, signerName: string): string {
  const lines = body.replace(/\r\n/g, '\n').trim().split('\n');
  while (lines.length && (/^\s*(dear|hello|hi|to whom)\b/i.test(lines[0]) || !lines[0].trim())) lines.shift();
  const name = signerName.trim().toLowerCase();
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i].trim();
    if (!l || (name && l.toLowerCase() === name) || CLOSING_RE.test(l)) {
      lines.splice(i, 1);
      continue;
    }
    break;
  }
  return lines.join('\n').trim();
}

/** Keeps only sentences that pass the truth guards against the whole profile. */
export function guardLetterBody(body: string, job: JobPosting, ctx: TruthContext): string {
  const ignorePhrases = [job.title, job.company].filter(Boolean);
  const source = `${ctx.profileText}\n${job.title}\n${job.company}`;
  return filterSentences(body, (sentence) =>
    passesGuards(sentence, ctx, { numberSource: source, seniorityAllowed: ctx.profileText, ignorePhrases }),
  );
}

function fallbackBody(job: JobPosting, profile: Profile, ctx: TruthContext): string {
  const title = mostRecentTitle(profile);
  const skills = relevantProfileSkills(profile, ctx.jobTerms).slice(0, 3);
  const role = job.title ? `the ${job.title} role` : 'this role';
  const company = job.company ? ` at ${job.company}` : '';
  return [
    `I am writing to apply for ${role}${company}.${title ? ` My most recent role is ${title}.` : ''}`,
    profile.summary.trim(),
    skills.length ? `I would bring hands-on experience with ${skills.join(', ')} to the team.` : '',
    'I would welcome the chance to discuss how my background fits your needs. Thank you for your time and consideration.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function composeLetter(recipient: string, body: string, name: string): string {
  return [`Dear ${recipient},`, body.trim(), `Kind regards,\n${name}`.trim()].join('\n\n');
}

/** Writes a cover letter body including salutation, closing and the user's name. */
export async function writeCoverLetter(
  job: JobPosting,
  analysis: JobAnalysis,
  profile: Profile,
  resume: ResumeContent,
): Promise<CoverLetterContent> {
  const name = [profile.basics.firstName, profile.basics.lastName].filter(Boolean).join(' ') || resume.name;
  const ctx = buildTruthContext(profile, job, analysis);
  const { data } = await runJsonTask('cover-letter', COVER_LETTER_PROMPT, coverLetterUserMessage(job, analysis, profile, resume), {
    temperature: 0.6,
  });
  const recipient = resolveRecipient(asString(data.recipient), job);
  const rawBody = asString(data.body) || asString(data.text) || asString(data.letter);
  let body = guardLetterBody(stripLetterFrame(rawBody, name), job, ctx);
  if (wordCount(body) < 60) body = fallbackBody(job, profile, ctx);
  return {
    text: composeLetter(recipient, body, name),
    recipient,
    company: job.company,
    role: job.title,
  };
}
