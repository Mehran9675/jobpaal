import type { FilePayload } from '@/shared/messaging/fill';
import { base64ToBytes } from '@/shared/utils/base64';
import { cssEscape, deepQuery, deepQueryAll, isInsideOverlay } from '@/content/picker/dom';
import { classifyField } from './classify';
import { FIELD_ATTR } from './ids';
import { highlight } from './highlight';
import { labelFor, precedingText } from './labels';

type DataTransferCtor = new () => DataTransfer;

function dataTransferFor(el: Element): DataTransferCtor | null {
  const view = el.ownerDocument?.defaultView as (Window & { DataTransfer?: DataTransferCtor }) | null;
  return view?.DataTransfer ?? (globalThis as { DataTransfer?: DataTransferCtor }).DataTransfer ?? null;
}

function toFile(payload: FilePayload): File {
  const bytes = base64ToBytes(payload.base64);
  return new File([bytes], payload.fileName || 'document', { type: payload.mimeType || 'application/octet-stream', lastModified: Date.now() });
}

function makeTransfer(el: Element, file: File): DataTransfer | null {
  const Ctor = dataTransferFor(el);
  if (!Ctor) return null;
  try {
    const transfer = new Ctor();
    transfer.items.add(file);
    return transfer;
  } catch {
    return null;
  }
}

function fire(el: Element, type: string): void {
  el.dispatchEvent(new Event(type, { bubbles: true, composed: true }));
}

function attachToInput(input: HTMLInputElement, file: File): boolean {
  const transfer = makeTransfer(input, file);
  if (!transfer) return false;
  try {
    input.files = transfer.files;
  } catch {
    return false;
  }
  if (!input.files || !input.files.length) return false;
  fire(input, 'input');
  fire(input, 'change');
  return true;
}

function dropOn(target: Element, file: File): boolean {
  const transfer = makeTransfer(target, file);
  if (!transfer) return false;
  const view = target.ownerDocument?.defaultView as (Window & { DragEvent?: typeof DragEvent }) | null;
  for (const type of ['dragenter', 'dragover', 'drop']) {
    let event: Event;
    try {
      const Ctor = view?.DragEvent ?? (typeof DragEvent !== 'undefined' ? DragEvent : null);
      event = Ctor
        ? new Ctor(type, { bubbles: true, cancelable: true, composed: true, dataTransfer: transfer })
        : new Event(type, { bubbles: true, cancelable: true, composed: true });
      if (!(event as DragEvent).dataTransfer) Object.defineProperty(event, 'dataTransfer', { value: transfer });
    } catch {
      event = new Event(type, { bubbles: true, cancelable: true, composed: true });
      try {
        Object.defineProperty(event, 'dataTransfer', { value: transfer });
      } catch {
        return false;
      }
    }
    target.dispatchEvent(event);
  }
  return true;
}

/** The file input belonging to an element: itself, nested, label target, or a nearby one. */
function fileInputFor(el: Element): HTMLInputElement | null {
  if (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'file') return el as HTMLInputElement;
  if (el.tagName === 'LABEL') {
    const control = (el as HTMLLabelElement).control as HTMLInputElement | null;
    if (control?.type === 'file') return control;
  }
  const nested = deepQuery(el, 'input[type=file]') as HTMLInputElement | null;
  if (nested) return nested;
  const controls = el.getAttribute('aria-controls');
  if (controls) {
    const target = el.ownerDocument.getElementById(controls);
    if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'file') return target as HTMLInputElement;
  }
  // A sibling input (common: <button>Upload</button><input type=file hidden>).
  let parent = el.parentElement;
  for (let level = 0; parent && level < 2; level++) {
    const inputs = parent.querySelectorAll('input[type=file]');
    if (inputs.length === 1) return inputs[0] as HTMLInputElement;
    parent = parent.parentElement;
  }
  return null;
}

/** Attaches a file to an upload field: a file input, or a drop zone (via drag events). */
export async function attachFileToElement(el: Element, file: FilePayload): Promise<boolean> {
  try {
    if (!el || !file?.base64) return false;
    const blob = toFile(file);
    const input = fileInputFor(el);
    if (input && attachToInput(input, blob)) {
      highlight(input);
      return true;
    }
    if (el.tagName !== 'INPUT' && dropOn(el, blob)) {
      highlight(el);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Kind of document a file input expects. */
export function uploadKind(input: Element): 'resume' | 'cover-letter' | 'other' {
  const label = labelFor(input);
  const hint = `${precedingText(input, 3)} ${input.getAttribute('accept') ?? ''} ${input.closest('[class], [id]')?.getAttribute('class') ?? ''} ${input.closest('[id]')?.id ?? ''}`;
  const key = classifyField({ type: 'file', label, name: input.getAttribute('name') ?? '', id: input.id, hint });
  if (key === 'coverLetterFile') return 'cover-letter';
  if (key === 'resumeFile') return 'resume';
  return 'other';
}

function fileInputs(doc: Document): HTMLInputElement[] {
  return (deepQueryAll(doc, 'input[type=file]', 200) as HTMLInputElement[]).filter((input) => !input.disabled && !isInsideOverlay(input));
}

/** Best file input for a target document type, or null. */
export function bestFileInput(doc: Document, target: 'resume' | 'cover-letter' | 'any'): HTMLInputElement | null {
  const inputs = fileInputs(doc);
  if (!inputs.length) return null;
  const kinds = inputs.map((input) => ({ input, kind: uploadKind(input) }));
  if (target === 'cover-letter') return kinds.find((k) => k.kind === 'cover-letter')?.input ?? null;
  if (target === 'resume') {
    return (
      kinds.find((k) => k.kind === 'resume')?.input ??
      (kinds.filter((k) => k.kind === 'other').length === 1 && !kinds.some((k) => k.kind === 'resume')
        ? kinds.find((k) => k.kind === 'other')!.input
        : null)
    );
  }
  return kinds.find((k) => !k.input.files?.length)?.input ?? inputs[0];
}

/** Attaches a file to a specific upload field, or the best matching one for `target`. */
export async function attachFile(
  doc: Document,
  fieldId: string | null,
  target: 'resume' | 'cover-letter' | 'any',
  file: FilePayload,
): Promise<boolean> {
  try {
    if (fieldId) {
      const el = deepQuery(doc, `[${FIELD_ATTR}="${cssEscape(fieldId)}"]`);
      return el ? attachFileToElement(el, file) : false;
    }
    const input = bestFileInput(doc, target);
    return input ? attachFileToElement(input, file) : false;
  } catch {
    return false;
  }
}
