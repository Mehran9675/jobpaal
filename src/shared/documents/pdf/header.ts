import { rgb } from 'pdf-lib';
import { decodeImageDataUrl, fitImage } from '../image';
import { displayUrl, hrefFor } from '../model/text';
import type { DocHeader } from '../model/types';
import type { PdfContext } from './context';
import type { Line, Run } from './writer';

const NAME_FACTOR = 1.2;
const HEADLINE_FACTOR = 1.35;
const CONTACT_FACTOR = 1.45;

function contactRuns(ctx: PdfContext, header: DocHeader, color: Run['color']): Run[] {
  const { fonts, m, style } = ctx;
  const items: Run[] = [
    ...header.contact.map((text) => ({
      text,
      url: /^[^\s@]+@[^\s@]+$/.test(text) ? `mailto:${text}` : undefined,
    })),
    ...header.links.map((l) => ({ text: displayUrl(l.url), url: hrefFor(l.url) || undefined })),
  ].map((item) => ({ ...item, font: fonts.regular, size: m.small, color, atomic: true }));
  const runs: Run[] = [];
  items.forEach((item, index) => {
    if (index) runs.push({ text: style.contactSeparator, font: fonts.regular, size: m.small, color, atomic: true, sep: true });
    runs.push(item);
  });
  return runs;
}

/** Name, headline, contact line and optional photo; executive draws an accent band. */
export async function drawHeader(ctx: PdfContext, header: DocHeader): Promise<void> {
  const { w, fonts, m, style, colors } = ctx;
  const band = style.headerBand;
  const photoInfo = header.photo ? decodeImageDataUrl(header.photo) : null;
  let photo: { draw: (x: number, y: number) => void; width: number; height: number } | null = null;
  if (photoInfo) {
    try {
      const image = photoInfo.type === 'png' ? await w.doc.embedPng(photoInfo.bytes) : await w.doc.embedJpg(photoInfo.bytes);
      const size = fitImage(photoInfo, 74 * style.sizeScale);
      photo = { ...size, draw: (x, y) => w.page.drawImage(image, { x, y, ...size }) };
    } catch {
      photo = null;
    }
  }

  const textWidth = w.contentWidth - (photo ? photo.width + 14 : 0);
  const nameColor = band ? colors.white : style.nameAccent ? colors.accent : colors.text;
  const subColor = band ? rgb(0.94, 0.95, 0.97) : colors.muted;
  const blocks: { lines: Line[]; factor: number; gapBefore: number }[] = [];
  if (header.name) {
    blocks.push({ lines: w.layout([{ text: header.name, font: fonts.bold, size: m.name, color: nameColor }], textWidth), factor: NAME_FACTOR, gapBefore: 0 });
  }
  if (header.headline) {
    const font = style.font === 'serif' ? fonts.italic : fonts.regular;
    blocks.push({ lines: w.layout([{ text: header.headline, font, size: m.headline, color: subColor }], textWidth), factor: HEADLINE_FACTOR, gapBefore: 1 });
  }
  const contact = contactRuns(ctx, header, subColor);
  if (contact.length) blocks.push({ lines: w.layout(contact, textWidth), factor: CONTACT_FACTOR, gapBefore: 4 });

  const textHeight = blocks.reduce((sum, b) => sum + b.gapBefore + w.linesHeight(b.lines, b.factor), 0);
  const innerHeight = Math.max(textHeight, photo?.height ?? 0);
  const pad = m.margin * 0.55;
  let top = w.y;
  if (band) {
    const bandHeight = innerHeight + 2 * pad;
    w.page.drawRectangle({ x: 0, y: w.pageHeight - bandHeight, width: w.pageWidth, height: bandHeight, color: colors.accent });
    top = w.pageHeight - pad;
  }
  if (photo) photo.draw(w.right - photo.width, top - photo.height);

  w.y = top - (innerHeight - textHeight) / 2;
  for (const block of blocks) {
    w.gap(block.gapBefore);
    w.drawLines(block.lines, { x: w.left, width: textWidth, factor: block.factor, align: style.headerAlign });
  }
  w.y = top - innerHeight - (band ? pad : 0) - m.sectionGap * (band ? 1 : 0.9);
}
