import type { ProfileKey } from '@/shared/types';
import { classifyField } from './classify';
import type { FormField } from './fields';
import { uploadKind } from './files';

/** Profile key for a discovered field (null = not a profile value). */
export function profileKeyFor(field: FormField): ProfileKey | null {
  try {
    if (field.kind === 'file') {
      const kind = uploadKind(field.element);
      return kind === 'resume' ? 'resumeFile' : kind === 'cover-letter' ? 'coverLetterFile' : null;
    }
    const el = field.element;
    const type = field.kind === 'radio' || field.kind === 'checkbox' || field.kind === 'select' || field.kind === 'textarea' || field.kind === 'contenteditable'
      ? field.kind
      : field.kind === 'combobox'
        ? 'combobox'
        : field.inputType;
    const isGroup = field.members.length > 1;
    return classifyField({
      type,
      label: field.label,
      name: el.getAttribute('name') ?? '',
      id: isGroup ? '' : el.id,
      autocomplete: el.getAttribute('autocomplete') ?? '',
    });
  } catch {
    return null;
  }
}
