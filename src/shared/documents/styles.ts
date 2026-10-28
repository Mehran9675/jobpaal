import type { Density, TemplateId } from '@/shared/types';

export type HeadingRule = 'none' | 'full' | 'accent-full' | 'accent-short' | 'bar';

/** Visual parameters shared by the PDF, DOCX and HTML renderers. */
export interface TemplateStyle {
  font: 'serif' | 'sans';
  headerAlign: 'left' | 'center';
  /** Accent-coloured band behind the header (white text). */
  headerBand: boolean;
  nameAccent: boolean;
  headingUpper: boolean;
  headingColor: 'accent' | 'gray' | 'text';
  headingRule: HeadingRule;
  headingMono: boolean;
  skills: 'lines' | 'columns' | 'chips';
  bullet: string;
  contactSeparator: string;
  sizeScale: number;
  marginScale: number;
  gapScale: number;
}

const BASE: TemplateStyle = {
  font: 'sans',
  headerAlign: 'left',
  headerBand: false,
  nameAccent: false,
  headingUpper: true,
  headingColor: 'accent',
  headingRule: 'none',
  headingMono: false,
  skills: 'lines',
  bullet: '•',
  contactSeparator: '  ·  ',
  sizeScale: 1,
  marginScale: 1,
  gapScale: 1,
};

const STYLES: Record<TemplateId, TemplateStyle> = {
  classic: { ...BASE, font: 'serif', headerAlign: 'center', headingRule: 'full', contactSeparator: '  |  ' },
  modern: { ...BASE, nameAccent: true, headingUpper: false, headingRule: 'accent-full' },
  minimal: { ...BASE, headingColor: 'gray', bullet: '–', contactSeparator: '     ', marginScale: 1.2, gapScale: 1.35 },
  executive: { ...BASE, font: 'serif', headerBand: true, headingRule: 'accent-short', contactSeparator: '  |  ' },
  compact: { ...BASE, headingRule: 'full', skills: 'columns', sizeScale: 0.9, marginScale: 0.72, gapScale: 0.7 },
  technical: { ...BASE, headingUpper: false, headingRule: 'bar', headingMono: true, skills: 'chips', bullet: '›' },
};

export function templateStyle(id: TemplateId): TemplateStyle {
  return STYLES[id] ?? STYLES.modern;
}

/** Sizes in points and spacing derived from density and template. */
export interface Metrics {
  body: number;
  small: number;
  name: number;
  headline: number;
  heading: number;
  lineFactor: number;
  paragraphGap: number;
  entryGap: number;
  sectionGap: number;
  headingGap: number;
  margin: number;
}

const DENSITY: Record<Density, Metrics> = {
  comfortable: { body: 10.5, small: 9.5, name: 24, headline: 12.5, heading: 12, lineFactor: 1.42, paragraphGap: 6, entryGap: 10, sectionGap: 16, headingGap: 7, margin: 54 },
  normal: { body: 10, small: 9, name: 22, headline: 12, heading: 11.5, lineFactor: 1.34, paragraphGap: 4.5, entryGap: 7.5, sectionGap: 12.5, headingGap: 6, margin: 48 },
  compact: { body: 9.25, small: 8.4, name: 20, headline: 11, heading: 10.5, lineFactor: 1.26, paragraphGap: 3, entryGap: 5, sectionGap: 9, headingGap: 4.5, margin: 40 },
};

export function metricsFor(density: Density, style: TemplateStyle): Metrics {
  const d = DENSITY[density] ?? DENSITY.normal;
  const s = style.sizeScale;
  const g = style.gapScale;
  return {
    body: d.body * s,
    small: d.small * s,
    name: d.name * s,
    headline: d.headline * s,
    heading: d.heading * s,
    lineFactor: d.lineFactor,
    paragraphGap: d.paragraphGap * g,
    entryGap: d.entryGap * g,
    sectionGap: d.sectionGap * g,
    headingGap: d.headingGap * g,
    margin: d.margin * style.marginScale,
  };
}

export const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89, css: 'A4' },
  Letter: { width: 612, height: 792, css: 'letter' },
} as const;
