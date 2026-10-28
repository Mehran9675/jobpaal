import { extractText, normalizeText } from '@/content/picker/elementText';
import { MAX_DESCRIPTION } from './dom';

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)));
}

/** Regex fallback when no DOMParser exists. */
function regexHtmlToText(html: string): string {
  return normalizeText(
    decodeEntities(
      html
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<li[^>]*>/gi, '\n• ')
        .replace(/<\/(p|h[1-6]|ul|ol|div|section|blockquote|tr|table)>/gi, '\n\n')
        .replace(/<[^>]+>/g, ' '),
    ),
  );
}

/**
 * Converts an HTML fragment (e.g. a JSON-LD description) to text with paragraph and bullet
 * line breaks. Uses an inert DOMParser document, so nothing in the fragment runs or loads.
 */
export function htmlToText(input: string, doc?: Document): string {
  if (!input) return '';
  let html = input.length > MAX_DESCRIPTION * 3 ? input.slice(0, MAX_DESCRIPTION * 3) : input;
  // Some sites double-escape the HTML.
  if (!/<[a-z]/i.test(html) && /&lt;[a-z]/i.test(html)) html = decodeEntities(html);
  if (!/<[a-z!/]/i.test(html)) return normalizeText(decodeEntities(html));
  try {
    const Parser =
      (doc?.defaultView as (Window & typeof globalThis) | null | undefined)?.DOMParser ??
      (globalThis as { DOMParser?: typeof DOMParser }).DOMParser;
    if (!Parser) return regexHtmlToText(html);
    const parsed = new Parser().parseFromString(`<!doctype html><body>${html}</body>`, 'text/html');
    if (!parsed.body) return regexHtmlToText(html);
    return extractText(parsed.body, { checkStyles: false, maxChars: MAX_DESCRIPTION });
  } catch {
    return regexHtmlToText(html);
  }
}
