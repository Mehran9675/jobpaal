import { attrValue, deepQuery } from '@/content/picker/dom';
import { highlight } from './highlight';
import { FIELD_ATTR } from './ids';
import { fillElement } from './setValue';

/** Fills one field (by id from scanForm) with a value. Highlights it on success. */
export function fillFieldById(doc: Document, fieldId: string, value: string): boolean {
  try {
    if (!fieldId) return false;
    const el = deepQuery(doc, `[${FIELD_ATTR}=${attrValue(fieldId)}]`);
    if (!el) return false;
    const ok = fillElement(el, value);
    if (ok) highlight(el);
    return ok;
  } catch {
    return false;
  }
}
