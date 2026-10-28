import type { ElementLocator } from '@/shared/types';
import { labelFor, looksGenerated } from '@/content/autofill/labels';
import { attrValue, cleanInline, cssEscape, deepQueryAll } from './dom';
import { elementText } from './elementText';

const STABLE_ATTRS = ['data-automation-id', 'data-testid', 'data-test', 'data-qa', 'data-ui', 'data-test-id'];
const FORM_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA']);

function rootOf(el: Element): Document | ShadowRoot {
  const root = el.getRootNode();
  return root.nodeType === 11 || root.nodeType === 9 ? (root as Document | ShadowRoot) : el.ownerDocument;
}

function countMatches(root: Document | ShadowRoot, selector: string): number {
  try {
    return root.querySelectorAll(selector).length;
  } catch {
    return 0;
  }
}

function isUnique(root: Document | ShadowRoot, selector: string, el: Element): boolean {
  try {
    const list = root.querySelectorAll(selector);
    return list.length === 1 && list[0] === el;
  } catch {
    return false;
  }
}

function nthSegment(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const parent = el.parentElement;
  if (!parent) return tag;
  const same = Array.from(parent.children).filter((c) => c.tagName === el.tagName);
  if (same.length === 1) return tag;
  return `${tag}:nth-of-type(${same.indexOf(el) + 1})`;
}

/** Stable selector for this element alone, if one exists. */
function ownSelector(el: Element, root: Document | ShadowRoot): string | null {
  const tag = el.tagName.toLowerCase();
  const id = el.getAttribute('id');
  if (id && !looksGenerated(id)) {
    const selector = '#' + cssEscape(id);
    if (isUnique(root, selector, el)) return selector;
  }
  for (const attr of STABLE_ATTRS) {
    const value = el.getAttribute(attr);
    if (!value || looksGenerated(value)) continue;
    const selector = `[${attr}=${attrValue(value)}]`;
    if (isUnique(root, selector, el)) return selector;
    const withTag = `${tag}${selector}`;
    if (isUnique(root, withTag, el)) return withTag;
  }
  const name = el.getAttribute('name');
  if (name && FORM_TAGS.has(el.tagName.toUpperCase())) {
    const selector = `${tag}[name=${attrValue(name)}]`;
    if (isUnique(root, selector, el)) return selector;
    const value = el.getAttribute('value');
    if (value !== null) {
      const withValue = `${selector}[value=${attrValue(value)}]`;
      if (isUnique(root, withValue, el)) return withValue;
    }
  }
  return null;
}

/** Short selector: own stable selector, or a nth-of-type chain anchored at a stable ancestor. */
function shortSelector(el: Element, root: Document | ShadowRoot): string {
  const own = ownSelector(el, root);
  if (own) return own;
  const segments: string[] = [];
  let node: Element | null = el;
  let depth = 0;
  while (node && depth++ < 25) {
    const tag = node.tagName.toLowerCase();
    if (tag === 'html') break;
    if (node !== el) {
      const anchor = ownSelector(node, root);
      if (anchor) {
        segments.unshift(anchor);
        const selector = segments.join(' > ');
        if (countMatches(root, selector) === 1) return selector;
        segments.shift();
      }
    }
    segments.unshift(tag === 'body' ? 'body' : nthSegment(node));
    const selector = segments.join(' > ');
    if (depth >= 3 && isUnique(root, selector, el)) return selector;
    if (tag === 'body') break;
    node = node.parentElement;
  }
  return segments.join(' > ');
}

/** Full tag/nth path from body (1-based indexes); "#shadow" enters an open shadow root. */
export function fullPath(el: Element): string {
  const segments: string[] = [];
  let node: Element | null = el;
  let guard = 0;
  while (node && guard++ < 200) {
    const tag = node.tagName.toLowerCase();
    if (tag === 'body' || tag === 'html') break;
    const parent: Element | null = node.parentElement;
    if (parent) {
      const same = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
      segments.unshift(`${tag}[${same.indexOf(node) + 1}]`);
      node = parent;
      continue;
    }
    const root = node.getRootNode();
    if (root.nodeType === 11 && (root as ShadowRoot).host) {
      const same = Array.from((root as ShadowRoot).children).filter((c) => c.tagName === node!.tagName);
      segments.unshift(`${tag}[${same.indexOf(node) + 1}]`);
      segments.unshift('#shadow');
      node = (root as ShadowRoot).host;
      continue;
    }
    break;
  }
  return ['body', ...segments].join('/');
}

function resolvePath(doc: Document, path: string): Element | null {
  if (!path) return null;
  const segments = path.split('/');
  if (segments[0] !== 'body' || !doc.body) return null;
  let scope: Element | ShadowRoot = doc.body;
  let current: Element | null = doc.body;
  for (const segment of segments.slice(1)) {
    if (segment === '#shadow') {
      if (!current?.shadowRoot) return null;
      scope = current.shadowRoot;
      continue;
    }
    const match = /^([a-z0-9-]+)\[(\d+)\]$/i.exec(segment);
    if (!match) return null;
    const tag = match[1].toUpperCase();
    const index = Number(match[2]) - 1;
    const same: Element[] = Array.from(scope.children).filter((c: Element) => c.tagName.toUpperCase() === tag);
    current = same[index] ?? null;
    if (!current) return null;
    scope = current;
  }
  return current;
}

/** Text used to verify a match: label for form controls, visible text otherwise. */
export function sampleFor(el: Element): string {
  const tag = el.tagName.toUpperCase();
  if (FORM_TAGS.has(tag) || el.getAttribute('contenteditable') === 'true') return cleanInline(labelFor(el), 80);
  return cleanInline(elementText(el), 80);
}

/** Builds a locator that can find the element again on a later visit. */
export function buildLocator(el: Element, frameUrl: string): ElementLocator {
  try {
    const root = rootOf(el);
    return { selector: shortSelector(el, root), path: fullPath(el), textSample: sampleFor(el), frameUrl };
  } catch {
    return { selector: '', path: '', textSample: '', frameUrl };
  }
}

function norm(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function textMatches(el: Element, sample: string): boolean {
  if (!sample) return false;
  const want = norm(sample).slice(0, 40);
  const have = norm(sampleFor(el));
  return !!want && (have.startsWith(want) || have.includes(want) || want.startsWith(have.slice(0, 40)) && have.length > 3);
}

/** Finds the element again: selector, then path, verified/disambiguated with the text sample. */
export function resolveLocator(doc: Document, locator: ElementLocator): Element | null {
  try {
    if (!locator) return null;
    const bySelector = locator.selector ? deepQueryAll(doc, locator.selector, 25) : [];
    const byPath = resolvePath(doc, locator.path);
    if (locator.textSample) {
      const verified = bySelector.find((el) => textMatches(el, locator.textSample));
      if (verified) return verified;
      if (byPath && textMatches(byPath, locator.textSample)) return byPath;
    }
    if (bySelector.length === 1) return bySelector[0];
    if (byPath && (bySelector.length === 0 || bySelector.includes(byPath))) return byPath;
    if (bySelector.length > 1) return bySelector[0];
    if (byPath) return byPath;
    return findByText(doc, locator.textSample);
  } catch {
    return null;
  }
}

/** Last resort: the smallest element whose text starts with the sample. */
function findByText(doc: Document, sample: string): Element | null {
  const want = norm(sample);
  if (want.length < 12 || !doc.body) return null;
  const all = doc.body.querySelectorAll('h1, h2, h3, h4, p, span, div, li, td, dd, section, article, label');
  let best: Element | null = null;
  let bestLength = Infinity;
  const max = Math.min(all.length, 8000);
  for (let i = 0; i < max; i++) {
    const el = all[i];
    const content = el.textContent ?? '';
    if (content.length < want.length || content.length > 200000) continue;
    if (!norm(content.slice(0, want.length * 3)).startsWith(want.slice(0, 40))) continue;
    if (content.length < bestLength) {
      best = el;
      bestLength = content.length;
    }
  }
  return best;
}
