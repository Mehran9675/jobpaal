import { type PDFDocument, type PDFFont, type PDFPage, PDFString, type RGB } from 'pdf-lib';
import type { PdfFonts } from './fonts';
import { stripControl, toWinAnsi } from './winAnsi';

/** A styled piece of text. */
export interface Run {
  text: string;
  font: PDFFont;
  size: number;
  color: RGB;
  url?: string;
  /** Kept on one line (never split at spaces). */
  atomic?: boolean;
  /** Separator: dropped at the start or end of a line. */
  sep?: boolean;
}

interface Token {
  text: string;
  run: Run;
  width: number;
  kind: 'word' | 'space' | 'newline';
}

export interface Line {
  items: { text: string; run: Run; width: number }[];
  width: number;
  size: number;
}

export interface Margins {
  x: number;
  top: number;
  bottom: number;
}

/** Text layout on top of pdf-lib: wrapping, alignment, page breaks and link annotations. */
export class PdfWriter {
  page: PDFPage;
  y: number;
  readonly pages: PDFPage[] = [];

  constructor(
    readonly doc: PDFDocument,
    readonly fonts: PdfFonts,
    readonly pageWidth: number,
    readonly pageHeight: number,
    readonly margins: Margins,
  ) {
    this.page = this.addPage();
    this.y = pageHeight - margins.top;
  }

  get left(): number {
    return this.margins.x;
  }

  get right(): number {
    return this.pageWidth - this.margins.x;
  }

  get contentWidth(): number {
    return this.pageWidth - 2 * this.margins.x;
  }

  get bottom(): number {
    return this.margins.bottom;
  }

  /** Text safe for the active fonts. */
  clean(text: string): string {
    return this.fonts.standard ? toWinAnsi(text) : stripControl(text);
  }

  measure(text: string, font: PDFFont, size: number): number {
    return font.widthOfTextAtSize(text, size);
  }

  addPage(): PDFPage {
    this.page = this.doc.addPage([this.pageWidth, this.pageHeight]);
    this.pages.push(this.page);
    this.y = this.pageHeight - this.margins.top;
    return this.page;
  }

  /** Starts a new page when less than `height` remains. */
  ensure(height: number): void {
    if (this.y - height < this.bottom && this.y < this.pageHeight - this.margins.top - 0.5) this.addPage();
  }

  gap(height: number): void {
    this.y -= height;
  }

  lineHeight(size: number, factor: number): number {
    return size * factor;
  }

  /** Baseline of a line whose top is `top`. */
  baseline(top: number, size: number, factor: number): number {
    return top - (size * factor - size) / 2 - size * 0.8;
  }

  private tokenize(runs: Run[]): Token[] {
    const tokens: Token[] = [];
    for (const run of runs) {
      const text = this.clean(run.text);
      if (!text) continue;
      if (run.atomic) {
        const single = run.sep ? text.replace(/\n/g, ' ') : text.replace(/\s+/g, ' ');
        tokens.push({ text: single, run, width: this.measure(single, run.font, run.size), kind: 'word' });
        continue;
      }
      for (const part of text.split(/(\n| +)/)) {
        if (!part) continue;
        if (part === '\n') tokens.push({ text: '', run, width: 0, kind: 'newline' });
        else if (part.startsWith(' ')) tokens.push({ text: ' ', run, width: this.measure(' ', run.font, run.size), kind: 'space' });
        else tokens.push({ text: part, run, width: this.measure(part, run.font, run.size), kind: 'word' });
      }
    }
    return tokens;
  }

  /** Splits an over-long word into pieces no wider than maxWidth. */
  private splitWord(token: Token, maxWidth: number): Token[] {
    const pieces: Token[] = [];
    let current = '';
    for (const ch of token.text) {
      const next = current + ch;
      if (current && this.measure(next, token.run.font, token.run.size) > maxWidth) {
        pieces.push({ ...token, text: current, width: this.measure(current, token.run.font, token.run.size) });
        current = ch;
      } else current = next;
    }
    if (current) pieces.push({ ...token, text: current, width: this.measure(current, token.run.font, token.run.size) });
    return pieces;
  }

  /** Word-wraps runs into lines of at most maxWidth. */
  layout(runs: Run[], maxWidth: number): Line[] {
    const lines: Line[] = [];
    const fallbackSize = runs[0]?.size ?? 10;
    let items: Line['items'] = [];
    let width = 0;
    let pendingSpace: Token | null = null;

    const push = () => {
      while (items.length && items[items.length - 1].run.sep) {
        width -= items.pop()!.width;
      }
      const size = items.reduce((max, i) => Math.max(max, i.run.size), 0) || fallbackSize;
      lines.push({ items, width, size });
      items = [];
      width = 0;
      pendingSpace = null;
    };

    const add = (token: Token) => {
      if (pendingSpace && items.length) {
        items.push({ text: ' ', run: pendingSpace.run, width: pendingSpace.width });
        width += pendingSpace.width;
      }
      pendingSpace = null;
      items.push({ text: token.text, run: token.run, width: token.width });
      width += token.width;
    };

    for (const token of this.tokenize(runs)) {
      if (token.kind === 'newline') {
        push();
        continue;
      }
      if (token.kind === 'space') {
        if (items.length) pendingSpace = token;
        continue;
      }
      if (token.run.sep && !items.length) continue;
      const spaceWidth = pendingSpace && items.length ? pendingSpace.width : 0;
      if (items.length && width + spaceWidth + token.width > maxWidth) {
        push();
        if (token.run.sep) continue;
      }
      if (!items.length && token.width > maxWidth) {
        const pieces = this.splitWord(token, maxWidth);
        pieces.forEach((piece, index) => {
          add(piece);
          if (index < pieces.length - 1) push();
        });
        continue;
      }
      add(token);
    }
    if (items.length || !lines.length) push();
    return lines;
  }

  linesHeight(lines: Line[], factor: number): number {
    return lines.reduce((sum, line) => sum + line.size * factor, 0);
  }

  /** Draws one line with its baseline at `baseline`. */
  drawLine(line: Line, x: number, baseline: number): void {
    let cursor = x;
    let i = 0;
    while (i < line.items.length) {
      const first = line.items[i];
      let text = first.text;
      let width = first.width;
      let j = i + 1;
      while (j < line.items.length && line.items[j].run === first.run) {
        text += line.items[j].text;
        width += line.items[j].width;
        j++;
      }
      const { font, size, color, url } = first.run;
      if (text) this.page.drawText(text, { x: cursor, y: baseline, font, size, color });
      if (url && text.trim()) this.link(cursor, baseline - size * 0.25, width, size * 1.1, url);
      cursor += width;
      i = j;
    }
  }

  /** Draws laid-out lines from the current y, breaking pages as needed. */
  drawLines(lines: Line[], opts: { x?: number; width?: number; factor: number; align?: 'left' | 'center' | 'right' }): void {
    const x = opts.x ?? this.left;
    const width = opts.width ?? this.right - x;
    for (const line of lines) {
      const height = line.size * opts.factor;
      this.ensure(height);
      const offset = opts.align === 'center' ? (width - line.width) / 2 : opts.align === 'right' ? width - line.width : 0;
      this.drawLine(line, x + Math.max(0, offset), this.baseline(this.y, line.size, opts.factor));
      this.y -= height;
    }
  }

  /** Wraps and draws runs. */
  flow(runs: Run[], opts: { x?: number; width?: number; factor: number; align?: 'left' | 'center' | 'right' }): void {
    const x = opts.x ?? this.left;
    const width = opts.width ?? this.right - x;
    this.drawLines(this.layout(runs, width), { ...opts, x, width });
  }

  /** Clickable URI annotation. */
  link(x: number, y: number, width: number, height: number, url: string): void {
    const annot = this.doc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [x, y, x + width, y + height],
      Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
    });
    this.page.node.addAnnot(this.doc.context.register(annot));
  }
}
