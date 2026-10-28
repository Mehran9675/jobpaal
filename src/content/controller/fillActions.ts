import { mergeFillReports, sendToBackground, type FilePayload, type FillPlan, type FillReport } from '@/shared/messaging';
import { getProfile, listSavedAnswers, patchApplication, timelineEvent } from '@/shared/storage';
import type { StoredDocument } from '@/shared/types';
import { say, withBusy } from './feedback';
import { refreshApplication } from './recompute';
import { store } from './store';

export const HAND_TYPED_TIP =
  'Some sites only accept input typed by hand. If a filled field is reported empty when you submit, click into it and type a character — the value JobPaal placed is then accepted.';

function primaryDocument(documents: StoredDocument[], kind: 'resume' | 'cover-letter'): StoredDocument | null {
  const primaryFormat = store.get().settings.design.outputFormats[0] ?? 'pdf';
  const ofKind = documents.filter((d) => d.kind === kind);
  return ofKind.find((d) => d.format === primaryFormat) ?? ofKind.find((d) => d.format === 'pdf') ?? ofKind[0] ?? null;
}

async function payloadFor(doc: StoredDocument | null): Promise<FilePayload | null> {
  if (!doc) return null;
  try {
    return await sendToBackground('doc:payload', { documentId: doc.id });
  } catch {
    return null;
  }
}

export async function buildFillPlan(): Promise<FillPlan> {
  const s = store.get();
  const app = s.application;
  const letter = app?.coverLetter ? (app.coverLetter.edited ?? app.coverLetter.generated) : null;
  const answers = [
    ...(app?.answers ?? []).filter((a) => a.answer.trim()).map((a) => ({ question: a.question, answer: a.answer, fieldId: a.fieldId, frameId: a.frameId })),
    ...s.manualAnswers.filter((a) => a.question.trim() && a.answer.trim()).map((a) => ({ question: a.question, answer: a.answer })),
  ];
  return {
    profile: await getProfile(),
    answers,
    savedAnswers: await listSavedAnswers(),
    mappings: s.mapping?.formFields ?? [],
    coverLetterText: letter?.text ?? '',
    files: {
      resume: s.settings.autofill.attachResume ? await payloadFor(primaryDocument(s.documents, 'resume')) : null,
      coverLetter: s.settings.autofill.attachCoverLetter ? await payloadFor(primaryDocument(s.documents, 'cover-letter')) : null,
    },
    options: s.settings.autofill,
  };
}

function describeReport(report: FillReport): string {
  const parts = [`Filled ${report.filled} field${report.filled === 1 ? '' : 's'}`];
  if (report.attached) parts.push(`attached ${report.attached} file${report.attached === 1 ? '' : 's'}`);
  if (report.failed) parts.push(`${report.failed} could not be filled — complete them by hand`);
  return parts.join(', ') + '. Review everything, then submit yourself.';
}

/** Fills every frame of the page. Never submits. */
export async function fillPage(): Promise<FillReport | undefined> {
  return withBusy('Filling the form…', async () => {
    const plan = await buildFillPlan();
    const results = await sendToBackground('frames:broadcast', { message: { kind: 'frame:fill', plan } });
    const report = mergeFillReports(results.map((r) => r.result as FillReport).filter((r) => r && Array.isArray(r.items)));
    store.set({ lastFill: report });
    if (report.filled + report.attached === 0) {
      say('warning', 'No fillable fields were found or matched. Use “Send to field” in Answers, or map fields with Guide me.');
    } else {
      say(report.failed ? 'warning' : 'success', describeReport(report));
    }
    const app = store.get().application;
    if (app) {
      await patchApplication(app.id, (a) => {
        a.timeline.push(timelineEvent('filled', `Filled ${report.filled} fields and attached ${report.attached} files on ${location.hostname}`));
      });
      await refreshApplication();
    }
    return report;
  });
}
