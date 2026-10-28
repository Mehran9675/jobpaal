import type { FormSummary } from '@/shared/types';
import { emptyForm } from './state';

/** Application forms are often split across frames; combine what every frame found. */
export function mergeForms(forms: FormSummary[]): FormSummary {
  const merged = emptyForm();
  for (const form of forms) {
    merged.hasForm ||= form.hasForm;
    merged.fieldCount += form.fieldCount;
    merged.fileInputCount += form.fileInputCount;
    merged.hasResumeUpload ||= form.hasResumeUpload;
    if (form.hasCoverLetterField) {
      merged.hasCoverLetterField = true;
      merged.coverLetterFieldKind ??= form.coverLetterFieldKind;
    }
    merged.screeningQuestions.push(...form.screeningQuestions);
  }
  return merged;
}
