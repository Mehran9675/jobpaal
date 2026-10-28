import { isSelfHidden } from './dom';

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'SVG',
  'CANVAS',
  'HEAD',
  'IFRAME',
  'OBJECT',
  'VIDEO',
  'AUDIO',
  'svg',
]);

const PARAGRAPH_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'TABLE', 'DL']);

const BLOCK_TAGS = new Set([
  'DIV',
  'SECTION',
  'ARTICLE',
  'MAIN',
  'HEADER',
  'FOOTER',
  'ASIDE',
  'NAV',
  'FORM',
  'FIELDSET',
  'FIGURE',
  'FIGCAPTION',
  'ADDRESS',
  'DETAILS',
  'SUMMARY',
  'TR',
  'DD',
  'DT',
  'CAPTION',
  'LEGEND',
  'HR',
  'OPTION',
  'BODY',
]);

export interface TextOptions {
  /** Return true to skip an element and its subtree. */
  skip?: (el: Element) => boolean;
  /** Maximum characters to collect (default 60000). */
  maxChars?: number;
  /** Check computed styles for hidden elements (default true). */
  checkStyles?: boolean;
}

/**
 * Visible text of an element keeping paragraph and list line breaks: block elements
 * become line breaks, list items get a "• " bullet, whitespace is collapsed.
 */
export function extractText(root: Element, options: TextOptions = {}): string {
  const max = options.maxChars ?? 60000;
  const checkStyles = options.checkStyles !== false;
  const parts: string[] = [];
  let length = 0;
  let visited = 0;

  const push = (value: string): void => {
    parts.push(value);
    length += value.length;
  };

  const walk = (node: Node, inPre: boolean): void => {
    if (length >= max || visited++ > 200000) return;
    if (node.nodeType === 3) {
      const raw = node.nodeValue ?? '';
      push(inPre ? raw : raw.replace(/[\s ]+/g, ' '));
      return;
    }
    if (node.nodeType !== 1 && node.nodeType !== 11) return;
    if (node.nodeType === 1) {
      const el = node as Element;
      const tag = el.tagName.toUpperCase();
      if (SKIP_TAGS.has(tag) || SKIP_TAGS.has(el.tagName)) return;
      if (el !== root) {
        if (options.skip?.(el)) return;
        // aria-hidden is not skipped: some sites (LinkedIn) put the visible copy in aria-hidden spans.
        if ((el as HTMLElement).hidden) return;
        if (checkStyles && isSelfHidden(el)) return;
      }
      if (/visually-hidden|sr-only|screen-reader/i.test(el.getAttribute('class') ?? '')) return;
      if (tag === 'BR') {
        push('\n');
        return;
      }
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON') {
        if (el === root && tag === 'TEXTAREA') push((el as HTMLTextAreaElement).value);
        return;
      }
      const isPara = PARAGRAPH_TAGS.has(tag);
      const isBlock = isPara || BLOCK_TAGS.has(tag);
      const isLi = tag === 'LI';
      const isCell = tag === 'TD' || tag === 'TH';
      if (isPara) push('\n\n');
      else if (isLi) push('\n• ');
      else if (isBlock) push('\n');
      else if (isCell) push(' \t ');
      const pre = inPre || tag === 'PRE';
      if (el.shadowRoot) walk(el.shadowRoot, pre);
      for (let child = el.firstChild; child; child = child.nextSibling) walk(child, pre);
      if (isPara) push('\n\n');
      else if (isBlock) push('\n');
      return;
    }
    for (let child = node.firstChild; child; child = child.nextSibling) walk(child, inPre);
  };

  try {
    walk(root, false);
  } catch {
    /* ignore and return what we have */
  }
  return normalizeText(parts.join('')).slice(0, max);
}

/** Collapses spaces per line, trims lines, keeps at most one blank line, removes empty bullets. */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t ​]+/g, ' ').trim())
    .filter((line) => line !== '•')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Visible text of an element, cleaned (keeps paragraph and list line breaks). */
export function elementText(el: Element): string {
  try {
    if (!el) return '';
    const tag = el.tagName?.toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA') return ((el as HTMLInputElement).value ?? '').trim();
    if (tag === 'SELECT') {
      const select = el as HTMLSelectElement;
      return (select.selectedOptions?.[0]?.textContent ?? '').trim();
    }
    return extractText(el);
  } catch {
    return '';
  }
}
