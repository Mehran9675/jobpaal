import type { DocBlock, DocModel } from './model/types';

function block(b: DocBlock): string {
  switch (b.type) {
    case 'paragraph':
      return b.text;
    case 'inline':
      return b.items.join(', ');
    case 'skills':
      return b.groups.map((g) => (g.name ? `${g.name}: ` : '') + g.items.join(', ')).join('\n');
    case 'qa':
      return `${b.question}\n${b.answer}`;
    case 'entry': {
      const lines = [[b.title, b.subtitle].filter(Boolean).join(', ')];
      const meta = [b.date, b.location].filter(Boolean).join(' | ');
      if (meta) lines.push(meta);
      if (b.url) lines.push(b.url);
      if (b.text) lines.push(b.text);
      for (const bullet of b.bullets) lines.push(`  - ${bullet}`);
      return lines.filter(Boolean).join('\n');
    }
  }
}

export function renderPlainText(model: DocModel): string {
  const out: string[] = [];
  const head: string[] = [];
  const { header } = model;
  if (header.name) head.push(header.name.toUpperCase());
  if (header.headline) head.push(header.headline);
  if (header.contact.length) head.push(header.contact.join(' | '));
  for (const link of header.links) head.push(link.label ? `${link.label}: ${link.url}` : link.url);
  if (head.length) out.push(head.join('\n'));
  if (model.dateLine) out.push(model.dateLine);
  for (const section of model.sections) {
    if (section.title) {
      const title = section.title.toUpperCase();
      out.push(`${title}\n${'-'.repeat(title.length)}`);
    }
    for (const b of section.blocks) out.push(block(b));
  }
  return out.join('\n\n') + '\n';
}
