/**
 * Public API of src/shared/ai. All functions run in the background script
 * (service worker on Chrome, event page on Firefox).
 */
export { AiNotConfiguredError } from './errors';
export { PROVIDER_PRESETS, getPreset } from './presets';
export { complete, listModels, testConnection } from './client';
export { runAi, isAiReady } from './runAi';
export { analyzeJob } from './tasks/analyzeJob';
export { tailorResume } from './tasks/tailorResume';
export { writeCoverLetter } from './tasks/writeCoverLetter';
export { answerQuestions } from './tasks/answerQuestions';
export { draftAnswer } from './tasks/draftAnswer';
export { parseResumeText } from './tasks/parseResumeText';
