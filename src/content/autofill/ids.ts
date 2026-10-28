export const FIELD_ATTR = 'data-jobpaal-field';

/** Per-frame token so field ids never collide between frames of one tab. */
const FRAME_TOKEN = Math.random().toString(36).slice(2, 6);
let counter = 0;

/** Returns (and assigns if needed) the field id of a form element (stored in data-jobpaal-field). */
export function fieldIdFor(el: Element): string {
  try {
    const existing = el.getAttribute(FIELD_ATTR);
    if (existing) return existing;
    const id = `jpf-${FRAME_TOKEN}-${++counter}`;
    el.setAttribute(FIELD_ATTR, id);
    return id;
  } catch {
    return '';
  }
}
