import { cleanInline } from '@/content/picker/dom';
import { normalizeForCompare } from '@/shared/utils/text';
import { optionLabelFor } from './labels';
import { similarity } from './match';

const YES = /^(yes|true|1|i am|i do|i will|i have|i can|agree|i agree|accept|checked|on)\b/i;
const NO = /^(no|false|0|i am not|i do not|i don'?t|i will not|i won'?t|i have not|i cannot|i can'?t|decline|off)\b/i;
const PLACEHOLDER = /^(select|choose|please (select|choose)|--|—|pick)/i;

function fire(el: Element, type: string, init: EventInit = {}): void {
  try {
    el.dispatchEvent(new Event(type, { bubbles: true, composed: true, ...init }));
  } catch {
    /* ignore */
  }
}

function fireInput(el: Element, value: string): void {
  try {
    const Ctor = typeof InputEvent !== 'undefined' ? InputEvent : null;
    if (Ctor) {
      el.dispatchEvent(new Ctor('input', { bubbles: true, composed: true, inputType: 'insertText', data: value }));
      return;
    }
  } catch {
    /* fall through */
  }
  fire(el, 'input');
}

function focus(el: Element): void {
  try {
    (el as HTMLElement).focus?.({ preventScroll: true });
  } catch {
    /* ignore */
  }
}

function blur(el: Element): void {
  fire(el, 'blur', { bubbles: false });
  fire(el, 'focusout');
}

function findSetter(el: Element, prop: 'value' | 'checked'): ((v: unknown) => void) | null {
  let proto: object | null = Object.getPrototypeOf(el);
  let guard = 0;
  while (proto && guard++ < 6) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
    if (descriptor?.set) return descriptor.set as (v: unknown) => void;
    proto = Object.getPrototypeOf(proto);
  }
  return null;
}

/** Sets value through the prototype's native setter so React / Vue / Angular notice the change. */
export function setNativeValue(el: Element, value: string): void {
  const setter = findSetter(el, 'value');
  if (setter) setter.call(el, value);
  else (el as HTMLInputElement).value = value;
}

function setNativeChecked(el: Element, checked: boolean): void {
  const setter = findSetter(el, 'checked');
  if (setter) setter.call(el, checked);
  else (el as HTMLInputElement).checked = checked;
}

export function isYes(value: string): boolean {
  return YES.test(value.trim());
}

export function isNo(value: string): boolean {
  return NO.test(value.trim());
}

/** Index of the option best matching `wanted`: exact → case-insensitive → yes/no → contains → token similarity. */
export function matchOptionIndex(options: { text: string; value: string }[], wanted: string): number {
  const want = wanted.trim();
  if (!want) return -1;
  const usable = options.map((option, index) => ({ ...option, index })).filter((o) => !(o.index === 0 && (!o.value || PLACEHOLDER.test(o.text.trim()))));
  const exact = usable.find((o) => o.text.trim() === want || o.value === want);
  if (exact) return exact.index;
  const lower = want.toLowerCase();
  const ci = usable.find((o) => o.text.trim().toLowerCase() === lower || o.value.toLowerCase() === lower);
  if (ci) return ci.index;
  const norm = normalizeForCompare(want);
  const normed = usable.find((o) => normalizeForCompare(o.text) === norm);
  if (normed) return normed.index;
  if (isYes(want) && !isNo(want)) {
    const yes = usable.find((o) => isYes(o.text) && !isNo(o.text));
    if (yes) return yes.index;
  }
  if (isNo(want)) {
    const no = usable.find((o) => isNo(o.text));
    if (no) return no.index;
  }
  // Contains (prefer the closest length).
  let best = -1;
  let bestDiff = Infinity;
  for (const o of usable) {
    const text = normalizeForCompare(o.text);
    if (text.length < 2) continue;
    if (text.includes(norm) || (norm.includes(text) && text.length >= 3)) {
      const diff = Math.abs(text.length - norm.length);
      if (diff < bestDiff) {
        best = o.index;
        bestDiff = diff;
      }
    }
  }
  if (best >= 0) return best;
  let bestScore = 0.5;
  for (const o of usable) {
    const score = similarity(o.text, want);
    if (score >= bestScore) {
      best = o.index;
      bestScore = score;
    }
  }
  return best;
}

function fillSelect(select: HTMLSelectElement, value: string): boolean {
  const options = Array.from(select.options).map((o) => ({ text: cleanInline(o.text), value: o.value }));
  const index = matchOptionIndex(options, value);
  if (index < 0) return false;
  focus(select);
  setNativeValue(select, select.options[index].value);
  select.selectedIndex = index;
  fire(select, 'input');
  fire(select, 'change');
  blur(select);
  return true;
}

function groupMembers(el: HTMLInputElement): HTMLInputElement[] {
  const name = el.name;
  if (!name) return [el];
  const scope: ParentNode = el.form ?? (el.getRootNode() as Document | ShadowRoot);
  try {
    const list = Array.from(scope.querySelectorAll(`input[type="${el.type}"]`)) as HTMLInputElement[];
    const members = list.filter((m) => m.name === name);
    return members.length ? members : [el];
  } catch {
    return [el];
  }
}

function check(el: HTMLInputElement, checked: boolean): void {
  if (el.checked === checked) return;
  focus(el);
  // A real click lets frameworks run their handlers; it never submits for radios / checkboxes.
  try {
    el.click();
  } catch {
    /* ignore */
  }
  if (el.checked !== checked) {
    setNativeChecked(el, checked);
    fire(el, 'input');
    fire(el, 'change');
  }
  blur(el);
}

function fillChoice(el: HTMLInputElement, value: string): boolean {
  const members = groupMembers(el);
  if (el.type === 'radio' || members.length > 1) {
    const wanted = el.type === 'checkbox' ? value.split(/\s*[,;\n]\s*/).filter(Boolean) : [value];
    const options = members.map((m) => ({ text: optionLabelFor(m), value: m.value }));
    let any = false;
    for (const want of wanted) {
      const index = matchOptionIndex(options, want);
      if (index < 0) continue;
      check(members[index], true);
      any = true;
    }
    return any;
  }
  // Single checkbox.
  if (isYes(value) && !isNo(value)) {
    check(el, true);
    return true;
  }
  if (isNo(value)) {
    check(el, false);
    return true;
  }
  const label = optionLabelFor(el);
  if (label && similarity(label, value) >= 0.6) {
    check(el, true);
    return true;
  }
  return false;
}

function normaliseDate(type: string, value: string): string {
  const text = value.trim();
  if (type === 'date') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
    if (/^\d{4}$/.test(text)) return `${text}-01-01`;
    const parsed = Date.parse(text);
    if (!Number.isNaN(parsed)) {
      const d = new Date(parsed);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    return '';
  }
  if (type === 'month') {
    const match = /^(\d{4})-(\d{2})/.exec(text);
    if (match) return `${match[1]}-${match[2]}`;
    const parsed = Date.parse(text);
    if (!Number.isNaN(parsed)) {
      const d = new Date(parsed);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    return '';
  }
  return text;
}

function fillContentEditable(el: HTMLElement, value: string): boolean {
  focus(el);
  let done = false;
  try {
    const doc = el.ownerDocument;
    const selection = doc.getSelection?.();
    if (selection && typeof doc.execCommand === 'function') {
      const range = doc.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
      done = doc.execCommand('insertText', false, value) && cleanInline(el.textContent) === cleanInline(value);
    }
  } catch {
    done = false;
  }
  if (!done) {
    el.textContent = value;
    fireInput(el, value);
  }
  fire(el, 'change');
  blur(el);
  return true;
}

function pickComboboxOption(input: HTMLElement, value: string): void {
  try {
    const root = input.getRootNode() as Document | ShadowRoot;
    const ids = `${input.getAttribute('aria-controls') ?? ''} ${input.getAttribute('aria-owns') ?? ''}`.split(/\s+/).filter(Boolean);
    const lists = ids.map((id) => root.getElementById?.(id) ?? input.ownerDocument.getElementById(id)).filter(Boolean) as Element[];
    const options = lists.flatMap((list) => Array.from(list.querySelectorAll('[role="option"]')));
    if (!options.length) return;
    const index = matchOptionIndex(options.map((o) => ({ text: cleanInline(o.textContent), value: '' })), value);
    if (index < 0) return;
    const option = options[index] as HTMLElement;
    option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
    option.click();
  } catch {
    /* ignore */
  }
}

/**
 * Fills one element with a value using native setters and the events frameworks listen to.
 * Never presses Enter, never clicks buttons, never submits.
 */
export function fillElement(el: Element, value: string): boolean {
  try {
    if (!el || value == null) return false;
    const tag = el.tagName.toUpperCase();
    if (tag === 'SELECT') return fillSelect(el as HTMLSelectElement, value);
    if (tag === 'INPUT') {
      const input = el as HTMLInputElement;
      const type = (input.type || 'text').toLowerCase();
      if (type === 'radio' || type === 'checkbox') return fillChoice(input, value);
      if (type === 'file' || type === 'submit' || type === 'button' || type === 'image' || type === 'reset' || type === 'hidden') return false;
      let text = value;
      if (type === 'date' || type === 'month') {
        text = normaliseDate(type, value);
        if (!text) return false;
      } else if (type === 'number' || type === 'range') {
        const number = /-?\d+(?:\.\d+)?/.exec(value.replace(/,/g, ''));
        if (!number) return false;
        text = number[0];
      } else {
        text = value.replace(/\s*\n+\s*/g, ' ');
      }
      if (input.maxLength > 0 && text.length > input.maxLength) text = text.slice(0, input.maxLength);
      focus(input);
      setNativeValue(input, text);
      fireInput(input, text);
      fire(input, 'change');
      if (input.getAttribute('role') === 'combobox' || input.getAttribute('aria-autocomplete')) pickComboboxOption(input, value);
      blur(input);
      return true;
    }
    if (tag === 'TEXTAREA') {
      const area = el as HTMLTextAreaElement;
      let text = value;
      if (area.maxLength > 0 && text.length > area.maxLength) text = text.slice(0, area.maxLength);
      focus(area);
      setNativeValue(area, text);
      fireInput(area, text);
      fire(area, 'change');
      blur(area);
      return true;
    }
    const editable = el as HTMLElement;
    if (editable.isContentEditable || el.getAttribute('contenteditable') === 'true' || el.getAttribute('contenteditable') === '') {
      return fillContentEditable(editable, value);
    }
    // A wrapper: fill the single control inside it.
    const inner = el.querySelector('input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select, [contenteditable="true"]');
    return inner ? fillElement(inner, value) : false;
  } catch {
    return false;
  }
}
