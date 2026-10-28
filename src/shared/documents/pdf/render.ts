import { PDFDocument } from 'pdf-lib';
import type { DesignSettings } from '@/shared/types';
import type { DocModel } from '../model/types';
import { metricsFor, PAGE_SIZES, templateStyle } from '../styles';
import { drawSection } from './blocks';
import { palette, type PdfContext } from './context';
import { loadFonts } from './fonts';
import { drawHeader } from './header';
import { PdfWriter } from './writer';

function drawPageNumbers(ctx: PdfContext, name: string): void {
  const { w, fonts, m, colors } = ctx;
  const total = w.pages.length;
  if (total < 2) return;
  w.pages.forEach((page, index) => {
    const label = w.clean(`${name ? `${name}  ·  ` : ''}${index + 1} / ${total}`);
    const size = m.small * 0.9;
    const width = w.measure(label, fonts.regular, size);
    page.drawText(label, { x: w.right - width, y: Math.max(14, w.bottom / 2 - size / 2), size, font: fonts.regular, color: colors.gray });
  });
}

/** Renders a document model to PDF bytes with pdf-lib (no DOM required). */
export async function renderPdf(model: DocModel, design: DesignSettings): Promise<Uint8Array> {
  const style = templateStyle(design.template);
  const m = metricsFor(design.density, style);
  const size = PAGE_SIZES[design.pageSize] ?? PAGE_SIZES.A4;
  const doc = await PDFDocument.create();
  const fonts = await loadFonts(doc, style.font, design.customFont);
  const w = new PdfWriter(doc, fonts, size.width, size.height, { x: m.margin, top: m.margin * 0.9, bottom: m.margin });
  const ctx: PdfContext = { w, fonts, style, m, colors: palette(design.accent) };

  await drawHeader(ctx, model.header);
  const letter = model.kind === 'cover-letter';
  if (model.dateLine) {
    w.flow([{ text: model.dateLine, font: fonts.regular, size: m.body, color: ctx.colors.muted }], { factor: m.lineFactor });
    w.gap(m.sectionGap);
  }
  model.sections.forEach((section, index) => {
    if (index) w.gap(m.sectionGap);
    drawSection(ctx, section, letter);
  });
  drawPageNumbers(ctx, model.header.name);

  doc.setTitle(model.title, { showInWindowTitleBar: true });
  if (model.header.name) doc.setAuthor(model.header.name);
  doc.setProducer('JobPaal');
  doc.setCreator('JobPaal');
  doc.setSubject(model.kind === 'resume' ? 'Resume' : model.kind === 'cover-letter' ? 'Cover letter' : 'Application answers');
  return doc.save();
}
