import { ExternalHyperlink, TextRun, type ParagraphChild } from 'docx';

export interface RunStyle {
  bold?: boolean;
  italics?: boolean;
  color?: string;
  size?: number;
  font?: string;
  allCaps?: boolean;
}

/** Text runs for a string that may contain line breaks. `size` is in points. */
export function textRuns(text: string, style: RunStyle = {}): TextRun[] {
  return text.split('\n').map(
    (line, index) =>
      new TextRun({
        text: line,
        break: index ? 1 : undefined,
        bold: style.bold,
        italics: style.italics,
        color: style.color,
        size: style.size ? Math.round(style.size * 2) : undefined,
        font: style.font,
        allCaps: style.allCaps,
      }),
  );
}

export function hyperlink(text: string, url: string, style: RunStyle = {}): ParagraphChild {
  return new ExternalHyperlink({ link: url, children: textRuns(text, style) });
}
