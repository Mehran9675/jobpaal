/**
 * CONTRACT — implemented by the page-reading module. Click-to-pick and element locators.
 */
import type { ElementLocator } from '@/shared/types';

export interface PickerOptions {
  /** 'any' = any element (job fields), 'field' = form controls, 'upload' = file inputs / drop zones. */
  filter: 'any' | 'field' | 'upload';
  hint: string;
  onPick: (el: Element) => void;
  onCancel: () => void;
  /** Elements to ignore (e.g. the overlay host). */
  ignore?: Element[];
}

/** Starts the picker: highlights elements under the pointer; click picks, Esc cancels. Returns a stop function. */
export declare function startPicker(doc: Document, options: PickerOptions): () => void;
export declare function buildLocator(el: Element, frameUrl: string): ElementLocator;
export declare function resolveLocator(doc: Document, locator: ElementLocator): Element | null;
/** Visible text of an element, cleaned (keeps paragraph breaks). */
export declare function elementText(el: Element): string;
