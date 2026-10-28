import { attachFile, attachFileToElement, clearHighlights, fieldIdFor, fillElement, fillFieldById, fillForm, labelFor, scanForm } from '@/content/autofill';
import { detectJob } from '@/content/detection';
import { buildLocator, elementText, startPicker } from '@/content/picker';
import { sendToBackground, type FrameRequest, type FrameScanResult, type PickPurpose, type TopFrameEvent } from '@/shared/messaging';
import type { SiteMapping } from '@/shared/types';
import { currentFrameUrl, isTopFrame, locatorBelongsHere } from './frameContext';

let stopPicking: (() => void) | null = null;
let thisFrameId = 0;

function sendToTop(event: TopFrameEvent): void {
  sendToBackground('frames:toTop', { event }).catch(() => undefined);
}

function mappingForThisFrame(mapping: SiteMapping | null): SiteMapping | null {
  if (!mapping) return null;
  const jobFields = Object.fromEntries(
    Object.entries(mapping.jobFields).filter(([, locator]) => locator && locatorBelongsHere(locator.frameUrl)),
  );
  return {
    ...mapping,
    jobFields,
    formFields: mapping.formFields.filter((f) => locatorBelongsHere(f.locator.frameUrl)),
  };
}

function scan(mapping: SiteMapping | null): FrameScanResult {
  const form = scanForm(document, thisFrameId);
  let detection: FrameScanResult['detection'] = null;
  // The top frame reads the job itself; sub-frames report a job only when they hold one (embedded boards).
  if (!isTopFrame && document.body && (document.body.innerText ?? '').length > 400) {
    const result = detectJob(document, location.href, mappingForThisFrame(mapping));
    if (result.job && (result.isJobPage || result.hasValidDescription)) detection = result;
  }
  return { frameId: thisFrameId, frameUrl: currentFrameUrl(), form, detection };
}

function overlayHost(): Element[] {
  const host = document.getElementById('jobpaal-root');
  return host ? [host] : [];
}

async function handlePick(purpose: PickPurpose, el: Element): Promise<void> {
  const frameUrl = currentFrameUrl();
  const locator = buildLocator(el, frameUrl);
  let fieldId: string | null = null;
  if (purpose.type === 'send-answer') {
    fieldId = fieldIdFor(el);
    const ok = fillElement(el, purpose.text);
    sendToTop({ kind: 'fieldFilled', label: ok ? labelFor(el) || 'field' : '' });
  } else if (purpose.type === 'upload-field') {
    const payload = await sendToBackground('doc:payload', { documentId: purpose.documentId });
    const ok = await attachFileToElement(el, payload);
    sendToTop({ kind: 'fieldFilled', label: ok ? `${payload.fileName} attached` : '' });
  } else if (purpose.type === 'form-field') {
    fieldId = fieldIdFor(el);
  }
  const text = purpose.type === 'job-field' ? elementText(el) : labelFor(el);
  sendToTop({ kind: 'picked', purpose, locator, text, fieldId, frameUrl });
}

function pickHint(purpose: PickPurpose): string {
  switch (purpose.type) {
    case 'job-field':
      return `Click the job ${purpose.field}`;
    case 'form-field':
      return 'Click the form field to map';
    case 'send-answer':
      return 'Click the field to fill with this answer';
    case 'upload-field':
      return 'Click the upload field for this file';
  }
}

function startPick(purpose: PickPurpose): void {
  stopPicking?.();
  stopPicking = startPicker(document, {
    filter: purpose.type === 'job-field' ? 'any' : purpose.type === 'upload-field' ? 'upload' : 'field',
    hint: `${pickHint(purpose)} · Esc to cancel`,
    ignore: overlayHost(),
    onPick: (el) => {
      stopPicking = null;
      handlePick(purpose, el).catch(() => sendToTop({ kind: 'fieldFilled', label: '' }));
    },
    onCancel: () => {
      stopPicking = null;
      sendToTop({ kind: 'pickCancelled' });
    },
  });
}

async function handle(request: FrameRequest): Promise<unknown> {
  switch (request.kind) {
    case 'frame:scan':
      return scan(request.mapping);
    case 'frame:fill': {
      const plan = { ...request.plan, mappings: request.plan.mappings.filter((m) => locatorBelongsHere(m.locator.frameUrl)) };
      return fillForm(document, plan);
    }
    case 'frame:highlightClear':
      clearHighlights(document);
      return true;
    case 'frame:fillField':
      return fillFieldById(document, request.fieldId, request.value);
    case 'frame:attach':
      return attachFile(document, request.fieldId, request.target, request.file);
    case 'frame:pickStart':
      startPick(request.purpose);
      return true;
    case 'frame:pickStop':
      stopPicking?.();
      stopPicking = null;
      return true;
  }
}

/** Every frame (top and sub-frames) answers frame requests relayed by the background. */
export function registerFrameAgent(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.channel !== 'frame') return false;
    if (typeof message.frameId === 'number') thisFrameId = message.frameId;
    Promise.resolve()
      .then(() => handle(message.request as FrameRequest))
      .then(
        (result) => sendResponse(result ?? null),
        () => sendResponse(null),
      );
    return true;
  });
}
