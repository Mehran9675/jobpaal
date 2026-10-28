import { hrefFor } from '../model/text';
import type { DocBlock, DocEntry, DocSection } from '../model/types';
import type { PdfContext } from './context';
import { drawSkills } from './skills';
import type { Run } from './writer';

export function drawHeading(ctx: PdfContext, title: string): void {
  const { w, m, style, fonts, colors } = ctx;
  const text = style.headingUpper ? title.toUpperCase() : title;
  const font = style.headingMono ? fonts.monoBold : fonts.bold;
  const color = style.headingColor === 'accent' ? colors.accent : style.headingColor === 'gray' ? colors.gray : colors.text;
  const factor = 1.3;
  const height = m.heading * factor;
  // Keep the heading together with the first lines of the section.
  w.ensure(height + m.headingGap + m.body * m.lineFactor * 3);
  let x = w.left;
  const baseline = w.baseline(w.y, m.heading, factor);
  if (style.headingRule === 'bar') {
    w.page.drawRectangle({ x, y: baseline - m.heading * 0.12, width: 3, height: m.heading * 0.95, color: colors.accent });
    x += 9;
  }
  w.page.drawText(w.clean(text), { x, y: baseline, size: m.heading, font, color });
  w.gap(height);
  const ruleY = w.y - 1;
  if (style.headingRule === 'full') {
    w.page.drawLine({ start: { x: w.left, y: ruleY }, end: { x: w.right, y: ruleY }, thickness: 0.6, color: colors.rule });
    w.gap(2.5);
  } else if (style.headingRule === 'accent-full') {
    w.page.drawLine({ start: { x: w.left, y: ruleY }, end: { x: w.right, y: ruleY }, thickness: 1, color: colors.accent });
    w.gap(2.5);
  } else if (style.headingRule === 'accent-short') {
    w.page.drawLine({ start: { x: w.left, y: ruleY }, end: { x: w.left + 36, y: ruleY }, thickness: 2, color: colors.accent });
    w.gap(3);
  }
  w.gap(m.headingGap);
}

/** A line with left runs (wrapped) and a right-aligned note on the first line. */
function drawRow(ctx: PdfContext, left: Run[], right: string): void {
  const { w, m, fonts, colors } = ctx;
  const rightText = w.clean(right);
  const rightWidth = rightText ? w.measure(rightText, fonts.regular, m.small) : 0;
  const lines = w.layout(left, w.contentWidth - (rightWidth ? rightWidth + 10 : 0));
  const first = lines[0];
  w.ensure(first.size * m.lineFactor);
  // Left text is drawn first so text extraction (ATS parsers) reads it before the date.
  const page = w.page;
  const baseline = w.baseline(w.y, first.size, m.lineFactor);
  w.drawLines(lines, { factor: m.lineFactor });
  if (rightText) {
    page.drawText(rightText, { x: w.right - rightWidth, y: baseline, size: m.small, font: fonts.regular, color: colors.gray });
  }
}

export function drawBullets(ctx: PdfContext, bullets: string[]): void {
  const { w, m, fonts, colors, style } = ctx;
  const indent = m.body * 1.25;
  const bulletColor = style.headingColor === 'gray' ? colors.gray : colors.accent;
  bullets.forEach((bullet, index) => {
    if (index) w.gap(m.paragraphGap * 0.35);
    const lines = w.layout([{ text: bullet, font: fonts.regular, size: m.body, color: colors.text }], w.contentWidth - indent);
    w.ensure(lines[0].size * m.lineFactor);
    const baseline = w.baseline(w.y, m.body, m.lineFactor);
    w.page.drawText(w.clean(style.bullet), { x: w.left + 2, y: baseline, size: m.body, font: fonts.regular, color: bulletColor });
    w.drawLines(lines, { x: w.left + indent, width: w.contentWidth - indent, factor: m.lineFactor });
  });
}

function drawEntry(ctx: PdfContext, e: DocEntry): void {
  const { w, m, fonts, colors, style } = ctx;
  // Keep the entry title with at least its first content line.
  w.ensure(m.body * m.lineFactor * 3);
  const url = hrefFor(e.url) || undefined;
  const titleSize = m.body * 1.06;
  if (e.title) drawRow(ctx, [{ text: e.title, font: fonts.bold, size: titleSize, color: colors.text, url }], e.date);
  if (e.subtitle || e.location) {
    const subColor = style.nameAccent ? colors.accent : colors.muted;
    const runs: Run[] = e.subtitle ? [{ text: e.subtitle, font: fonts.italic, size: m.body, color: subColor }] : [];
    drawRow(ctx, runs, e.title ? e.location : [e.date, e.location].filter(Boolean).join('  ·  '));
  }
  if (e.text) {
    w.gap(m.paragraphGap * 0.4);
    w.flow([{ text: e.text, font: fonts.regular, size: m.body, color: colors.text }], { factor: m.lineFactor });
  }
  if (e.bullets.length) {
    w.gap(m.paragraphGap * 0.5);
    drawBullets(ctx, e.bullets);
  }
}

function drawBlock(ctx: PdfContext, block: DocBlock, letter: boolean): void {
  const { w, m, fonts, colors } = ctx;
  switch (block.type) {
    case 'paragraph': {
      const font = block.style === 'bold' ? fonts.bold : block.style === 'muted' ? fonts.italic : fonts.regular;
      const color = block.style === 'muted' ? colors.muted : colors.text;
      const size = letter ? m.body * 1.05 : m.body;
      w.flow([{ text: block.text, font, size, color }], { factor: letter ? m.lineFactor * 1.05 : m.lineFactor });
      return;
    }
    case 'inline':
      w.flow(
        block.items.flatMap((item, i): Run[] => [
          ...(i ? [{ text: '  ·  ', font: fonts.regular, size: m.body, color: colors.gray, atomic: true, sep: true }] : []),
          { text: item, font: fonts.regular, size: m.body, color: colors.text, atomic: true },
        ]),
        { factor: m.lineFactor },
      );
      return;
    case 'skills':
      drawSkills(ctx, block.groups);
      return;
    case 'qa':
      w.ensure(m.body * m.lineFactor * 3);
      w.flow([{ text: block.question, font: fonts.bold, size: m.body, color: colors.text }], { factor: m.lineFactor });
      w.gap(m.paragraphGap * 0.6);
      w.flow([{ text: block.answer || '—', font: fonts.regular, size: m.body, color: colors.text }], { factor: m.lineFactor });
      return;
    case 'entry':
      drawEntry(ctx, block);
  }
}

function gapBetween(ctx: PdfContext, block: DocBlock, letter: boolean): number {
  if (letter) return ctx.m.paragraphGap * 2.4 + 2;
  return block.type === 'entry' || block.type === 'qa' ? ctx.m.entryGap : ctx.m.paragraphGap;
}

export function drawSection(ctx: PdfContext, section: DocSection, letter: boolean): void {
  if (section.title) drawHeading(ctx, section.title);
  section.blocks.forEach((block, index) => {
    if (index) ctx.w.gap(gapBetween(ctx, block, letter));
    drawBlock(ctx, block, letter);
  });
}
