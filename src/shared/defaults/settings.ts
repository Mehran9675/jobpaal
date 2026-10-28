import { ALL_RESUME_SECTIONS, type Settings } from '@/shared/types';

export const TERMS_VERSION = '1.0';

export function createDefaultSettings(): Settings {
  return {
    theme: 'system',
    overlay: { enabled: true, buttonPosition: null, panelPosition: null, scale: 1 },
    autofill: {
      overwriteExisting: false,
      highlightFilled: true,
      fillEeo: false,
      fillAfterTailor: true,
      attachResume: true,
      attachCoverLetter: true,
    },
    design: {
      template: 'modern',
      accent: '#2563eb',
      density: 'normal',
      pageSize: 'A4',
      sectionOrder: [...ALL_RESUME_SECTIONS],
      hiddenSections: [],
      showPhoto: false,
      customFont: null,
      outputFormats: ['pdf'],
    },
    fileNaming: { pattern: '{first}-{last}-{kind}' },
    terms: null,
    alwaysCoverLetter: false,
  };
}

export function normalizeSettings(stored: Partial<Settings> | null | undefined): Settings {
  const defaults = createDefaultSettings();
  if (!stored) return defaults;
  return {
    ...defaults,
    ...stored,
    overlay: { ...defaults.overlay, ...stored.overlay },
    autofill: { ...defaults.autofill, ...stored.autofill },
    design: { ...defaults.design, ...stored.design },
    fileNaming: { ...defaults.fileNaming, ...stored.fileNaming },
  };
}
