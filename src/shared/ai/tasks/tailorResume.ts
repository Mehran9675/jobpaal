import { buildBaseResume } from '@/shared/resume/baseResume';
import {
  ALL_RESUME_SECTIONS,
  type JobAnalysis,
  type JobPosting,
  type Profile,
  type ResumeContent,
  type ResumeSectionKey,
} from '@/shared/types';
import { normalizeForCompare } from '@/shared/utils/text';
import { asArray, asObject, asString, asStringArray } from '../json';
import { TAILOR_PROMPT, tailorUserMessage } from '../prompts/tailor';
import { guardBullets } from '../truth/bullets';
import { buildTruthContext, passesGuards, type TruthContext } from '../truth/context';
import { guardHeadline } from '../truth/headline';
import { experienceSourceText, projectSourceText } from '../truth/profileText';
import { guardSummary } from '../truth/summary';
import { runJsonTask } from './aiJson';

export interface TailoringPlan {
  headline: string;
  summary: string;
  skillGroupOrder: string[];
  prioritySkills: string[];
  experience: Map<string, string[]>;
  projects: Map<string, string[]>;
  sectionOrder: string[];
}

function bulletMap(value: unknown): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const item of asArray(value)) {
    const obj = asObject(item);
    const id = asString(obj.sourceId ?? obj.id);
    if (id && !map.has(id)) map.set(id, asStringArray(obj.bullets, 20));
  }
  return map;
}

export function parseTailoringPlan(data: Record<string, unknown>): TailoringPlan {
  return {
    headline: asString(data.headline),
    summary: asString(data.summary),
    skillGroupOrder: asStringArray(data.skillGroupOrder, 30),
    prioritySkills: asStringArray(data.prioritySkills, 60),
    experience: bulletMap(data.experience),
    projects: bulletMap(data.projects),
    sectionOrder: asStringArray(data.sectionOrder, 20),
  };
}

const rank = (list: string[], value: string): number => {
  const i = list.findIndex((item) => normalizeForCompare(item) === normalizeForCompare(value));
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
};

/** Reorders existing skill groups and skills. Never adds or renames anything. */
export function orderSkills(
  groups: ResumeContent['skills'],
  groupOrder: string[],
  prioritySkills: string[],
): ResumeContent['skills'] {
  const sortStable = <T>(items: T[], key: (item: T) => number): T[] =>
    items.map((item, i) => ({ item, i })).sort((a, b) => key(a.item) - key(b.item) || a.i - b.i).map((x) => x.item);
  const reordered = groups.map((g) => ({ name: g.name, skills: sortStable(g.skills, (s) => rank(prioritySkills, s)) }));
  const groupRank = (g: { name: string; skills: string[] }): number => {
    const explicit = rank(groupOrder, g.name);
    if (explicit !== Number.MAX_SAFE_INTEGER) return explicit;
    const best = Math.min(...g.skills.map((s) => rank(prioritySkills, s)));
    return 1000 + (Number.isFinite(best) ? Math.min(best, 10_000) : 10_000);
  };
  return sortStable(reordered, groupRank);
}

/** A valid permutation of all resume sections: the plan's order first, any missing sections appended. */
export function normalizeSectionOrder(order: string[]): ResumeSectionKey[] {
  const out: ResumeSectionKey[] = [];
  for (const key of order.map((k) => k.toLowerCase().trim())) {
    if ((ALL_RESUME_SECTIONS as string[]).includes(key) && !out.includes(key as ResumeSectionKey)) out.push(key as ResumeSectionKey);
  }
  for (const key of ALL_RESUME_SECTIONS) if (!out.includes(key)) out.push(key);
  return out;
}

/**
 * Composes the tailored resume from base facts plus the AI plan. Every piece of AI text passes
 * the truth guards; facts (names, contact, titles, companies, dates, education...) always come from the base.
 */
export function composeTailoredResume(
  profile: Profile,
  job: JobPosting | null,
  plan: TailoringPlan,
  ctx: TruthContext = buildTruthContext(profile, job),
): ResumeContent {
  const base = buildBaseResume(profile);
  const experienceById = new Map(profile.experience.map((e) => [e.id, e]));
  const projectById = new Map(profile.projects.map((p) => [p.id, p]));

  const experience = base.experience.map((entry) => {
    const source = experienceById.get(entry.sourceId);
    const rewritten = plan.experience.get(entry.sourceId);
    if (!source || !rewritten) return entry;
    const sourceText = experienceSourceText(source);
    const bullets = guardBullets(rewritten, source, (b) =>
      passesGuards(b, ctx, { numberSource: sourceText, seniorityAllowed: ctx.profileText }),
    );
    return { ...entry, bullets };
  });

  const projects = base.projects.map((entry) => {
    const source = projectById.get(entry.sourceId);
    const rewritten = plan.projects.get(entry.sourceId);
    if (!source || !rewritten) return entry;
    const sourceText = projectSourceText(source);
    const bullets = guardBullets(rewritten, source, (b) =>
      passesGuards(b, ctx, { numberSource: sourceText, seniorityAllowed: ctx.profileText }),
    );
    return { ...entry, bullets };
  });

  return {
    ...base,
    headline: guardHeadline(plan.headline, profile, job, ctx) || base.headline,
    summary: guardSummary(plan.summary, profile, ctx),
    skills: orderSkills(base.skills, plan.skillGroupOrder, plan.prioritySkills),
    experience,
    projects,
    sectionOrder: normalizeSectionOrder(plan.sectionOrder),
  };
}

/** Rewrites the resume for the posting: reorders, rewords and emphasises real facts only. */
export async function tailorResume(job: JobPosting, analysis: JobAnalysis, profile: Profile): Promise<ResumeContent> {
  const { data } = await runJsonTask('tailor', TAILOR_PROMPT, tailorUserMessage(job, analysis, profile), { temperature: 0.4 });
  const plan = parseTailoringPlan(data);
  return composeTailoredResume(profile, job, plan, buildTruthContext(profile, job, analysis));
}
