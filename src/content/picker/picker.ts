import { labelFor } from '@/content/autofill/labels';
import { cleanInline, composedParent, isInsideOverlay } from './dom';
import type { PickerOptions } from './types';

const ACCENT = '#6d28d9';
const Z = '2147483646';

const CONTROL_SELECTOR =
  'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]), select, textarea, [contenteditable=""], [contenteditable="true"], [role="textbox"], [role="combobox"], [role="listbox"], [role="radiogroup"]';

const UPLOAD_WORDS = /drop|upload|attach|browse|drag|resume|cv\b|file/i;

function isControl(el: Element): boolean {
  try {
    return el.matches(CONTROL_SELECTOR);
  } catch {
    return false;
  }
}

function hasFileInput(el: Element): boolean {
  try {
    return !!el.querySelector('input[type=file]');
  } catch {
    return false;
  }
}

/** Finds the element the picker should target for a given hovered element. */
export function pickTarget(start: Element, filter: PickerOptions['filter']): Element | null {
  if (filter === 'any') return start;
  if (filter === 'field') {
    let node: Element | null = start;
    for (let i = 0; node && i < 6; i++) {
      if (isControl(node)) return node;
      if (node.tagName === 'LABEL') {
        const control = (node as HTMLLabelElement).control;
        if (control) return control;
      }
      node = composedParent(node);
    }
    // A wrapper whose single control is inside it (custom widgets).
    const inner = start.querySelectorAll?.(CONTROL_SELECTOR);
    if (inner && inner.length === 1) return inner[0];
    return null;
  }
  // upload
  let node: Element | null = start;
  for (let i = 0; node && i < 7; i++) {
    if (node.tagName === 'INPUT' && (node as HTMLInputElement).type === 'file') return node;
    if (node.tagName === 'LABEL') {
      const control = (node as HTMLLabelElement).control;
      if (control && (control as HTMLInputElement).type === 'file') return node;
    }
    if (hasFileInput(node)) return node;
    const words = `${node.getAttribute('class') ?? ''} ${node.getAttribute('id') ?? ''} ${node.getAttribute('data-testid') ?? ''} ${node.getAttribute('aria-label') ?? ''}`;
    if (UPLOAD_WORDS.test(words) && node.tagName !== 'BODY') return node;
    node = composedParent(node);
  }
  return null;
}

function describe(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const label = /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) || el.getAttribute('contenteditable') ? labelFor(el) : cleanInline(el.textContent, 60);
  return label ? `${tag} · ${cleanInline(label, 60)}` : tag;
}

/** Starts the picker: highlights elements under the pointer; click picks, Esc cancels. Returns a stop function. */
export function startPicker(doc: Document, options: PickerOptions): () => void {
  const view = doc.defaultView;
  const box = doc.createElement('div');
  const hint = doc.createElement('div');
  box.setAttribute('data-jobpaal-picker', 'box');
  hint.setAttribute('data-jobpaal-picker', 'hint');
  box.style.cssText = `position:fixed;z-index:${Z};pointer-events:none;border:2px solid ${ACCENT};background:rgba(109,40,217,0.12);border-radius:3px;box-sizing:border-box;display:none;transition:all 40ms linear;`;
  hint.style.cssText = `position:fixed;z-index:${Z};pointer-events:none;background:${ACCENT};color:#fff;font:12px/1.35 system-ui,-apple-system,Segoe UI,sans-serif;padding:4px 8px;border-radius:4px;max-width:340px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 8px rgba(0,0,0,.25);display:none;`;
  try {
    doc.documentElement.appendChild(box);
    doc.documentElement.appendChild(hint);
  } catch {
    /* ignore */
  }

  const ignore = options.ignore ?? [];
  let current: Element | null = null;
  const childStack: Element[] = [];
  let stopped = false;
  let lastX = 0;
  let lastY = 0;

  const ignored = (el: Element): boolean =>
    el === box || el === hint || isInsideOverlay(el) || ignore.some((item) => item === el || item.contains(el));

  const render = (): void => {
    if (!current) {
      box.style.display = 'none';
      hint.style.display = 'none';
      return;
    }
    let rect: DOMRect | null = null;
    try {
      rect = current.getBoundingClientRect();
    } catch {
      rect = null;
    }
    if (rect) {
      box.style.display = 'block';
      box.style.left = `${rect.left}px`;
      box.style.top = `${rect.top}px`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;
    }
    hint.textContent = `${options.hint} — ${describe(current)}${options.filter === 'any' ? '  (↑/↓ to widen or narrow, Esc to cancel)' : '  (Esc to cancel)'}`;
    hint.style.display = 'block';
    const width = view?.innerWidth ?? 1024;
    const height = view?.innerHeight ?? 768;
    hint.style.left = `${Math.max(4, Math.min(lastX + 14, width - 350))}px`;
    hint.style.top = `${lastY + 40 > height ? Math.max(4, lastY - 30) : lastY + 16}px`;
  };

  const targetFromEvent = (event: Event): Element | null => {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const first = (path.find((node) => (node as Node).nodeType === 1) as Element | undefined) ?? (event.target as Element | null);
    if (!first || (first as Node).nodeType !== 1) return null;
    if (ignored(first)) return null;
    return pickTarget(first, options.filter);
  };

  const onMove = (event: Event): void => {
    if (stopped) return;
    const mouse = event as MouseEvent;
    if (typeof mouse.clientX === 'number') {
      lastX = mouse.clientX;
      lastY = mouse.clientY;
    }
    const target = targetFromEvent(event);
    if (target !== current) {
      current = target;
      childStack.length = 0;
    }
    render();
  };

  const block = (event: Event): void => {
    if (stopped) return;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const first = path.find((node) => (node as Node).nodeType === 1) as Element | undefined;
    if (first && ignored(first)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
  };

  const onClick = (event: Event): void => {
    if (stopped) return;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const first = path.find((node) => (node as Node).nodeType === 1) as Element | undefined;
    if (first && ignored(first)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    const target = current ?? targetFromEvent(event);
    if (!target) return;
    stop();
    try {
      options.onPick(target);
    } catch {
      /* ignore */
    }
  };

  const onKey = (event: KeyboardEvent): void => {
    if (stopped) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      stop();
      try {
        options.onCancel();
      } catch {
        /* ignore */
      }
      return;
    }
    if (!current) return;
    if (event.key === 'ArrowUp') {
      const parent = composedParent(current);
      if (parent && parent.tagName !== 'HTML' && !ignored(parent)) {
        childStack.push(current);
        current = options.filter === 'any' ? parent : pickTarget(parent, options.filter) ?? current;
        event.preventDefault();
        render();
      }
    } else if (event.key === 'ArrowDown') {
      const child = childStack.pop() ?? current.firstElementChild;
      if (child && !ignored(child)) {
        current = child;
        event.preventDefault();
        render();
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      const target = current;
      stop();
      try {
        options.onPick(target);
      } catch {
        /* ignore */
      }
    }
  };

  const onScroll = (): void => render();

  const listeners: [EventTarget, string, EventListener][] = [
    [doc, 'mousemove', onMove],
    [doc, 'mouseover', onMove],
    [doc, 'pointerdown', block],
    [doc, 'mousedown', block],
    [doc, 'mouseup', block],
    [doc, 'pointerup', block],
    [doc, 'click', onClick],
    [doc, 'dblclick', block],
    [doc, 'keydown', onKey as EventListener],
  ];
  for (const [target, type, listener] of listeners) target.addEventListener(type, listener, true);
  view?.addEventListener('scroll', onScroll, true);

  function stop(): void {
    if (stopped) return;
    stopped = true;
    for (const [target, type, listener] of listeners) target.removeEventListener(type, listener, true);
    view?.removeEventListener('scroll', onScroll, true);
    box.remove();
    hint.remove();
  }

  return stop;
}
