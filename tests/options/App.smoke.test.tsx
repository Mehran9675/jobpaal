import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyProfile } from '@/shared/defaults/profile';
import { createDefaultSettings, TERMS_VERSION } from '@/shared/defaults/settings';
import type { Application } from '@/shared/types';

type Listener = (changes: Record<string, { newValue?: unknown }>, area: string) => void;

function installChromeMock(initial: Record<string, unknown>) {
  const store: Record<string, unknown> = structuredClone(initial);
  const listeners = new Set<Listener>();
  const emit = (keys: string[]) => {
    const changes = Object.fromEntries(keys.map((k) => [k, { newValue: store[k] }]));
    listeners.forEach((l) => l(changes, 'local'));
  };
  const local = {
    get: vi.fn(async (key: string | null) => (key === null ? structuredClone(store) : key in store ? { [key]: structuredClone(store[key]) } : {})),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(store, structuredClone(items));
      emit(Object.keys(items));
    }),
    remove: vi.fn(async (keys: string | string[]) => {
      const list = Array.isArray(keys) ? keys : [keys];
      list.forEach((k) => delete store[k]);
      emit(list);
    }),
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: { local, onChanged: { addListener: (l: Listener) => listeners.add(l), removeListener: (l: Listener) => listeners.delete(l) } },
    runtime: { sendMessage: vi.fn(async () => ({ ok: true, data: { models: [] } })) },
  };
  return store;
}

const application: Application = {
  id: 'app_1',
  pageKey: 'https://jobs.example.com/1',
  status: 'applied',
  analysis: {
    seniority: 'Mid',
    responsibilities: [],
    requiredSkills: ['TypeScript'],
    preferredSkills: [],
    atsKeywords: [],
    cultureSignals: [],
    redFlags: ['Vague salary'],
    summary: 'A frontend role.',
    mustProveThemes: [],
    score: 72,
    recommendation: 'good match',
    reasons: ['Strong TypeScript'],
    matchedSkills: ['TypeScript'],
    missingSkills: ['GraphQL'],
    analyzedAt: 1,
    descriptionHash: 'x',
    providerId: 'p',
  },
  resume: null,
  coverLetter: { generated: { text: 'Dear team,\n\nHello.', recipient: '', company: 'Acme', role: 'Engineer' }, edited: null },
  answers: [{ id: 'q1', question: 'Why us?', answer: 'Because.', source: 'generated', edited: false }],
  documentIds: [],
  notes: 'Call back Friday',
  timeline: [{ id: 'e1', at: 1, type: 'created', text: 'Created' }],
  createdAt: 1,
  updatedAt: 2,
  job: {
    id: 'j1',
    url: 'https://jobs.example.com/1',
    pageKey: 'https://jobs.example.com/1',
    host: 'jobs.example.com',
    siteName: 'Example Jobs',
    atsKey: 'generic',
    title: 'Frontend Engineer',
    company: 'Acme',
    location: 'Remote',
    salary: '',
    employmentType: '',
    description: 'We are hiring a frontend engineer to build things.',
    requirements: [],
    keywords: [],
    postedAt: '',
    sources: {},
    detectedAt: 1,
  },
};

const ROUTES: [string, string][] = [
  ['#dashboard', 'Dashboard'],
  ['#profile', 'My profile'],
  ['#documents', 'Documents'],
  ['#applications', 'Applications'],
  ['#applications/app_1', 'Frontend Engineer'],
  ['#applications/app_1/edit', 'Edit content'],
  ['#applications/missing', 'Application not found'],
  ['#designs', 'Resume designs'],
  ['#providers', 'AI providers'],
  ['#usage', 'Usage report'],
  ['#prompts', 'Prompts and style'],
  ['#settings', 'Settings'],
  ['#terms', 'Terms and privacy'],
];

async function flush() {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

describe('management page smoke test', { timeout: 30_000 }, () => {
  let container: HTMLDivElement;
  let root: Root | null = null;
  const errors: unknown[] = [];

  beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    errors.length = 0;
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      if (String(args[0]).includes('Not implemented')) return;
      errors.push(args);
    });
  });

  afterEach(() => {
    if (root) act(() => root?.unmount());
    root = null;
    container.remove();
    vi.restoreAllMocks();
  });

  it('shows the terms gate until the terms are accepted', async () => {
    installChromeMock({ settings: createDefaultSettings() });
    location.hash = '#profile';
    const { App } = await import('@/options/App');
    root = createRoot(container);
    await act(async () => root?.render(<App />));
    await flush();
    expect(container.textContent).toContain('Welcome to JobPaal');
    const accept = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Accept and continue'));
    expect(accept?.disabled).toBe(true);
    const boxes = [...container.querySelectorAll<HTMLInputElement>('.jp-opt-accept input[type=checkbox]')];
    expect(boxes).toHaveLength(5);
    for (const box of boxes) await act(async () => box.click());
    expect(accept?.disabled).toBe(false);
    await act(async () => accept?.click());
    await flush();
    expect(container.textContent).toContain('Import a resume');
    expect(errors).toEqual([]);
  });

  it.each(ROUTES)('renders %s', async (hash, text) => {
    const settings = createDefaultSettings();
    settings.terms = { version: TERMS_VERSION, acceptedAt: 1, statements: [] };
    const profile = createEmptyProfile();
    profile.basics.firstName = 'Jo';
    profile.summary = 'Engineer.';
    installChromeMock({ settings, profile, applications: { app_1: application } });
    location.hash = hash;
    const { App } = await import('@/options/App');
    root = createRoot(container);
    await act(async () => root?.render(<App />));
    await flush();
    expect(container.textContent).toContain(text);
    expect(errors).toEqual([]);
  });

  function setInput(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function acceptedStore() {
    const settings = createDefaultSettings();
    settings.terms = { version: TERMS_VERSION, acceptedAt: 1, statements: [] };
    return installChromeMock({ settings, profile: createEmptyProfile(), applications: { app_1: application } });
  }

  it('saves profile edits explicitly', async () => {
    const store = acceptedStore();
    location.hash = '#profile';
    const { App } = await import('@/options/App');
    root = createRoot(container);
    await act(async () => root?.render(<App />));
    await flush();
    const first = [...container.querySelectorAll<HTMLLabelElement>('label.jp-field')].find((l) => l.textContent?.startsWith('First name'));
    const input = first?.querySelector('input');
    expect(input).toBeTruthy();
    await act(async () => setInput(input!, 'Robin'));
    expect(container.textContent).toContain('Unsaved changes');
    const save = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Save profile');
    await act(async () => save?.click());
    await flush();
    expect((store.profile as { basics: { firstName: string } }).basics.firstName).toBe('Robin');
    expect(errors).toEqual([]);
  });

  it('saves edited content and re-renders locally', async () => {
    const store = acceptedStore();
    location.hash = '#applications/app_1/edit';
    const { App } = await import('@/options/App');
    root = createRoot(container);
    await act(async () => root?.render(<App />));
    await flush();
    const tab = [...container.querySelectorAll<HTMLButtonElement>('[role=tab]')].find((b) => b.textContent?.startsWith('Cover letter'));
    await act(async () => tab?.click());
    const textarea = container.querySelector<HTMLTextAreaElement>('.jp-editor__letter');
    expect(textarea).toBeTruthy();
    await act(async () => setInput(textarea!, 'Dear team,\n\nEdited.'));
    const save = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Save and re-render');
    await act(async () => save?.click());
    await flush();
    const saved = (store.applications as Record<string, Application>).app_1;
    expect(saved.coverLetter?.edited?.text).toBe('Dear team,\n\nEdited.');
    expect(saved.timeline.some((e) => e.type === 'edited')).toBe(true);
    const sendMessage = (globalThis as unknown as { chrome: { runtime: { sendMessage: ReturnType<typeof vi.fn> } } }).chrome.runtime.sendMessage;
    expect(sendMessage).toHaveBeenCalledWith({ channel: 'bg', type: 'app:render', payload: { applicationId: 'app_1' } });
    expect(errors).toEqual([]);
  });
});
