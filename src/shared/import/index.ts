/**
 * Public API of src/shared/import: resume import (runs in extension pages with DOM).
 * PDF (pdfjs-dist) and DOCX (mammoth browser build) parsers are lazy-loaded on first use.
 */
export { extractTextFromFile } from './extractText';
export { jsonResumeToProfile } from './jsonResume';
export { mergeProfile } from './merge';
