import type { ResumeContent } from '@/shared/types';
import { personName } from './model/header';
import { nonEmpty } from './model/text';

const NETWORKS: { pattern: RegExp; network: string }[] = [
  { pattern: /linkedin\.com/i, network: 'LinkedIn' },
  { pattern: /github\.com/i, network: 'GitHub' },
  { pattern: /gitlab\.com/i, network: 'GitLab' },
  { pattern: /(twitter\.com|(^|\/\/|\.)x\.com)/i, network: 'Twitter' },
  { pattern: /stackoverflow\.com/i, network: 'Stack Overflow' },
  { pattern: /dribbble\.com/i, network: 'Dribbble' },
  { pattern: /behance\.net/i, network: 'Behance' },
  { pattern: /medium\.com/i, network: 'Medium' },
  { pattern: /mastodon|fosstodon/i, network: 'Mastodon' },
];

function networkFor(url: string): string {
  return NETWORKS.find((n) => n.pattern.test(url))?.network ?? '';
}

function usernameFrom(url: string): string {
  try {
    const parsed = new URL(/^[a-z]+:\/\//i.test(url) ? url : `https://${url}`);
    const parts = parsed.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] ?? '';
  } catch {
    return '';
  }
}

function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(obj) as [keyof T, unknown][]) {
    if (value === '' || value === undefined || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value as T[keyof T];
  }
  return out;
}

/** Converts resume content to the JSON Resume schema (https://jsonresume.org/schema). */
export function resumeToJsonResume(content: ResumeContent): Record<string, unknown> {
  const contact = content.contact ?? { email: '', phone: '', location: '', links: [] };
  const links = (contact.links ?? []).filter((l) => (l.url ?? '').trim());
  const profiles = links
    .map((l) => ({ link: l, network: networkFor(l.url) }))
    .filter((p) => p.network)
    .map(({ link, network }) => ({ network, username: usernameFrom(link.url), url: link.url.trim() }));
  const website = links.find((l) => !networkFor(l.url));
  const locationParts = nonEmpty((contact.location ?? '').split(','));

  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: compact({
      name: personName(content),
      label: content.headline ?? '',
      image: content.photo ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      url: website?.url.trim() ?? '',
      summary: content.summary ?? '',
      location: locationParts.length
        ? compact({
            address: contact.location.trim(),
            city: locationParts[0] ?? '',
            region: locationParts.slice(1).join(', '),
          })
        : undefined,
      profiles,
    }),
    work: (content.experience ?? []).map((e) =>
      compact({
        name: e.company,
        position: e.title,
        location: e.location,
        startDate: e.startDate,
        endDate: e.current ? '' : e.endDate,
        summary: e.description,
        highlights: nonEmpty(e.bullets ?? []),
      }),
    ),
    education: (content.education ?? []).map((e) =>
      compact({
        institution: e.institution,
        area: e.field,
        studyType: e.degree,
        startDate: e.startDate,
        endDate: e.endDate,
        score: e.grade,
      }),
    ),
    skills: (content.skills ?? [])
      .filter((g) => nonEmpty(g.skills ?? []).length)
      .map((g) => compact({ name: g.name, keywords: nonEmpty(g.skills) })),
    languages: (content.languages ?? []).map((l) => compact({ language: l.language, fluency: l.fluency })),
    projects: (content.projects ?? []).map((p) =>
      compact({
        name: p.name,
        description: p.description,
        highlights: nonEmpty(p.bullets ?? []),
        url: p.url,
        roles: nonEmpty([p.role]),
      }),
    ),
    awards: (content.awards ?? []).map((a) =>
      compact({ title: a.title, date: a.date, awarder: a.issuer, summary: a.description }),
    ),
    certificates: (content.certifications ?? []).map((c) => compact({ name: c.name, date: c.date, issuer: c.issuer })),
    meta: { generator: 'JobPaal' },
  };
}
