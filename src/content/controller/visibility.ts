import type { OverlayState } from './state';

/** The floating button shows on recognised job pages, application forms, and pages the user forced. */
export function shouldShowButton(state: OverlayState): boolean {
  if (!state.settings.overlay.enabled) return false;
  if (state.forced) return true;
  const { detection, form } = state;
  return detection.isJobPage || form.hasResumeUpload || form.screeningQuestions.length > 0 || Boolean(state.application);
}

/** Green when everything needed was found; red with reasons otherwise. */
export function statusLight(state: OverlayState): 'green' | 'red' {
  return state.detection.issues.length === 0 && state.detection.hasValidDescription ? 'green' : 'red';
}
