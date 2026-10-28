import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  type ParagraphChild,
  ShadingType,
  Tab,
  TabStopType,
  TextRun,
} from 'docx';
import type { DesignSettings } from '@/shared/types';
import { GRAY_HEX, hexNoHash, MUTED_HEX, RULE_HEX, TEXT_HEX } from '../color';
import { decodeImageDataUrl, fitImage } from '../image';
import { displayUrl, hrefFor } from '../model/text';
import type { DocBlock, DocEntry, DocHeader, DocModel } from '../model/types';
import { type Metrics, metricsFor, PAGE_SIZES, type TemplateStyle, templateStyle } from '../styles';
import { hyperlink, textRuns } from './runs';

const BULLETS = 'jobpaal-bullets';
const twips = (pt: number) => Math.round(pt * 20);

interface DocxContext {
  style: TemplateStyle;
  m: Metrics;
  accent: string;
  font: string;
  mono: string;
  /** Right tab stop at the content edge, in twips. */
  rightTab: number;
}

const hex = (value: string) => hexNoHash(value);

function spacing(m: Metrics, afterPt: number, factor = m.lineFactor) {
  return { after: twips(afterPt), line: Math.round(240 * factor * 0.86) };
}

function headerParagraphs(ctx: DocxContext, header: DocHeader): Paragraph[] {
  const { style, m, accent } = ctx;
  const band = style.headerBand;
  const alignment = style.headerAlign === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT;
  const shading = band ? { type: ShadingType.CLEAR, fill: hex(accent), color: 'auto' } : undefined;
  const main = band ? 'FFFFFF' : style.nameAccent ? hex(accent) : hex(TEXT_HEX);
  const sub = band ? 'F1F3F6' : hex(MUTED_HEX);
  const out: Paragraph[] = [];

  const photo = header.photo ? decodeImageDataUrl(header.photo) : null;
  if (photo) {
    const size = fitImage(photo, 96);
    out.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        shading,
        children: [
          new ImageRun({ type: photo.type, data: photo.bytes, transformation: { width: Math.round(size.width), height: Math.round(size.height) } }),
        ],
      }),
    );
  }
  if (header.name) {
    out.push(
      new Paragraph({ alignment, shading, spacing: { after: twips(2) }, children: textRuns(header.name, { bold: true, size: m.name, color: main }) }),
    );
  }
  if (header.headline) {
    out.push(
      new Paragraph({
        alignment,
        shading,
        spacing: { after: twips(3) },
        children: textRuns(header.headline, { size: m.headline, color: sub, italics: style.font === 'serif' }),
      }),
    );
  }
  const items: ParagraphChild[][] = [
    ...header.contact.map((c) =>
      /^[^\s@]+@[^\s@]+$/.test(c) ? [hyperlink(c, `mailto:${c}`, { size: m.small, color: sub })] : textRuns(c, { size: m.small, color: sub }),
    ),
    ...header.links.map((l) => {
      const href = hrefFor(l.url);
      const text = displayUrl(l.url);
      return href ? [hyperlink(text, href, { size: m.small, color: sub })] : textRuns(text, { size: m.small, color: sub });
    }),
  ];
  if (items.length) {
    const children: ParagraphChild[] = [];
    items.forEach((item, index) => {
      if (index) children.push(...textRuns(style.contactSeparator, { size: m.small, color: sub }));
      children.push(...item);
    });
    out.push(new Paragraph({ alignment, shading, children }));
  }
  if (out.length) out.push(new Paragraph({ spacing: { after: twips(m.sectionGap * 0.5) }, children: [] }));
  return out;
}

function headingParagraph(ctx: DocxContext, title: string): Paragraph {
  const { style, m, accent } = ctx;
  const color = style.headingColor === 'accent' ? hex(accent) : style.headingColor === 'gray' ? hex(GRAY_HEX) : hex(TEXT_HEX);
  const border =
    style.headingRule === 'full'
      ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: hex(RULE_HEX), space: 1 } }
      : style.headingRule === 'accent-full' || style.headingRule === 'accent-short'
        ? { bottom: { style: BorderStyle.SINGLE, size: style.headingRule === 'accent-short' ? 12 : 8, color: hex(accent), space: 1 } }
        : style.headingRule === 'bar'
          ? { left: { style: BorderStyle.SINGLE, size: 24, color: hex(accent), space: 6 } }
          : undefined;
  return new Paragraph({
    keepNext: true,
    border,
    spacing: { before: twips(m.sectionGap), after: twips(m.headingGap) },
    children: textRuns(title, {
      bold: true,
      color,
      size: m.heading,
      allCaps: style.headingUpper,
      font: style.headingMono ? ctx.mono : undefined,
    }),
  });
}

function rowParagraph(ctx: DocxContext, left: ParagraphChild[], right: string, keepNext = true): Paragraph {
  const children = [...left];
  if (right) children.push(new TextRun({ children: [new Tab(), right], size: Math.round(ctx.m.small * 2), color: hex(GRAY_HEX) }));
  return new Paragraph({
    keepNext,
    tabStops: [{ type: TabStopType.RIGHT, position: ctx.rightTab }],
    spacing: spacing(ctx.m, 0),
    children,
  });
}

function entryParagraphs(ctx: DocxContext, e: DocEntry): Paragraph[] {
  const { m, style, accent } = ctx;
  const out: Paragraph[] = [];
  const href = hrefFor(e.url);
  if (e.title) {
    const title = href ? [hyperlink(e.title, href, { bold: true, size: m.body * 1.06 })] : textRuns(e.title, { bold: true, size: m.body * 1.06 });
    out.push(rowParagraph(ctx, title, e.date));
  }
  if (e.subtitle || e.location) {
    const color = style.nameAccent ? hex(accent) : hex(MUTED_HEX);
    out.push(rowParagraph(ctx, textRuns(e.subtitle, { italics: true, color }), e.title ? e.location : [e.date, e.location].filter(Boolean).join(' · ')));
  }
  if (e.text) out.push(new Paragraph({ spacing: spacing(m, m.paragraphGap * 0.5), children: textRuns(e.text) }));
  for (const bullet of e.bullets) {
    out.push(new Paragraph({ numbering: { reference: BULLETS, level: 0 }, spacing: spacing(m, m.paragraphGap * 0.4), children: textRuns(bullet) }));
  }
  out.push(new Paragraph({ spacing: { after: twips(m.entryGap * 0.6), line: 120 }, children: [] }));
  return out;
}

function blockParagraphs(ctx: DocxContext, block: DocBlock, letter: boolean): Paragraph[] {
  const { m, style } = ctx;
  switch (block.type) {
    case 'paragraph':
      return [
        new Paragraph({
          spacing: spacing(m, letter ? m.paragraphGap * 2.4 : m.paragraphGap),
          children: textRuns(block.text, { bold: block.style === 'bold', italics: block.style === 'muted', color: block.style === 'muted' ? hex(MUTED_HEX) : undefined }),
        }),
      ];
    case 'inline':
      return [new Paragraph({ spacing: spacing(m, m.paragraphGap), children: textRuns(block.items.join('  ·  ')) })];
    case 'skills':
      return block.groups.map(
        (g) =>
          new Paragraph({
            spacing: spacing(m, m.paragraphGap * 0.6),
            children: [
              ...(g.name ? textRuns(`${g.name}: `, { bold: true }) : []),
              ...textRuns(g.items.join(style.skills === 'chips' ? '  ' : ', '), { font: style.skills === 'chips' ? ctx.mono : undefined, size: style.skills === 'chips' ? m.small : undefined }),
            ],
          }),
      );
    case 'qa':
      return [
        new Paragraph({ keepNext: true, spacing: spacing(m, m.paragraphGap * 0.6), children: textRuns(block.question, { bold: true }) }),
        new Paragraph({ spacing: spacing(m, m.entryGap), children: textRuns(block.answer || '—') }),
      ];
    case 'entry':
      return entryParagraphs(ctx, block);
  }
}

/** Renders a document model to DOCX bytes. */
export async function renderDocx(model: DocModel, design: DesignSettings): Promise<Uint8Array> {
  const style = templateStyle(design.template);
  const m = metricsFor(design.density, style);
  const page = PAGE_SIZES[design.pageSize] ?? PAGE_SIZES.A4;
  const font = design.customFont?.name?.trim() || (style.font === 'serif' ? 'Times New Roman' : 'Calibri');
  const ctx: DocxContext = {
    style,
    m,
    accent: design.accent,
    font,
    mono: design.customFont?.name?.trim() || 'Consolas',
    rightTab: twips(page.width - 2 * m.margin),
  };
  const letter = model.kind === 'cover-letter';
  const children: Paragraph[] = [...headerParagraphs(ctx, model.header)];
  if (model.dateLine) {
    children.push(new Paragraph({ spacing: { after: twips(m.sectionGap) }, children: textRuns(model.dateLine, { color: hex(MUTED_HEX) }) }));
  }
  for (const section of model.sections) {
    if (section.title) children.push(headingParagraph(ctx, section.title));
    for (const block of section.blocks) children.push(...blockParagraphs(ctx, block, letter));
  }

  const doc = new Document({
    title: model.title,
    creator: 'JobPaal',
    description: model.title,
    styles: {
      default: {
        document: { run: { font, size: Math.round(m.body * 2), color: hex(TEXT_HEX) } },
      },
    },
    numbering: {
      config: [
        {
          reference: BULLETS,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: style.bullet,
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: twips(m.body * 1.4), hanging: twips(m.body * 1.1) } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: twips(page.width), height: twips(page.height) },
            margin: { top: twips(m.margin * 0.9), bottom: twips(m.margin), left: twips(m.margin), right: twips(m.margin) },
          },
        },
        children,
      },
    ],
  });
  return Packer.pack(doc, 'uint8array');
}
