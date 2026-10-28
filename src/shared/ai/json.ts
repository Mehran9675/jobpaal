import { AiResponseError } from './errors';

/** Index of the bracket closing the one at `start`, string-aware, or -1. */
function matchingClose(text: string, start: number): number {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{' || ch === '[') stack.push(ch === '{' ? '}' : ']');
    else if (ch === '}' || ch === ']') {
      if (stack.pop() !== ch) return -1;
      if (!stack.length) return i;
    }
  }
  return -1;
}

/** Removes trailing commas before } or ] outside strings. */
export function removeTrailingCommas(json: string): string {
  let out = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    if (ch === ',') {
      const rest = json.slice(i + 1).match(/^\s*([}\]])/);
      if (rest) continue;
    }
    out += ch;
  }
  return out;
}

function tryParse(candidate: string): { ok: true; value: unknown } | { ok: false } {
  for (const text of [candidate, removeTrailingCommas(candidate)]) {
    try {
      return { ok: true, value: JSON.parse(text) };
    } catch {
      // try next variant
    }
  }
  return { ok: false };
}

/**
 * Extracts JSON from model output: strips reasoning tags and ```json fences,
 * finds the outermost object/array and tolerates trailing commas.
 * Throws AiResponseError when nothing parses.
 */
export function extractJson(raw: string): unknown {
  let text = (raw ?? '').replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '').trim();
  text = text.replace(/^﻿/, '');
  const candidates: string[] = [];
  for (const fence of text.matchAll(/```(?:json|JSON)?\s*\n?([\s\S]*?)```/g)) candidates.push(fence[1].trim());
  candidates.push(text);
  for (const candidate of candidates) {
    const direct = tryParse(candidate);
    if (direct.ok && direct.value !== null && typeof direct.value === 'object') return direct.value;
    for (let start = 0; start < candidate.length; start++) {
      const ch = candidate[start];
      if (ch !== '{' && ch !== '[') continue;
      const end = matchingClose(candidate, start);
      if (end === -1) continue;
      const parsed = tryParse(candidate.slice(start, end + 1));
      if (parsed.ok) return parsed.value;
    }
  }
  throw new AiResponseError('The model did not return valid JSON. Try again or choose a stronger model.');
}

/** Like extractJson but always returns an object (wraps arrays as { items }). */
export function extractJsonObject(raw: string): Record<string, unknown> {
  const value = extractJson(raw);
  if (Array.isArray(value)) return { items: value };
  return asObject(value);
}

// ---- small coercers -------------------------------------------------------

export function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

/** Strings from an array (or a single string / newline list), trimmed, empties removed. */
export function asStringArray(value: unknown, max = Infinity): string[] {
  let items: unknown[];
  if (Array.isArray(value)) items = value;
  else if (typeof value === 'string') items = value.split(/\n|;/);
  else items = [];
  return items
    .map((item) => asString(item).replace(/^[\s•·▪◦‣*\-–—]+/, '').trim())
    .filter(Boolean)
    .slice(0, max);
}

export function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number.parseFloat(value.replace(/[^\d.-]/g, ''));
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (/^(true|yes|y|1)$/i.test(value.trim())) return true;
    if (/^(false|no|n|0)$/i.test(value.trim())) return false;
  }
  return fallback;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
