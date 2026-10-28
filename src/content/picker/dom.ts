/** Small DOM helpers shared by the content modules (picker, detection, autofill). */

export const OVERLAY_HOST_ID = 'jobpaal-root';

/** True when the element is (inside) the JobPaal overlay host, also across shadow boundaries. */
export function isInsideOverlay(el: Element | null): boolean {
  let node: Node | null = el;
  let guard = 0;
  while (node && guard++ < 500) {
    if (node instanceof Element || (node as Element).nodeType === 1) {
      if ((node as Element).id === OVERLAY_HOST_ID) return true;
    }
    const parent: Node | null = node.parentNode;
    if (parent && parent.nodeType === 11 && (parent as ShadowRoot).host) node = (parent as ShadowRoot).host;
    else node = parent;
  }
  return false;
}

/** querySelectorAll across the document and all OPEN shadow roots (recursively). */
export function deepQueryAll(root: Document | Element | ShadowRoot, selector: string, limit = 5000): Element[] {
  const out: Element[] = [];
  const visit = (scope: Document | Element | ShadowRoot, depth: number): void => {
    if (out.length >= limit || depth > 12) return;
    let matches: NodeListOf<Element>;
    try {
      matches = scope.querySelectorAll(selector);
    } catch {
      return;
    }
    for (const el of Array.from(matches)) {
      if (out.length >= limit) return;
      out.push(el);
    }
    for (const host of shadowHosts(scope)) visit(host.shadowRoot as ShadowRoot, depth + 1);
  };
  visit(root, 0);
  return out;
}

/** Elements under `scope` that have an open shadow root. */
export function shadowHosts(scope: Document | Element | ShadowRoot): Element[] {
  const hosts: Element[] = [];
  try {
    const all = scope.querySelectorAll('*');
    const max = Math.min(all.length, 20000);
    for (let i = 0; i < max; i++) {
      const el = all[i];
      if (el.shadowRoot) hosts.push(el);
    }
  } catch {
    /* ignore */
  }
  return hosts;
}

/** First deep match, or null. */
export function deepQuery(root: Document | Element | ShadowRoot, selector: string): Element | null {
  return deepQueryAll(root, selector, 1)[0] ?? null;
}

/** Parent element, crossing a shadow boundary to the host. */
export function composedParent(el: Element): Element | null {
  if (el.parentElement) return el.parentElement;
  const root = el.getRootNode?.();
  if (root && root.nodeType === 11 && (root as ShadowRoot).host) return (root as ShadowRoot).host;
  return null;
}

function styleOf(el: Element): CSSStyleDeclaration | null {
  try {
    const view = el.ownerDocument?.defaultView;
    return view ? view.getComputedStyle(el) : null;
  } catch {
    return null;
  }
}

/** True when the element itself is hidden by attribute or style (does not check ancestors). */
export function isSelfHidden(el: Element): boolean {
  if ((el as HTMLElement).hidden) return true;
  const inline = (el as HTMLElement).style;
  if (inline && (inline.display === 'none' || inline.visibility === 'hidden')) return true;
  const style = styleOf(el);
  if (style && (style.display === 'none' || style.visibility === 'hidden')) return true;
  return false;
}

/**
 * True when the element or one of its ancestors is hidden. `cache` lets a scan reuse
 * ancestor results. `fromParent` starts at the parent (for visually-hidden custom inputs).
 */
export function isHiddenDeep(el: Element, cache?: WeakMap<Element, boolean>, fromParent = false): boolean {
  const chain: Element[] = [];
  let node: Element | null = fromParent ? composedParent(el) : el;
  let hidden = false;
  let guard = 0;
  while (node && guard++ < 60) {
    const cached = cache?.get(node);
    if (cached !== undefined) {
      hidden = cached;
      break;
    }
    chain.push(node);
    if (isSelfHidden(node)) {
      hidden = true;
      break;
    }
    node = composedParent(node);
  }
  if (cache) for (const item of chain) cache.set(item, hidden);
  return hidden;
}

/** Whether the page has real layout (false in jsdom / documents without rendering). */
export function hasLayout(doc: Document): boolean {
  try {
    const rect = doc.documentElement.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  } catch {
    return false;
  }
}

/** Escapes a value for use inside a CSS identifier / attribute selector. */
export function cssEscape(value: string): string {
  const css = (globalThis as { CSS?: { escape?: (v: string) => string } }).CSS;
  if (css?.escape) return css.escape(value);
  return value.replace(/([^a-zA-Z0-9_\u00A0-\uFFFF-])/g, '\\$1').replace(/^(\d)/, '\\3$1 ');
}

/** Escapes a string for a quoted attribute value. */
export function attrValue(value: string): string {
  return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

export function isTopFrame(doc: Document): boolean {
  try {
    const view = doc.defaultView;
    return !!view && view.top === view;
  } catch {
    return false;
  }
}

/** Cleans a short piece of text: collapse whitespace, trim. */
export function cleanInline(text: string | null | undefined, max = 500): string {
  const value = (text ?? '').replace(/[\s\u00a0\u200b]+/g, ' ').trim();
  return value.length > max ? value.slice(0, max).trim() : value;
}
