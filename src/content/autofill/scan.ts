import type { FormSummary, ScreeningFieldKind, ScreeningQuestion } from '@/shared/types';
import { discoverFields, type FormField } from './fields';
import { profileKeyFor } from './fieldKey';

const INTERROGATIVE =
  /^(what|why|how|when|where|which|who|whom|whose|do|does|did|are|is|was|were|have|has|had|can|could|would|will|should|may|might|please (describe|explain|tell|share|list|provide|summari[sz]e)|describe|tell us|explain|list|share|provide|summari[sz]e|in (a few|your own) words|give (us )?an example)\b/i;

const CONSENT = /\b(i (agree|consent|acknowledge|certify|confirm|understand|accept)|privacy (policy|notice)|terms (of|and)|consent to|data processing|gdpr|subscribe|newsletter|marketing (emails|communications)|keep me (updated|informed)|text messages|sms)\b/i;

let lastFrameId = 0;

/** Frame id passed to the last scanForm call in this frame. */
export function currentFrameId(): number {
  return lastFrameId;
}

function screeningKind(field: FormField): ScreeningFieldKind | null {
  switch (field.kind) {
    case 'text':
      return 'text';
    case 'textarea':
    case 'contenteditable':
      return 'textarea';
    case 'select':
    case 'combobox':
      return 'select';
    case 'radio':
      return 'radio';
    case 'checkbox':
      return 'checkbox';
    default:
      return null;
  }
}

/** True when a label reads like a question rather than a plain data label. */
export function isQuestionLike(label: string, kind: ScreeningFieldKind): boolean {
  const text = label.trim();
  if (text.length < 4) return false;
  if (/^(select|choose|please select|--)/i.test(text)) return false;
  if (text.endsWith('?')) return true;
  if (INTERROGATIVE.test(text)) return true;
  const words = text.split(/\s+/).length;
  if (kind !== 'text' && words >= 4) return true;
  return text.length > 40;
}

/** Scans fillable fields in this frame. Assigns stable field ids (data-jobpaal-field). */
export function scanForm(doc: Document, frameId: number): FormSummary {
  const summary: FormSummary = {
    hasForm: false,
    fieldCount: 0,
    fileInputCount: 0,
    hasResumeUpload: false,
    hasCoverLetterField: false,
    coverLetterFieldKind: null,
    screeningQuestions: [],
  };
  try {
    lastFrameId = frameId;
    const fields = discoverFields(doc);
    summary.fieldCount = fields.length;
    summary.hasForm = fields.length >= 2;
    const files = fields.filter((f) => f.kind === 'file');
    summary.fileInputCount = files.length;
    let unlabelledUpload = false;
    for (const field of fields) {
      const key = profileKeyFor(field);
      if (field.kind === 'file') {
        if (key === 'resumeFile') summary.hasResumeUpload = true;
        else if (key === 'coverLetterFile') {
          summary.hasCoverLetterField = true;
          summary.coverLetterFieldKind = 'upload';
        } else unlabelledUpload = true;
        continue;
      }
      if (key === 'coverLetterText') {
        summary.hasCoverLetterField = true;
        if (!summary.coverLetterFieldKind) summary.coverLetterFieldKind = 'text';
        continue;
      }
      if (key) continue;
      const kind = screeningKind(field);
      if (!kind) continue;
      if (CONSENT.test(field.label) && (kind === 'checkbox' || kind === 'radio')) continue;
      if (!isQuestionLike(field.label, kind)) continue;
      const question: ScreeningQuestion = {
        fieldId: field.id,
        frameId,
        question: field.label,
        kind,
        options: field.options,
        required: field.required,
      };
      if (field.maxLength) question.maxLength = field.maxLength;
      summary.screeningQuestions.push(question);
    }
    // A single upload field without a clear label on an application form is almost always the resume.
    if (!summary.hasResumeUpload && unlabelledUpload && files.length === 1 && summary.hasForm) summary.hasResumeUpload = true;
    if (summary.screeningQuestions.length > 60) summary.screeningQuestions = summary.screeningQuestions.slice(0, 60);
  } catch {
    /* return what we have */
  }
  return summary;
}
