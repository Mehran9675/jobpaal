import type { DesignSettings } from '@/shared/types';
import { GRAY_HEX, MUTED_HEX, normalizeHex, RULE_HEX, TEXT_HEX } from '../color';
import { metricsFor, PAGE_SIZES, templateStyle } from '../styles';

const SERIF = "'Times New Roman', Times, Georgia, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SFMono-Regular', Consolas, 'Courier New', monospace";

function cssString(value: string): string {
  return value.replace(/[^A-Za-z0-9 _-]/g, '');
}

function fontFaces(design: DesignSettings): string {
  const font = design.customFont;
  if (!font?.regularBase64) return '';
  const family = cssString(font.name) || 'ResumeFont';
  const face = (b64: string, weight: number) =>
    `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/ttf;base64,${b64.replace(/[^A-Za-z0-9+/=]/g, '')});}`;
  return face(font.regularBase64, 400) + (font.boldBase64 ? face(font.boldBase64, 700) : '');
}

/** Inline stylesheet for a template, accent, density and page size. */
export function buildCss(design: DesignSettings): string {
  const style = templateStyle(design.template);
  const m = metricsFor(design.density, style);
  const accent = normalizeHex(design.accent);
  const page = PAGE_SIZES[design.pageSize] ?? PAGE_SIZES.A4;
  const custom = design.customFont?.regularBase64 ? `'${cssString(design.customFont.name) || 'ResumeFont'}', ` : '';
  const body = custom + (style.font === 'serif' ? SERIF : SANS);
  const headingFont = style.headingMono && !custom ? MONO : body;
  const headingColor = style.headingColor === 'accent' ? accent : style.headingColor === 'gray' ? GRAY_HEX : TEXT_HEX;
  const rule = {
    none: '',
    full: `border-bottom:0.75pt solid ${RULE_HEX};padding-bottom:2pt;`,
    'accent-full': `border-bottom:1pt solid ${accent};padding-bottom:2pt;`,
    'accent-short': 'padding-bottom:4pt;position:relative;',
    bar: `border-left:3pt solid ${accent};padding-left:6pt;`,
  }[style.headingRule];
  const shortBar =
    style.headingRule === 'accent-short'
      ? `.sec h2::after{content:'';position:absolute;left:0;bottom:0;width:36pt;height:2pt;background:${accent};}`
      : '';
  const band = style.headerBand
    ? `.doc-header{background:${accent};color:#fff;margin:-${m.margin}pt -${m.margin}pt ${m.sectionGap}pt;padding:${m.margin * 0.6}pt ${m.margin}pt;}
.doc-header .name,.doc-header .headline,.doc-header .contact,.doc-header a{color:#fff;}`
    : '';
  const chips =
    style.skills === 'chips'
      ? `.skill-items{display:flex;flex-wrap:wrap;gap:3pt;margin-top:2pt;}
.skill-items span{font-family:${custom ? body : MONO};font-size:${m.small}pt;background:${accent}1f;border-radius:3pt;padding:1pt 5pt;}
.skill-group{display:block;margin-bottom:${m.paragraphGap}pt;}`
      : style.skills === 'columns'
        ? `.skills{display:grid;grid-template-columns:1fr 1fr;column-gap:14pt;}`
        : '';

  return `${fontFaces(design)}
@page{size:${page.css};margin:0;}
*{box-sizing:border-box;}
html{background:#e9ebee;}
body{margin:0;padding:24px 0;color:${TEXT_HEX};font-family:${body};font-size:${m.body}pt;line-height:${m.lineFactor};}
.page{width:${page.width}pt;min-height:${page.height}pt;margin:0 auto;background:#fff;padding:${m.margin}pt;box-shadow:0 2px 16px rgba(0,0,0,.15);overflow:hidden;}
a{color:inherit;text-decoration:none;}
.doc-header{text-align:${style.headerAlign};margin-bottom:${m.sectionGap}pt;display:flex;gap:14pt;align-items:center;${style.headerAlign === 'center' ? 'justify-content:center;' : ''}}
.doc-header .who{flex:1;}
.doc-header .photo{width:76pt;height:76pt;object-fit:cover;border-radius:${style.font === 'serif' ? '2pt' : '50%'};order:2;}
.name{font-size:${m.name}pt;font-weight:700;line-height:1.15;margin:0;color:${style.nameAccent ? accent : TEXT_HEX};}
.headline{font-size:${m.headline}pt;color:${MUTED_HEX};margin-top:2pt;}
.contact{font-size:${m.small}pt;color:${MUTED_HEX};margin-top:4pt;}
.contact .sep{white-space:pre;}
${band}
.date-line{margin-bottom:${m.sectionGap}pt;color:${MUTED_HEX};}
.sec{margin-top:${m.sectionGap}pt;}
.sec h2{font-family:${headingFont};font-size:${m.heading}pt;color:${headingColor};margin:0 0 ${m.headingGap}pt;${style.headingUpper ? 'text-transform:uppercase;letter-spacing:.06em;' : ''}${rule}}
${shortBar}
p{margin:0 0 ${m.paragraphGap}pt;}
.entry{margin-bottom:${m.entryGap}pt;break-inside:avoid-page;}
.row{display:flex;justify-content:space-between;gap:10pt;}
.row .right{color:${GRAY_HEX};font-size:${m.small}pt;white-space:nowrap;}
.entry-title{font-weight:700;}
.entry-sub{font-style:italic;color:${MUTED_HEX};}
ul{margin:${m.paragraphGap / 2}pt 0 0;padding-left:14pt;}
li{margin-bottom:${m.paragraphGap / 2}pt;}
li::marker{content:'${style.bullet}  ';color:${style.headingColor === 'gray' ? GRAY_HEX : accent};}
.skill-group{display:block;margin-bottom:${m.paragraphGap / 2}pt;break-inside:avoid;}
.skill-name{font-weight:700;}
.qa{margin-bottom:${m.entryGap}pt;}
.qa .q{font-weight:700;margin-bottom:2pt;}
.letter p{margin-bottom:${m.paragraphGap * 2}pt;}
${chips}
@media print{html,body{background:#fff;padding:0;}.page{box-shadow:none;margin:0;width:auto;min-height:0;}}
`;
}
