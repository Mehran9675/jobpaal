import { describe, expect, it } from 'vitest';
import { asNumber, asString, asStringArray, extractJson, removeTrailingCommas } from '@/shared/ai/json';

describe('extractJson', () => {
  it('parses plain JSON', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('strips ```json fences and prose', () => {
    expect(extractJson('Here you go:\n```json\n{"a": [1, 2]}\n```\nThanks!')).toEqual({ a: [1, 2] });
  });

  it('finds the outermost object in surrounding text', () => {
    expect(extractJson('Sure! {"a": {"b": "x } y"}, "c": [1]} hope that helps')).toEqual({ a: { b: 'x } y' }, c: [1] });
  });

  it('finds arrays and tolerates trailing commas', () => {
    expect(extractJson('Result: [1, 2, 3,]')).toEqual([1, 2, 3]);
    expect(extractJson('{"a": [1, 2,], "b": {"c": 1,},}')).toEqual({ a: [1, 2], b: { c: 1 } });
    expect(removeTrailingCommas('{"s": "a,}"}')).toBe('{"s": "a,}"}');
  });

  it('ignores reasoning blocks', () => {
    expect(extractJson('<think>maybe {"wrong": true}</think>{"right": true}')).toEqual({ right: true });
  });

  it('throws on garbage', () => {
    expect(() => extractJson('no json here')).toThrow(/valid JSON/);
  });
});

describe('coercers', () => {
  it('coerce loosely typed values', () => {
    expect(asString(42)).toBe('42');
    expect(asString(null, 'x')).toBe('x');
    expect(asStringArray(['- a', ' ', 'b', 3])).toEqual(['a', 'b', '3']);
    expect(asStringArray('a\nb')).toEqual(['a', 'b']);
    expect(asNumber('85%')).toBe(85);
    expect(asNumber('n/a', 7)).toBe(7);
  });
});
