/**
 * CONTRACT — implemented by the autofill module. Runs in content scripts (any frame).
 */
import type { FillPlan, FillReport, FilePayload } from '@/shared/messaging';
import type { FormSummary } from '@/shared/types';

/** Scans fillable fields in this frame. Assigns stable field ids (data-jobpaal-field). */
export declare function scanForm(doc: Document, frameId: number): FormSummary;
/** Fills this frame's fields from the plan. Never submits. */
export declare function fillForm(doc: Document, plan: FillPlan): Promise<FillReport>;
/** Fills one field (by id from scanForm, or an element) with a value. */
export declare function fillFieldById(doc: Document, fieldId: string, value: string): boolean;
export declare function fillElement(el: Element, value: string): boolean;
/** Attaches a file to a specific upload field, or the best matching one for `target`. */
export declare function attachFile(doc: Document, fieldId: string | null, target: 'resume' | 'cover-letter' | 'any', file: FilePayload): Promise<boolean>;
export declare function attachFileToElement(el: Element, file: FilePayload): Promise<boolean>;
export declare function clearHighlights(doc: Document): void;
/** Returns (and assigns if needed) the field id of a form element. */
export declare function fieldIdFor(el: Element): string;
/** Human label of a form element (label text, aria-label, placeholder, nearby text). */
export declare function labelFor(el: Element): string;
