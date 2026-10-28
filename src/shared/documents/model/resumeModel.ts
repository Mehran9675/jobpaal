import type { DesignSettings, ResumeContent, ResumeSectionKey } from '@/shared/types';
import { formatDateRange, formatResumeDate } from '@/shared/utils/date';
import { buildHeader, personName } from './header';
import { orderedSections, SECTION_TITLES } from './sections';
import { cleanText, nonEmpty } from './text';
import type { DocBlock, DocEntry, DocModel, DocSection } from './types';

function entry(partial: Partial<DocEntry>): DocEntry {
  return {
    type: 'entry',
    title: (partial.title ?? '').trim(),
    subtitle: (partial.subtitle ?? '').trim(),
    date: (partial.date ?? '').trim(),
    location: (partial.location ?? '').trim(),
    text: cleanText(partial.text),
    bullets: nonEmpty(partial.bullets ?? []),
    url: (partial.url ?? '').trim(),
  };
}

function hasContent(e: DocEntry): boolean {
  return Boolean(e.title || e.subtitle || e.text || e.bullets.length);
}

function sectionBlocks(content: ResumeContent, key: ResumeSectionKey): DocBlock[] {
  switch (key) {
    case 'summary': {
      const text = cleanText(content.summary);
      return text ? [{ type: 'paragraph', text, style: 'normal' }] : [];
    }
    case 'skills': {
      const groups = (content.skills ?? [])
        .map((g) => ({ name: (g.name ?? '').trim(), items: nonEmpty(g.skills ?? []) }))
        .filter((g) => g.items.length);
      return groups.length ? [{ type: 'skills', groups }] : [];
    }
    case 'experience':
      return (content.experience ?? [])
        .map((e) =>
          entry({
            title: e.title,
            subtitle: e.company,
            date: formatDateRange(e.startDate ?? '', e.endDate ?? '', Boolean(e.current)),
            location: e.location,
            text: e.description,
            bullets: e.bullets,
          }),
        )
        .filter(hasContent);
    case 'education':
      return (content.education ?? [])
        .map((e) =>
          entry({
            title: nonEmpty([e.degree, e.field]).join(', ') || e.institution,
            subtitle: e.degree || e.field ? e.institution : '',
            date: formatDateRange(e.startDate ?? '', e.endDate ?? '', false),
            location: e.location,
            text: nonEmpty([e.grade ? `Grade: ${e.grade}` : '', e.description]).join('\n'),
          }),
        )
        .filter(hasContent);
    case 'certifications':
      return (content.certifications ?? [])
        .map((c) => entry({ title: c.name, subtitle: c.issuer, date: formatResumeDate(c.date ?? '') }))
        .filter(hasContent);
    case 'languages': {
      const items = (content.languages ?? [])
        .filter((l) => (l.language ?? '').trim())
        .map((l) => (l.fluency?.trim() ? `${l.language.trim()} (${l.fluency.trim()})` : l.language.trim()));
      return items.length ? [{ type: 'inline', items }] : [];
    }
    case 'projects':
      return (content.projects ?? [])
        .map((p) =>
          entry({ title: p.name, subtitle: p.role, text: p.description, bullets: p.bullets, url: p.url }),
        )
        .filter(hasContent);
    case 'awards':
      return (content.awards ?? [])
        .map((a) =>
          entry({ title: a.title, subtitle: a.issuer, date: formatResumeDate(a.date ?? ''), text: a.description }),
        )
        .filter(hasContent);
    default:
      return [];
  }
}

export function buildResumeModel(content: ResumeContent, design: DesignSettings): DocModel {
  const sections: DocSection[] = [];
  for (const key of orderedSections(content, design)) {
    const blocks = sectionBlocks(content, key);
    if (blocks.length) sections.push({ key, title: SECTION_TITLES[key], blocks });
  }
  const name = personName(content);
  return {
    kind: 'resume',
    title: name ? `${name} – Resume` : 'Resume',
    header: buildHeader(content, { photo: Boolean(design.showPhoto), headline: true }),
    dateLine: '',
    sections,
  };
}
