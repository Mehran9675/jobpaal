/**
 * Public API of src/shared/documents.
 * Renderers work in a service worker (no DOM): pdf-lib, docx and string builders only.
 */
export { TEMPLATES, ACCENT_PRESETS, type TemplateInfo } from './templates';
export {
  renderResume,
  renderCoverLetter,
  renderAnswers,
  renderResumeHtml,
  renderCoverLetterHtml,
} from './render';
export { buildFileName } from './fileName';
export { resumeToJsonResume } from './jsonResume';
