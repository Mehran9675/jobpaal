import type { DesignSettings, FileNamingSettings } from './document';

export interface Point {
  x: number;
  y: number;
}

export interface OverlaySettings {
  /** Global switch: hides the overlay everywhere. */
  enabled: boolean;
  buttonPosition: Point | null;
  panelPosition: Point | null;
  /** 0.85 to 1.6 */
  scale: number;
}

export interface AutofillSettings {
  overwriteExisting: boolean;
  highlightFilled: boolean;
  fillEeo: boolean;
  /** Fill the form automatically right after tailoring. */
  fillAfterTailor: boolean;
  attachResume: boolean;
  attachCoverLetter: boolean;
}

export interface TermsAcceptance {
  version: string;
  acceptedAt: number;
  statements: string[];
}

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  overlay: OverlaySettings;
  autofill: AutofillSettings;
  design: DesignSettings;
  fileNaming: FileNamingSettings;
  terms: TermsAcceptance | null;
  /** Generate a cover letter even when the form has no cover-letter field. */
  alwaysCoverLetter: boolean;
}
