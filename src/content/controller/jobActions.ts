import { sendToBackground } from '@/shared/messaging';
import { setPageForced } from '@/shared/storage';
import { checkJobDescriptionProse } from '@/shared/text/prose';
import type { FieldSource, JobField, JobPosting } from '@/shared/types';
import { runDetection } from './detection';
import { say, withBusy } from './feedback';
import { fillPage } from './fillActions';
import { recomputeDetection, refreshApplication } from './recompute';
import { store } from './store';

function requireUsableJob(): JobPosting {
  const { detection } = store.get();
  if (!detection.job || !detection.hasValidDescription) {
    throw new Error(
      'There is no usable job description for this page yet. Pick it on the page, paste it, or choose a recent job — JobPaal will not tailor against guesswork.',
    );
  }
  return detection.job;
}

export function hasDocumentsForPage(): boolean {
  const s = store.get();
  return Boolean(s.application && s.documents.some((d) => d.kind === 'resume'));
}

/** Tailor and fill: generates the documents (analysis reused when stored), then fills the form. */
export async function tailorAndFill(forceCoverLetter = false): Promise<boolean> {
  const done = await withBusy('Preparing your application…', async () => {
    const job = requireUsableJob();
    await sendToBackground('pipeline:tailor', { job, form: store.get().form, forceCoverLetter });
    await refreshApplication();
    return true;
  });
  if (!done) return false;
  store.set({ panelOpen: true });
  if (store.get().settings.autofill.fillAfterTailor && (store.get().form.hasForm || store.get().form.fileInputCount > 0)) {
    await fillPage();
  } else {
    say('success', 'Your documents are ready. Review them below, then attach or download them.');
  }
  return true;
}

/** The main button: "Fill this page" (no AI) when documents exist, otherwise "Tailor and fill". */
export async function primaryAction(): Promise<void> {
  if (hasDocumentsForPage()) await fillPage();
  else await tailorAndFill();
}

/** Explicit Match click: always re-runs the analysis. */
export async function runMatch(): Promise<void> {
  await withBusy('Matching your profile to this job…', async () => {
    const job = requireUsableJob();
    const analysis = await sendToBackground('job:analyze', { job, force: true });
    store.set({ analysis, panelOpen: true });
  });
}

export async function setForced(forced: boolean): Promise<void> {
  await setPageForced(store.get().pageKey, forced);
  store.set({ forced, panelOpen: forced ? true : store.get().panelOpen });
  recomputeDetection();
}

export function setOverride(field: JobField, value: string, source: FieldSource): boolean {
  const text = value.trim();
  if (field === 'description') {
    const check = checkJobDescriptionProse(text);
    if (!check.ok) {
      say('warning', `That text is not usable as a job description: ${check.reason}`);
      return false;
    }
  }
  store.set((s) => ({
    override: { fields: { ...s.override.fields, [field]: text }, sources: { ...s.override.sources, [field]: source } },
  }));
  recomputeDetection();
  void refreshApplication();
  return true;
}

/** "Switch to the page's own description": drops the pasted/picked/recent description. */
export function restorePageDescription(): void {
  store.set((s) => {
    const fields = { ...s.override.fields };
    const sources = { ...s.override.sources };
    delete fields.description;
    delete sources.description;
    return { override: { fields, sources } };
  });
  recomputeDetection();
  void refreshApplication();
}

export function pasteDescription(text: string, source: 'pasted' | 'clipboard'): boolean {
  const ok = setOverride('description', text, source);
  if (ok) {
    say('success', 'Description added. It reads like a real job description.');
    store.set({ tool: null });
  }
  return ok;
}

export async function pasteFromClipboard(): Promise<boolean> {
  try {
    const text = await navigator.clipboard.readText();
    if (!text.trim()) {
      say('warning', 'The clipboard is empty. Copy the job description first.');
      return false;
    }
    return pasteDescription(text, 'clipboard');
  } catch {
    say('warning', 'The browser did not allow reading the clipboard. Use the paste box instead.');
    store.set({ tool: 'paste' });
    return false;
  }
}

export function applyRecentJob(job: JobPosting): void {
  store.set({
    override: {
      fields: { title: job.title, company: job.company, location: job.location, salary: job.salary, description: job.description },
      sources: { title: 'recent', company: 'recent', location: 'recent', salary: 'recent', description: 'recent' },
    },
    tool: null,
  });
  recomputeDetection();
  void refreshApplication();
  say('info', `Using the stored description of “${job.title || 'a recent job'}”.`);
}

export async function redetect(): Promise<void> {
  await runDetection();
}
