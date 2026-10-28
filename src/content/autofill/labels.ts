import { cleanInline, composedParent, cssEscape } from '@/content/picker/dom';

const MAX_LABEL = 300;
const CONTROL_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'OPTION', 'SCRIPT', 'STYLE', 'SVG']);

/** Text of a node without the text of nested form controls (e.g. option lists in a wrapping label). */
export function textWithoutControls(node: Node, max = 600): string {
  const parts: string[] = [];
  let length = 0;
  const walk = (current: Node): void => {
    if (length > max) return;
    if (current.nodeType === 3) {
      const value = current.nodeValue ?? '';
      parts.push(value);
      length += value.length;
      return;
    }
    if (current.nodeType !== 1) return;
    const el = current as Element;
    if (CONTROL_TAGS.has(el.tagName.toUpperCase())) return;
    if ((el as HTMLElement).hidden) return;
    for (let child = el.firstChild; child; child = child.nextSibling) {
      walk(child);
      if (child.nodeType === 1 && /^(DIV|P|BR|LI)$/i.test((child as Element).tagName)) parts.push(' ');
    }
  };
  walk(node);
  return cleanInline(parts.join(' '), max);
}

/** Removes required markers and trailing punctuation noise from a label. */
export function cleanLabel(text: string): string {
  let value = cleanInline(text, 2000)
    .replace(/\(\s*(required|optional)\s*\)/gi, '')
    .replace(/\s*\*+\s*$/g, '')
    .replace(/^\s*\*+\s*/g, '')
    .replace(/\s+([?:.,])/g, '$1')
    .replace(/:\s*$/, '')
    .trim();
  if (value.length > MAX_LABEL) value = value.slice(0, MAX_LABEL).trim();
  return value;
}

/** "first_name" / "firstName" / "applicant[first-name]" → "first name". */
export function humanize(value: string): string {
  return cleanInline(
    value
      .replace(/\[\]$/, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_\-.[\]:]+/g, ' ')
      .replace(/\b(input|field|fld|txt|ctl\d*|question)\b/gi, ' ')
      .toLowerCase(),
    120,
  );
}

/** True when a name/id looks generated (react ids, long digit runs, uuids). */
export function looksGenerated(value: string): boolean {
  if (!value) return true;
  if (/^:r[0-9a-z]+:$/i.test(value)) return true;
  if (/\d{4,}/.test(value)) return true;
  if (/[0-9a-f]{8}-[0-9a-f]{4}/i.test(value)) return true;
  if (/^(react|ember|ext|mui|input|field|radix|headlessui)[-_]?[a-z]*[-_]?\d+/i.test(value)) return true;
  if (value.length > 48) return true;
  return false;
}

function byIds(doc: Document | ShadowRoot, ids: string): string {
  const parts: string[] = [];
  for (const id of ids.split(/\s+/).filter(Boolean)) {
    let target: Element | null = null;
    try {
      target = doc.getElementById ? doc.getElementById(id) : (doc as ShadowRoot).querySelector('#' + cssEscape(id));
    } catch {
      target = null;
    }
    if (target) parts.push(textWithoutControls(target));
  }
  return cleanInline(parts.join(' '));
}

function explicitLabels(el: Element): string {
  const labels = (el as HTMLInputElement).labels;
  if (labels && labels.length) {
    const text = Array.from(labels)
      .map((label) => textWithoutControls(label))
      .filter(Boolean)
      .join(' ');
    if (text) return text;
  }
  const id = el.getAttribute('id');
  if (id) {
    const root = el.getRootNode() as Document | ShadowRoot;
    try {
      const label = root.querySelector?.(`label[for="${id.replace(/"/g, '\\"')}"]`);
      if (label) return textWithoutControls(label);
    } catch {
      /* ignore */
    }
  }
  const wrapping = el.closest('label');
  if (wrapping) return textWithoutControls(wrapping);
  return '';
}

/** Legend / aria label of the group (fieldset, radiogroup) an element belongs to. */
export function groupLabelFor(el: Element): string {
  const group = el.closest('[role="radiogroup"], [role="group"], fieldset');
  if (group) {
    const root = el.getRootNode() as Document | ShadowRoot;
    const labelledBy = group.getAttribute('aria-labelledby');
    if (labelledBy) {
      const text = byIds(root, labelledBy);
      if (text) return cleanLabel(text);
    }
    const aria = group.getAttribute('aria-label');
    if (aria) return cleanLabel(aria);
    if (group.tagName === 'FIELDSET') {
      const legend = group.querySelector(':scope > legend');
      if (legend) {
        const text = textWithoutControls(legend);
        if (text) return cleanLabel(text);
      }
    }
  }
  return '';
}

/** Text just before the element (previous siblings, then up a few ancestors). */
export function precedingText(el: Element, levels = 4): string {
  let node: Element | null = el;
  for (let level = 0; node && level < levels; level++) {
    let sibling = node.previousElementSibling;
    let steps = 0;
    while (sibling && steps++ < 3) {
      if (!/^(INPUT|SELECT|TEXTAREA|BUTTON|SCRIPT|STYLE)$/i.test(sibling.tagName)) {
        const hasControl = sibling.querySelector('input:not([type=hidden]), select, textarea');
        if (!hasControl) {
          const text = cleanLabel(textWithoutControls(sibling, 400));
          if (text && text.length <= 250) return text;
        } else break;
      } else break;
      sibling = sibling.previousElementSibling;
    }
    // Direct text in the parent before the element (e.g. "<div>Phone <input></div>").
    const parent: Element | null = composedParent(node);
    if (parent) {
      let text = '';
      for (let child = parent.firstChild; child && child !== node; child = child.nextSibling) {
        if (child.nodeType === 3) text += child.nodeValue ?? '';
      }
      const cleaned = cleanLabel(text);
      if (cleaned.length >= 2) return cleaned;
    }
    node = parent;
  }
  return '';
}

/** Human label of a form element (label text, aria-label, placeholder, nearby text). */
export function labelFor(el: Element): string {
  try {
    const type = (el.getAttribute('type') ?? '').toLowerCase();
    const isChoice = type === 'radio' || type === 'checkbox';
    const root = el.getRootNode() as Document | ShadowRoot;

    const explicit = explicitLabels(el);
    if (explicit && !isChoice) return cleanLabel(explicit);

    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const text = byIds(root, labelledBy);
      if (text) return cleanLabel(text);
    }
    const aria = el.getAttribute('aria-label');
    if (aria && cleanInline(aria)) return cleanLabel(aria);
    if (explicit) return cleanLabel(explicit);

    if (isChoice) {
      const group = groupLabelFor(el);
      if (group) return group;
    }
    const placeholder = el.getAttribute('placeholder') ?? el.getAttribute('data-placeholder');
    if (placeholder && cleanInline(placeholder)) return cleanLabel(placeholder);
    const title = el.getAttribute('title');
    if (title && cleanInline(title)) return cleanLabel(title);

    const near = precedingText(el);
    if (near) return near;

    const name = el.getAttribute('name') ?? '';
    if (name && !looksGenerated(name)) return humanize(name);
    const id = el.getAttribute('id') ?? '';
    if (id && !looksGenerated(id)) return humanize(id);
    return humanize(name || id);
  } catch {
    return '';
  }
}

/** Label of one radio / checkbox option (its own label text, or value). */
export function optionLabelFor(el: Element): string {
  try {
    const explicit = explicitLabels(el);
    if (explicit) return cleanLabel(explicit);
    const aria = el.getAttribute('aria-label');
    if (aria) return cleanLabel(aria);
    const next = el.nextSibling;
    if (next && next.nodeType === 3 && cleanInline(next.nodeValue)) return cleanLabel(next.nodeValue ?? '');
    if (el.nextElementSibling && !/^(INPUT|SELECT|TEXTAREA)$/i.test(el.nextElementSibling.tagName)) {
      const text = cleanLabel(textWithoutControls(el.nextElementSibling, 200));
      if (text) return text;
    }
    return cleanLabel((el as HTMLInputElement).value ?? '');
  } catch {
    return '';
  }
}
