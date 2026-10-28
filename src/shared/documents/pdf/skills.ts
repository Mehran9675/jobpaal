import type { PdfContext } from './context';
import type { Run } from './writer';

type Group = { name: string; items: string[] };

function groupRuns(ctx: PdfContext, group: Group): Run[] {
  const { fonts, m, colors } = ctx;
  const runs: Run[] = [];
  if (group.name) runs.push({ text: `${group.name}: `, font: fonts.bold, size: m.body, color: colors.text });
  runs.push({ text: group.items.join(', '), font: fonts.regular, size: m.body, color: colors.text });
  return runs;
}

function drawSkillLines(ctx: PdfContext, groups: Group[]): void {
  const { w, m } = ctx;
  groups.forEach((group, index) => {
    if (index) w.gap(m.paragraphGap * 0.6);
    w.flow(groupRuns(ctx, group), { factor: m.lineFactor });
  });
}

/** Two groups per row, side by side. */
function drawSkillColumns(ctx: PdfContext, groups: Group[]): void {
  const { w, m } = ctx;
  const gutter = 16;
  const colWidth = (w.contentWidth - gutter) / 2;
  const maxHeight = w.pageHeight - w.margins.top - w.bottom;
  for (let i = 0; i < groups.length; i += 2) {
    if (i) w.gap(m.paragraphGap * 0.6);
    const cells = groups.slice(i, i + 2).map((g) => w.layout(groupRuns(ctx, g), colWidth));
    const height = Math.max(...cells.map((lines) => w.linesHeight(lines, m.lineFactor)));
    if (height > maxHeight) {
      cells.forEach((lines) => w.drawLines(lines, { factor: m.lineFactor }));
      continue;
    }
    w.ensure(height);
    const top = w.y;
    cells.forEach((lines, col) => {
      w.y = top;
      w.drawLines(lines, { x: w.left + col * (colWidth + gutter), width: colWidth, factor: m.lineFactor });
    });
    w.y = top - height;
  }
}

/** Group label followed by monospace chips with a tinted background. */
function drawSkillChips(ctx: PdfContext, groups: Group[]): void {
  const { w, m, fonts, colors } = ctx;
  const size = m.small;
  const padX = 4;
  const chipHeight = size * 1.6;
  const gapX = 4;
  const gapY = 3.5;
  groups.forEach((group, index) => {
    if (index) w.gap(m.paragraphGap);
    if (group.name) {
      w.ensure(m.small * m.lineFactor + chipHeight);
      w.flow([{ text: group.name, font: fonts.bold, size: m.small, color: colors.muted }], { factor: m.lineFactor });
      w.gap(1.5);
    }
    let x = w.left;
    w.ensure(chipHeight);
    for (const item of group.items) {
      const text = w.clean(item);
      if (!text.trim()) continue;
      const width = Math.min(w.measure(text, fonts.mono, size) + 2 * padX, w.contentWidth);
      if (x > w.left && x + width > w.right) {
        w.gap(chipHeight + gapY);
        x = w.left;
        w.ensure(chipHeight);
      }
      w.page.drawRectangle({ x, y: w.y - chipHeight, width, height: chipHeight, color: colors.accent, opacity: 0.12 });
      w.page.drawText(text, { x: x + padX, y: w.y - chipHeight + (chipHeight - size) / 2 + size * 0.2, size, font: fonts.mono, color: colors.text });
      x += width + gapX;
    }
    w.gap(chipHeight);
  });
}

export function drawSkills(ctx: PdfContext, groups: Group[]): void {
  if (ctx.style.skills === 'chips') drawSkillChips(ctx, groups);
  else if (ctx.style.skills === 'columns') drawSkillColumns(ctx, groups);
  else drawSkillLines(ctx, groups);
}
