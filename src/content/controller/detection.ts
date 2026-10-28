import { scanForm } from '@/content/autofill';
import { detectJob } from '@/content/detection';
import { locatorBelongsHere } from '@/content/frame/frameContext';
import { sendToBackground, type FrameJobDetection, type FrameScanResult } from '@/shared/messaging';
import { getSiteMapping, listForcedPages } from '@/shared/storage';
import type { SiteMapping } from '@/shared/types';
import { hostFromUrl, pageKeyFromUrl } from '@/shared/utils/url';
import { mergeForms } from './mergeForms';
import { recomputeDetection, refreshApplication } from './recompute';
import { store } from './store';

function topFrameMapping(mapping: SiteMapping | null): SiteMapping | null {
  if (!mapping) return null;
  return {
    ...mapping,
    jobFields: Object.fromEntries(Object.entries(mapping.jobFields).filter(([, l]) => l && locatorBelongsHere(l.frameUrl))),
    formFields: mapping.formFields.filter((f) => locatorBelongsHere(f.locator.frameUrl)),
  };
}

async function scanFrames(mapping: SiteMapping | null): Promise<FrameScanResult[]> {
  try {
    const results = await sendToBackground('frames:broadcast', { message: { kind: 'frame:scan', mapping } });
    const scans = results.map((r) => r.result as FrameScanResult).filter((r) => r && r.form);
    if (scans.length) return scans;
  } catch {
    /* background unavailable: scan this frame only */
  }
  return [{ frameId: 0, frameUrl: '', form: scanForm(document, 0), detection: null }];
}

/** Picks the best job reading: the top page when it has a real description, else an embedded frame. */
function chooseDetection(top: FrameJobDetection, frames: FrameJobDetection[]): FrameJobDetection {
  if (top.hasValidDescription) return top;
  const frame = frames.find((d) => d.hasValidDescription && d.job) ?? frames.find((d) => d.isJobPage && d.job);
  if (!frame?.job) return top;
  const job = { ...frame.job };
  // Keep fields the top page read when the frame lacks them.
  for (const field of ['title', 'company', 'location', 'salary'] as const) {
    if (!job[field] && top.job?.[field]) {
      job[field] = top.job[field];
      if (top.job.sources[field]) job.sources = { ...job.sources, [field]: top.job.sources[field] };
    }
  }
  return {
    ...frame,
    job,
    isJobPage: frame.isJobPage || top.isJobPage,
    issues: frame.issues,
  };
}

let running: Promise<void> | null = null;

/** Reads the page (all frames) and updates the overlay state. */
export function runDetection(): Promise<void> {
  if (running) return running;
  running = (async () => {
    const url = location.href;
    const pageKey = pageKeyFromUrl(url);
    const host = hostFromUrl(url);
    const pageChanged = pageKey !== store.get().pageKey;
    const mapping = await getSiteMapping(host);
    const forced = (await listForcedPages()).includes(pageKey);

    const top = detectJob(document, url, topFrameMapping(mapping));
    const scans = await scanFrames(mapping);
    const frameDetections = scans.map((s) => s.detection).filter((d): d is FrameJobDetection => Boolean(d));
    const detected = chooseDetection(top, frameDetections);

    store.set((s) => ({
      url,
      pageKey,
      host,
      mapping,
      forced,
      detected: detected.job || detected.isJobPage ? detected : null,
      form: mergeForms(scans.map((x) => x.form)),
      override: pageChanged ? { fields: {}, sources: {} } : s.override,
      manualAnswers: pageChanged ? [] : s.manualAnswers,
      lastFill: pageChanged ? null : s.lastFill,
    }));
    recomputeDetection();
    await refreshApplication();
  })().finally(() => {
    running = null;
  });
  return running;
}
