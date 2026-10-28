import type { TextItem } from 'pdfjs-dist/types/src/display/api';

export const NO_TEXT_MESSAGE =
  'This PDF has no selectable text (it is probably a scanned image). Paste the resume text instead, or import a DOCX or TXT version.';

const BULLET_RE = /^\s*[\u2022\u25cf\u25aa\u25a0\u25e6\u2023\u2043\u2219\u203a\uf0b7\uf0a7\uf076\uf0d8\uf0fc\u27a2\u25ba\u25b8\u2756\u2713-]\s*/;

let workerReady: Promise<void> | null = null;

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  workerReady ??= import('pdfjs-dist/build/pdf.worker.min.mjs?url').then(({ default: workerUrl }) => {
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  });
  await workerReady;
  return pdfjs;
}

interface Segment {
  text: string;
  x: number;
  endX: number;
  height: number;
}

interface LineState {
  segments: Segment[];
  y: number;
  height: number;
}

function joinSegments(segments: Segment[]): string {
  let text = '';
  let endX = -Infinity;
  for (const seg of [...segments].sort((a, b) => a.x - b.x)) {
    if (text && seg.x - endX > seg.height * 0.15 && !/\s$/.test(text) && !/^\s/.test(seg.text)) text += ' ';
    text += seg.text;
    endX = Math.max(endX, seg.endX);
  }
  return text.replace(/\s+/g, ' ').trim();
}

/** Rebuilds lines (and blank lines between paragraphs) from positioned text items of one page. */
export function linesFromItems(items: TextItem[]): string[] {
  const lines: LineState[] = [];
  let current: LineState | null = null;
  const flush = () => {
    if (current && current.segments.some((s) => s.text.trim())) lines.push(current);
    current = null;
  };
  for (const item of items) {
    const x = item.transform[4];
    const y = item.transform[5];
    const height = Math.abs(item.height) || Math.abs(item.transform[3]) || 10;
    if (current && Math.abs(y - current.y) > Math.max(2, height * 0.5)) flush();
    if (item.str) {
      if (!current) current = { segments: [], y, height };
      current.segments.push({ text: item.str, x, endX: x + item.width, height });
      current.height = Math.max(current.height, height);
    }
    if (item.hasEOL) flush();
  }
  flush();

  const out: string[] = [];
  lines.forEach((line, index) => {
    const prev = lines[index - 1];
    if (prev && prev.y - line.y > Math.max(prev.height, line.height) * 1.75) out.push('');
    const text = joinSegments(line.segments);
    out.push(BULLET_RE.test(text) && !/^-\d/.test(text) ? text.replace(BULLET_RE, '• ') : text);
  });
  return out;
}

export async function extractPdfText(data: ArrayBuffer): Promise<string> {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(data), isEvalSupported: false }).promise;
  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const items = content.items.filter((item): item is TextItem => 'str' in item);
      pages.push(linesFromItems(items).join('\n'));
      page.cleanup();
    }
    const text = pages.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
    if (text.replace(/\s/g, '').length < 20) throw new Error(NO_TEXT_MESSAGE);
    return text;
  } finally {
    void doc.destroy();
  }
}
