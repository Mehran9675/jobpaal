import { cancelPick } from '@/content/controller/pickActions';
import type { PickPurpose } from '@/shared/messaging';

function describe(purpose: PickPurpose): string {
  switch (purpose.type) {
    case 'job-field':
      return `Click the ${purpose.field} on the page`;
    case 'form-field':
      return 'Click the form field to map';
    case 'send-answer':
      return 'Click the field to fill with your answer';
    case 'upload-field':
      return 'Click the upload field for this file';
  }
}

/** Shown while the click-to-pick tool is active (in any frame). */
export function PickingBar({ purpose }: { purpose: PickPurpose }) {
  return (
    <div className="jp-ov-picking" role="status">
      <span>{describe(purpose)} — Esc to cancel</span>
      <button type="button" className="jp-btn jp-btn--sm" onClick={cancelPick}>
        Cancel
      </button>
    </div>
  );
}
