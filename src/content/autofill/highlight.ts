import { deepQueryAll } from '@/content/picker/dom';

const FILLED_ATTR = 'data-jobpaal-filled';
const PREV_ATTR = 'data-jobpaal-prev-outline';
const OUTLINE = '2px solid #16a34a';

function visualTarget(el: Element): HTMLElement {
  const input = el as HTMLInputElement;
  if (el.tagName === 'INPUT' && (input.type === 'radio' || input.type === 'checkbox' || input.type === 'file')) {
    const label = input.labels?.[0];
    if (label) return label;
    if (el.parentElement) return el.parentElement;
  }
  return el as HTMLElement;
}

/** Outlines a filled field so the user can verify it. */
export function highlight(el: Element): void {
  try {
    const target = visualTarget(el);
    if (!target.hasAttribute(FILLED_ATTR)) target.setAttribute(PREV_ATTR, target.style.outline ?? '');
    target.setAttribute(FILLED_ATTR, '1');
    target.style.outline = OUTLINE;
    target.style.outlineOffset = '1px';
  } catch {
    /* ignore */
  }
}

/** Removes every highlight added by JobPaal in this document (and open shadow roots). */
export function clearHighlights(doc: Document): void {
  try {
    for (const el of deepQueryAll(doc, `[${FILLED_ATTR}]`)) {
      const html = el as HTMLElement;
      html.style.outline = el.getAttribute(PREV_ATTR) ?? '';
      html.style.outlineOffset = '';
      el.removeAttribute(FILLED_ATTR);
      el.removeAttribute(PREV_ATTR);
    }
  } catch {
    /* ignore */
  }
}
