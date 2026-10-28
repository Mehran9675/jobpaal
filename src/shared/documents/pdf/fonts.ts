import * as fontkitModule from '@pdf-lib/fontkit';
import { type PDFDocument, type PDFFont, StandardFonts } from 'pdf-lib';
import type { CustomFont } from '@/shared/types';
import { base64ToBytes } from '@/shared/utils/base64';

export interface PdfFonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  mono: PDFFont;
  monoBold: PDFFont;
  /** True when the standard 14 fonts are used (text must be WinAnsi-safe). */
  standard: boolean;
}

type Fontkit = Parameters<PDFDocument['registerFontkit']>[0];

/** The package ships `export default fontkit` while its typings declare named exports only. */
function fontkit(): Fontkit {
  const mod = fontkitModule as unknown as { default?: Fontkit } & Fontkit;
  return mod.default ?? mod;
}

async function embedCustom(doc: PDFDocument, font: CustomFont): Promise<PdfFonts> {
  doc.registerFontkit(fontkit());
  const regular = await doc.embedFont(base64ToBytes(font.regularBase64));
  const bold = font.boldBase64 ? await doc.embedFont(base64ToBytes(font.boldBase64)) : regular;
  return { regular, bold, italic: regular, mono: regular, monoBold: bold, standard: false };
}

async function embedStandard(doc: PDFDocument, family: 'serif' | 'sans'): Promise<PdfFonts> {
  const names =
    family === 'serif'
      ? [StandardFonts.TimesRoman, StandardFonts.TimesRomanBold, StandardFonts.TimesRomanItalic]
      : [StandardFonts.Helvetica, StandardFonts.HelveticaBold, StandardFonts.HelveticaOblique];
  const [regular, bold, italic, mono, monoBold] = await Promise.all(
    [...names, StandardFonts.Courier, StandardFonts.CourierBold].map((name) => doc.embedFont(name)),
  );
  return { regular, bold, italic, mono, monoBold, standard: true };
}

/** Embeds the custom font when set (falls back to standard fonts if it cannot be parsed). */
export async function loadFonts(doc: PDFDocument, family: 'serif' | 'sans', custom: CustomFont | null): Promise<PdfFonts> {
  if (custom?.regularBase64) {
    try {
      return await embedCustom(doc, custom);
    } catch {
      // Unreadable font data: keep rendering with the template's standard fonts.
    }
  }
  return embedStandard(doc, family);
}
