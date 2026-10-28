import type { FillAnswer, FillPlan, FillReport, FillReportItem } from '@/shared/messaging/fill';
import { emptyFillReport } from '@/shared/messaging/fill';
import type { FieldMapping, ProfileKey } from '@/shared/types';
import { hostFromUrl } from '@/shared/utils/url';
import { cleanInline, isTopFrame } from '@/content/picker/dom';
import { resolveLocator } from '@/content/picker/locator';
import { profileKeyFor } from './fieldKey';
import { currentValue, discoverFields, type FormField } from './fields';
import { attachFileToElement, uploadKind } from './files';
import { highlight } from './highlight';
import { bestMatch } from './match';
import { currentFrameId } from './scan';
import { fillElement } from './setValue';
import { isEeoKey, planValue } from './values';

const CONSENT = /\b(i (agree|consent|acknowledge|certify|confirm|understand|accept)|privacy (policy|notice)|terms (of|and)|consent to|subscribe|newsletter|marketing)\b/i;

interface Resolved {
  value: string;
  source: string;
}

function mappingApplies(mapping: FieldMapping, doc: Document): boolean {
  const frameUrl = mapping.locator?.frameUrl ?? '';
  if (!frameUrl) return isTopFrame(doc);
  return hostFromUrl(frameUrl) === hostFromUrl(doc.URL);
}

function resolveMappings(doc: Document, plan: FillPlan): { el: Element; mapping: FieldMapping }[] {
  const out: { el: Element; mapping: FieldMapping }[] = [];
  for (const mapping of plan.mappings ?? []) {
    try {
      if (!mappingApplies(mapping, doc)) continue;
      const el = resolveLocator(doc, mapping.locator);
      if (el) out.push({ el, mapping });
    } catch {
      /* ignore */
    }
  }
  return out;
}

function mappedValue(field: FormField, mapped: { el: Element; mapping: FieldMapping }[], plan: FillPlan): Resolved | null {
  const hit = mapped.find(({ el }) => field.members.some((m) => m === el || el.contains(m)));
  if (!hit) return null;
  const target = hit.mapping.target;
  if (target.type === 'profile') {
    const value = planValue(target.key, plan);
    return value ? { value, source: 'site mapping' } : null;
  }
  const saved = (plan.savedAnswers ?? []).find((a) => a.id === target.answerId);
  return saved?.answer ? { value: saved.answer, source: 'saved answer (site mapping)' } : null;
}

function answerValue(field: FormField, answers: FillAnswer[]): Resolved | null {
  const frameId = currentFrameId();
  const byId = answers.find((a) => a.fieldId === field.id && (a.frameId === undefined || a.frameId === frameId) && a.answer);
  if (byId) return { value: byId.answer, source: 'generated answer' };
  if (!field.label) return null;
  const byQuestion = bestMatch(field.label, answers.filter((a) => a.answer && (!a.fieldId || a.fieldId === field.id)), (a) => a.question, 0.75);
  return byQuestion ? { value: byQuestion.answer, source: 'generated answer' } : null;
}

function report(items: FillReportItem[], label: string, status: FillReportItem['status'], reason?: string): void {
  items.push(reason ? { label: cleanInline(label, 120) || 'Field', status, reason } : { label: cleanInline(label, 120) || 'Field', status });
}

/** Blocks any submit triggered as a side effect while filling. JobPaal never submits. */
function guardSubmits(doc: Document): () => void {
  const block = (event: Event): void => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  try {
    doc.addEventListener('submit', block, true);
  } catch {
    return () => undefined;
  }
  return () => doc.removeEventListener('submit', block, true);
}

/** Fills this frame's fields from the plan. Never submits. */
export async function fillForm(doc: Document, plan: FillPlan): Promise<FillReport> {
  const result = emptyFillReport(safeUrl(doc));
  const release = guardSubmits(doc);
  try {
    const options = plan.options;
    const fields = discoverFields(doc);
    const mapped = resolveMappings(doc, plan);
    const answers = plan.answers ?? [];
    let resumeAttached = false;
    let coverAttached = false;

    for (const field of fields) {
      try {
        if (field.kind === 'file') {
          const kind = uploadKind(field.element);
          const mappedHit = mapped.find(({ el }) => el === field.element || el.contains(field.element));
          const mappedKey: ProfileKey | null =
            mappedHit?.mapping.target.type === 'profile' ? mappedHit.mapping.target.key : null;
          const wantsCover = mappedKey === 'coverLetterFile' || (!mappedKey && kind === 'cover-letter');
          const wantsResume = mappedKey === 'resumeFile' || (!mappedKey && kind === 'resume');
          const payload =
            wantsCover && options.attachCoverLetter && !coverAttached
              ? plan.files?.coverLetter
              : wantsResume && options.attachResume && !resumeAttached
                ? plan.files?.resume
                : null;
          if (!payload) continue;
          const input = field.element as HTMLInputElement;
          if (input.files?.length && !options.overwriteExisting) {
            report(result.items, field.label, 'skipped', 'A file is already attached.');
            continue;
          }
          const ok = await attachFileToElement(field.element, payload);
          if (ok) {
            if (wantsCover) coverAttached = true;
            else resumeAttached = true;
            report(result.items, field.label || (wantsCover ? 'Cover letter' : 'Resume'), 'attached', payload.fileName);
          } else report(result.items, field.label || 'Upload', 'failed', 'The site did not accept the file. Attach it by hand.');
          continue;
        }

        const key = profileKeyFor(field);
        let resolved: Resolved | null = mappedValue(field, mapped, plan);
        if (!resolved) resolved = answerValue(field, answers);
        if (!resolved && key) {
          if (isEeoKey(key) && !(options.fillEeo && plan.profile?.eeo?.enabled)) continue;
          const value = planValue(key, plan);
          if (value) resolved = { value, source: 'profile' };
        }
        if (!resolved && field.label && !key) {
          const saved = bestMatch(field.label, plan.savedAnswers ?? [], (a) => a.question, 0.6);
          if (saved?.answer) resolved = { value: saved.answer, source: 'saved answer' };
        }
        if (!resolved) continue;
        // Consent boxes are only ticked by an explicit site mapping.
        if ((field.kind === 'checkbox' || field.kind === 'radio') && CONSENT.test(field.label) && resolved.source !== 'site mapping') continue;

        const existing = currentValue(field).trim();
        if (existing && !options.overwriteExisting) {
          if (existing !== resolved.value.trim()) report(result.items, field.label, 'skipped', 'Already has a value.');
          continue;
        }
        const target = field.kind === 'radio' || field.kind === 'checkbox' ? field.members[0] : field.element;
        const ok = fillElement(target, resolved.value);
        if (ok) {
          if (options.highlightFilled) {
            const checked = field.members.filter((m) => (m as HTMLInputElement).checked);
            (checked.length ? checked : [field.element]).forEach((el) => highlight(el));
          }
          report(result.items, field.label, 'filled', resolved.source);
        } else {
          report(result.items, field.label, 'failed', field.kind === 'select' || field.kind === 'radio' ? 'No matching option.' : 'The field did not accept the value.');
        }
      } catch {
        report(result.items, field.label, 'failed', 'Unexpected error while filling.');
      }
    }
  } catch {
    /* return what was done */
  } finally {
    // Let any synchronous side effects settle before removing the guard.
    await Promise.resolve();
    release();
  }
  for (const item of result.items) {
    if (item.status === 'filled') result.filled++;
    else if (item.status === 'attached') result.attached++;
    else if (item.status === 'skipped') result.skipped++;
    else result.failed++;
  }
  return result;
}

function safeUrl(doc: Document): string {
  try {
    return doc.URL;
  } catch {
    return '';
  }
}
