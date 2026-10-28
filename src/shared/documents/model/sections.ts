import { ALL_RESUME_SECTIONS, type DesignSettings, type ResumeContent, type ResumeSectionKey } from '@/shared/types';

export const SECTION_TITLES: Record<ResumeSectionKey, string> = {
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  certifications: 'Certifications',
  languages: 'Languages',
  projects: 'Projects',
  awards: 'Awards',
};

/**
 * Section keys in render order: design.sectionOrder (or the content's suggested order when the
 * design has none), unknown/duplicate keys dropped, missing keys appended, hidden keys removed.
 */
export function orderedSections(content: ResumeContent, design: DesignSettings): ResumeSectionKey[] {
  const preferred = design.sectionOrder?.length ? design.sectionOrder : content.sectionOrder ?? [];
  const order: ResumeSectionKey[] = [];
  for (const key of [...preferred, ...ALL_RESUME_SECTIONS]) {
    if (ALL_RESUME_SECTIONS.includes(key) && !order.includes(key)) order.push(key);
  }
  const hidden = new Set(design.hiddenSections ?? []);
  return order.filter((key) => !hidden.has(key));
}
