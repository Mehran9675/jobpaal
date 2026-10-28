import type { DocBlock, DocModel } from './model/types';
import { displayUrl, hrefFor } from './model/text';

/** Escapes characters with inline Markdown meaning (also neutralises raw HTML). */
export function mdEscape(text: string): string {
  return text.replace(/([\\`*_[\]<>#|])/g, '\\$1');
}

function mdLines(text: string): string {
  // Two trailing spaces keep single line breaks inside a paragraph.
  return text
    .split('\n')
    .map((line) => mdEscape(line.trim()))
    .join('  \n');
}

function block(b: DocBlock): string {
  switch (b.type) {
    case 'paragraph':
      return b.style === 'bold' ? `**${mdLines(b.text)}**` : b.style === 'muted' ? `*${mdLines(b.text)}*` : mdLines(b.text);
    case 'inline':
      return b.items.map(mdEscape).join(' · ');
    case 'skills':
      return b.groups.map((g) => `- ${g.name ? `**${mdEscape(g.name)}:** ` : ''}${g.items.map(mdEscape).join(', ')}`).join('\n');
    case 'qa':
      return `### ${mdEscape(b.question)}\n\n${mdLines(b.answer)}`;
    case 'entry': {
      const href = hrefFor(b.url);
      const title = href && b.title ? `[${mdEscape(b.title)}](${href})` : mdEscape(b.title);
      const heading = [title, mdEscape(b.subtitle)].filter(Boolean).join(' — ');
      const parts = [`### ${heading}`];
      const meta = [b.date, b.location].filter(Boolean).map(mdEscape).join(' · ');
      if (meta) parts.push(`*${meta}*`);
      if (b.text) parts.push(mdLines(b.text));
      if (b.bullets.length) parts.push(b.bullets.map((x) => `- ${mdEscape(x)}`).join('\n'));
      return parts.join('\n\n');
    }
  }
}

export function renderMarkdown(model: DocModel): string {
  const out: string[] = [];
  const { header } = model;
  if (header.name) out.push(`# ${mdEscape(header.name)}`);
  if (header.headline) out.push(`**${mdEscape(header.headline)}**`);
  const contact = [
    ...header.contact.map(mdEscape),
    ...header.links.map((l) => {
      const href = hrefFor(l.url);
      const text = mdEscape(l.label || displayUrl(l.url));
      return href ? `[${text}](${href})` : text;
    }),
  ];
  if (contact.length) out.push(contact.join(' · '));
  if (model.dateLine) out.push(mdEscape(model.dateLine));
  for (const section of model.sections) {
    if (section.title) out.push(`## ${mdEscape(section.title)}`);
    for (const b of section.blocks) out.push(block(b));
  }
  return out.join('\n\n') + '\n';
}
