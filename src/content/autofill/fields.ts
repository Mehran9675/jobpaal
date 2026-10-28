import { cleanInline, deepQueryAll, hasLayout, isHiddenDeep, isInsideOverlay } from '@/content/picker/dom';
import { fieldIdFor, FIELD_ATTR } from './ids';
import { cleanLabel, groupLabelFor, humanize, labelFor, optionLabelFor, precedingText, textWithoutControls } from './labels';

export type FieldKind = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file' | 'contenteditable' | 'combobox';

export interface FormField {
  id: string;
  kind: FieldKind;
  /** Primary element (first member for groups). */
  element: Element;
  /** Radio / checkbox group members, or [element]. */
  members: Element[];
  label: string;
  /** Lower-cased input type attribute (or tag name for select / textarea). */
  inputType: string;
  options: string[];
  required: boolean;
  maxLength?: number;
}

const CONTROL_SELECTOR = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"][contenteditable]';
const SKIPPED_TYPES = new Set(['hidden', 'submit', 'button', 'image', 'reset', 'password', 'search']);

function inputType(el: Element): string {
  const tag = el.tagName.toUpperCase();
  if (tag === 'SELECT') return 'select';
  if (tag === 'TEXTAREA') return 'textarea';
  if (tag !== 'INPUT') return 'contenteditable';
  return ((el as HTMLInputElement).type || el.getAttribute('type') || 'text').toLowerCase();
}

function kindOf(el: Element, type: string): FieldKind {
  if (type === 'select') return 'select';
  if (type === 'textarea') return 'textarea';
  if (type === 'contenteditable') return 'contenteditable';
  if (type === 'radio') return 'radio';
  if (type === 'checkbox') return 'checkbox';
  if (type === 'file') return 'file';
  if (el.getAttribute('role') === 'combobox' || el.getAttribute('aria-autocomplete') === 'list') return 'combobox';
  return 'text';
}

function isUsable(el: Element, type: string, cache: WeakMap<Element, boolean>, layout: boolean): boolean {
  if (SKIPPED_TYPES.has(type)) return false;
  if (isInsideOverlay(el)) return false;
  if ((el as HTMLInputElement).disabled || el.getAttribute('aria-disabled') === 'true') return false;
  if (type !== 'select' && type !== 'contenteditable' && (el as HTMLInputElement).readOnly && type !== 'file') {
    // Read-only inputs that open a picker (comboboxes, date pickers) are still useful to scan.
    if (el.getAttribute('role') !== 'combobox') return false;
  }
  if (type === 'contenteditable') {
    const parent = el.parentElement?.closest('[contenteditable=""], [contenteditable="true"]');
    if (parent) return false;
  }
  // Custom radios / checkboxes / file inputs are often visually hidden behind a styled label.
  const choiceLike = type === 'radio' || type === 'checkbox' || type === 'file';
  if (isHiddenDeep(el, cache, choiceLike)) return false;
  if (layout && !choiceLike) {
    try {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return false;
    } catch {
      /* ignore */
    }
  }
  return true;
}

function groupScope(el: Element): Element | Document | ShadowRoot {
  return (el as HTMLInputElement).form ?? (el.getRootNode() as Document | ShadowRoot);
}

/** Question text for a radio / checkbox group. */
export function groupQuestion(members: Element[]): string {
  const first = members[0];
  const legend = groupLabelFor(first);
  if (legend) return legend;
  // Common ancestor of the members.
  let ancestor: Element | null = first.parentElement;
  while (ancestor && !members.every((m) => ancestor!.contains(m))) ancestor = ancestor.parentElement;
  for (let level = 0; ancestor && level < 3; level++) {
    // A child of the ancestor that holds text but no option.
    for (const child of Array.from(ancestor.children).slice(0, 6)) {
      if (members.some((m) => child.contains(m))) break;
      if (child.querySelector('input, select, textarea')) continue;
      const text = cleanLabel(textWithoutControls(child, 400));
      if (text) return text;
    }
    const before = precedingText(ancestor, 1);
    if (before) return before;
    if (ancestor.tagName === 'FORM' || ancestor.tagName === 'BODY') break;
    ancestor = ancestor.parentElement;
  }
  const name = first.getAttribute('name') ?? '';
  return humanize(name);
}

function selectOptions(select: HTMLSelectElement): string[] {
  return Array.from(select.options)
    .filter((option, index) => !(index === 0 && (!option.value || /^(select|choose|please|--|—)/i.test(option.text.trim()))))
    .map((option) => cleanInline(option.text, 200))
    .filter(Boolean)
    .slice(0, 100);
}

function isRequired(el: Element, label: string): boolean {
  if ((el as HTMLInputElement).required || el.getAttribute('aria-required') === 'true' || /\*\s*$/.test(label)) return true;
  const labelText = (el as HTMLInputElement).labels?.[0]?.textContent ?? '';
  return /\*/.test(labelText);
}

/** All fillable fields in the document and open shadow roots. Assigns field ids. */
export function discoverFields(doc: Document): FormField[] {
  const fields: FormField[] = [];
  let elements: Element[];
  try {
    elements = deepQueryAll(doc, CONTROL_SELECTOR, 3000);
  } catch {
    return fields;
  }
  const cache = new WeakMap<Element, boolean>();
  const layout = hasLayout(doc);
  const grouped = new Set<Element>();

  for (const el of elements) {
    if (grouped.has(el)) continue;
    try {
      const type = inputType(el);
      if (!isUsable(el, type, cache, layout)) continue;
      const kind = kindOf(el, type);

      if (kind === 'radio' || kind === 'checkbox') {
        const name = el.getAttribute('name');
        let members: Element[] = [el];
        if (name) {
          const scope = groupScope(el);
          try {
            members = Array.from(scope.querySelectorAll(`input[type="${type}"]`)).filter(
              (m) => m.getAttribute('name') === name && !(m as HTMLInputElement).disabled,
            );
          } catch {
            members = [el];
          }
          if (!members.includes(el)) members = [el];
        }
        members.forEach((m) => grouped.add(m));
        const isGroup = members.length > 1;
        const id = fieldIdFor(members[0]);
        for (const m of members) m.setAttribute(FIELD_ATTR, id);
        let label: string;
        if (isGroup || kind === 'radio') label = groupQuestion(members);
        else {
          const own = optionLabelFor(el);
          const group = groupLabelFor(el);
          label = own.split(/\s+/).length > 3 || !group ? own || labelFor(el) : group;
        }
        fields.push({
          id,
          kind,
          element: members[0],
          members,
          label,
          inputType: type,
          options: isGroup || kind === 'radio' ? members.map((m) => optionLabelFor(m)).filter(Boolean) : [],
          required: members.some((m) => (m as HTMLInputElement).required) || /\*\s*$/.test(label),
        });
        continue;
      }

      const label = labelFor(el);
      const maxLength = (el as HTMLInputElement).maxLength;
      fields.push({
        id: fieldIdFor(el),
        kind,
        element: el,
        members: [el],
        label,
        inputType: type,
        options: kind === 'select' ? selectOptions(el as HTMLSelectElement) : [],
        required: isRequired(el, label),
        maxLength: typeof maxLength === 'number' && maxLength > 0 ? maxLength : undefined,
      });
    } catch {
      /* skip broken element */
    }
  }
  return fields;
}

/** Current value of a field ('' when empty). */
export function currentValue(field: FormField): string {
  try {
    const el = field.element as HTMLInputElement;
    switch (field.kind) {
      case 'radio':
      case 'checkbox': {
        const checked = field.members.filter((m) => (m as HTMLInputElement).checked);
        return checked.map((m) => optionLabelFor(m) || 'checked').join(', ');
      }
      case 'select': {
        const select = field.element as HTMLSelectElement;
        const option = select.selectedOptions?.[0];
        if (!option) return '';
        if (select.selectedIndex === 0 && (!option.value || /^(select|choose|please|--|—)/i.test(option.text.trim()))) return '';
        return option.value ? option.text : '';
      }
      case 'contenteditable':
        return cleanInline(field.element.textContent);
      case 'file':
        return el.files && el.files.length ? el.files[0].name : '';
      default:
        return el.value ?? '';
    }
  } catch {
    return '';
  }
}
