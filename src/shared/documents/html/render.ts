import type { DesignSettings } from '@/shared/types';
import type { DocBlock, DocModel } from '../model/types';
import { displayUrl, hrefFor } from '../model/text';
import { templateStyle } from '../styles';
import { escapeHtml, escapeLines } from './escape';
import { buildCss } from './styles';

function link(text: string, url: string): string {
  const href = hrefFor(url);
  return href ? `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>` : escapeHtml(text);
}

function skillsHtml(groups: { name: string; items: string[] }[], chips: boolean): string {
  const rows = groups.map((g) => {
    const name = g.name ? `<span class="skill-name">${escapeHtml(g.name)}:</span> ` : '';
    const items = chips
      ? `<span class="skill-items">${g.items.map((i) => `<span>${escapeHtml(i)}</span>`).join('')}</span>`
      : escapeHtml(g.items.join(', '));
    return `<div class="skill-group">${name}${items}</div>`;
  });
  return `<div class="skills">${rows.join('')}</div>`;
}

function blockHtml(b: DocBlock, design: DesignSettings): string {
  switch (b.type) {
    case 'paragraph': {
      const inner = escapeLines(b.text);
      return `<p>${b.style === 'bold' ? `<strong>${inner}</strong>` : b.style === 'muted' ? `<em>${inner}</em>` : inner}</p>`;
    }
    case 'inline':
      return `<p>${b.items.map(escapeHtml).join(' &middot; ')}</p>`;
    case 'skills':
      return skillsHtml(b.groups, templateStyle(design.template).skills === 'chips');
    case 'qa':
      return `<div class="qa"><div class="q">${escapeLines(b.question)}</div><div class="a">${escapeLines(b.answer)}</div></div>`;
    case 'entry': {
      const title = b.url ? link(b.title || displayUrl(b.url), b.url) : escapeHtml(b.title);
      const rows = [
        `<div class="row"><span class="entry-title">${title}</span><span class="right">${escapeHtml(b.date)}</span></div>`,
      ];
      if (b.subtitle || b.location) {
        rows.push(
          `<div class="row"><span class="entry-sub">${escapeHtml(b.subtitle)}</span><span class="right">${escapeHtml(b.location)}</span></div>`,
        );
      }
      if (b.text) rows.push(`<p>${escapeLines(b.text)}</p>`);
      if (b.bullets.length) rows.push(`<ul>${b.bullets.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`);
      return `<div class="entry">${rows.join('')}</div>`;
    }
  }
}

function headerHtml(model: DocModel, design: DesignSettings): string {
  const { header } = model;
  const sep = `<span class="sep">${escapeHtml(templateStyle(design.template).contactSeparator)}</span>`;
  const contact = [
    ...header.contact.map((c) => (c.includes('@') && !c.includes(' ') ? link(c, `mailto:${c}`) : escapeHtml(c))),
    ...header.links.map((l) => link(displayUrl(l.url), l.url)),
  ].join(sep);
  const photo = header.photo ? `<img class="photo" src="${escapeHtml(header.photo)}" alt="">` : '';
  return `<header class="doc-header">${photo}<div class="who">${header.name ? `<h1 class="name">${escapeHtml(header.name)}</h1>` : ''}${
    header.headline ? `<div class="headline">${escapeHtml(header.headline)}</div>` : ''
  }${contact ? `<div class="contact">${contact}</div>` : ''}</div></header>`;
}

/** Standalone HTML document (inline CSS, print-ready) for a document model. */
export function renderHtmlDocument(model: DocModel, design: DesignSettings): string {
  const sections = model.sections
    .map((s) => {
      const heading = s.title ? `<h2>${escapeHtml(s.title)}</h2>` : '';
      const cls = `sec sec-${escapeHtml(s.key)}${model.kind === 'cover-letter' ? ' letter' : ''}`;
      return `<section class="${cls}">${heading}${s.blocks.map((b) => blockHtml(b, design)).join('')}</section>`;
    })
    .join('\n');
  const dateLine = model.dateLine ? `<div class="date-line">${escapeHtml(model.dateLine)}</div>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="JobPaal">
<title>${escapeHtml(model.title)}</title>
<style>${buildCss(design)}</style>
</head>
<body class="tpl-${escapeHtml(design.template)} density-${escapeHtml(design.density)} kind-${model.kind}">
<main class="page">
${headerHtml(model, design)}
${dateLine}
${sections}
</main>
</body>
</html>
`;
}
