import { describe, expect, it, vi } from 'vitest';
import { buildLocator, elementText, resolveLocator, startPicker } from '@/content/picker';
import { load } from './helpers';

describe('locators', () => {
  it('round-trips a locator for an element without an id', () => {
    load(`<main><section><div><p>First paragraph</p><p class="target">Second paragraph with text</p></div></section>
      <section><div><p>Other</p><p>Other second</p></div></section></main>`);
    const el = document.querySelector('.target')!;
    const locator = buildLocator(el, '');
    expect(locator.textSample).toBe('Second paragraph with text');
    expect(locator.path).toMatch(/^body\//);
    expect(resolveLocator(document, locator)).toBe(el);
    // Selector broken: the path still finds it.
    expect(resolveLocator(document, { ...locator, selector: '.does-not-exist' })).toBe(el);
  });

  it('prefers stable attributes', () => {
    load(`<div data-automation-id="jobPostingDescription"><p>x</p></div><input name="email"><div id="r1234567">x</div>`);
    expect(buildLocator(document.querySelector('[data-automation-id]')!, '').selector).toBe('[data-automation-id="jobPostingDescription"]');
    expect(buildLocator(document.querySelector('input')!, '').selector).toBe('input[name="email"]');
    expect(buildLocator(document.getElementById('r1234567')!, '').selector).not.toContain('#r1234567');
  });

  it('returns null when nothing matches', () => {
    load('<div></div>');
    expect(resolveLocator(document, { selector: '#nope', path: 'body/div[5]', textSample: '', frameUrl: '' })).toBeNull();
  });
});

describe('elementText', () => {
  it('keeps paragraph and list line breaks and skips scripts', () => {
    load(`<div id="d"><h2>Title</h2><p>One   two
      three.</p><ul><li>Alpha</li><li>Beta</li></ul><script>var x = 1;</script><p hidden>secret</p><p>End<br>line</p></div>`);
    expect(elementText(document.getElementById('d')!)).toBe('Title\n\nOne two three.\n\n• Alpha\n• Beta\n\nEnd\nline');
  });
});

describe('startPicker', () => {
  it('highlights, picks on click (blocking the page) and cleans up', () => {
    load(`<div id="wrap"><p id="p">Pick me</p></div><button id="b">Page button</button>`);
    const onPick = vi.fn();
    const onCancel = vi.fn();
    const pageClick = vi.fn();
    document.getElementById('p')!.addEventListener('click', pageClick);
    const stop = startPicker(document, { filter: 'any', hint: 'Pick the title', onPick, onCancel });
    const p = document.getElementById('p')!;
    p.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 5, clientY: 5 }));
    expect(document.querySelector('[data-jobpaal-picker="hint"]')!.textContent).toContain('Pick the title');
    p.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(onPick).toHaveBeenCalledWith(p);
    expect(pageClick).not.toHaveBeenCalled();
    expect(document.querySelector('[data-jobpaal-picker]')).toBeNull();
    stop();
  });

  it('cancels with Escape and only targets form controls with filter=field', () => {
    load(`<label for="i">Email</label><input id="i"><p id="p">text</p>`);
    const onPick = vi.fn();
    const onCancel = vi.fn();
    startPicker(document, { filter: 'field', hint: 'Pick a field', onPick, onCancel });
    document.getElementById('p')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(onPick).not.toHaveBeenCalled();
    document.querySelector('label')!.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    document.querySelector('label')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(onPick).toHaveBeenCalledWith(document.getElementById('i'));
    const stop = startPicker(document, { filter: 'any', hint: 'x', onPick, onCancel });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onCancel).toHaveBeenCalled();
    stop();
  });
});
