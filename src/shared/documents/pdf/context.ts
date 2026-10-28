import { rgb, type RGB } from 'pdf-lib';
import { GRAY_HEX, hexToRgb, MUTED_HEX, RULE_HEX, TEXT_HEX } from '../color';
import type { Metrics, TemplateStyle } from '../styles';
import type { PdfFonts } from './fonts';
import type { PdfWriter } from './writer';

export interface PdfPalette {
  accent: RGB;
  text: RGB;
  muted: RGB;
  gray: RGB;
  rule: RGB;
  white: RGB;
}

export interface PdfContext {
  w: PdfWriter;
  fonts: PdfFonts;
  style: TemplateStyle;
  m: Metrics;
  colors: PdfPalette;
}

function toRgb(hex: string): RGB {
  const { r, g, b } = hexToRgb(hex);
  return rgb(r, g, b);
}

export function palette(accentHex: string): PdfPalette {
  return {
    accent: toRgb(accentHex),
    text: toRgb(TEXT_HEX),
    muted: toRgb(MUTED_HEX),
    gray: toRgb(GRAY_HEX),
    rule: toRgb(RULE_HEX),
    white: rgb(1, 1, 1),
  };
}
