import { toEnvelope, type BackgroundMessage, type BackgroundRequestType } from '@/shared/messaging';
import { aiStatusHandler, draftAnswerHandler, listModelsHandler, parseResumeHandler, testProviderHandler } from './handlers/aiHandlers';
import { documentPayloadHandler, downloadDocumentHandler, openDocumentHandler } from './handlers/documentHandlers';
import { broadcastHandler, sendFrameHandler, toTopHandler } from './handlers/frameHandlers';
import { analyzeJobHandler, regenerateHandler, renderHandler, saveJobHandler, tailorHandler } from './handlers/jobHandlers';
import { linkedInImportHandler, openOptionsHandler, openSidePanelHandler } from './handlers/navigationHandlers';
import type { Handler, HandlerMap } from './handlers/types';

const handlers: HandlerMap = {
  'job:save': saveJobHandler,
  'job:analyze': analyzeJobHandler,
  'pipeline:tailor': tailorHandler,
  'app:regenerate': regenerateHandler,
  'app:render': renderHandler,
  'answer:draft': draftAnswerHandler,
  'ai:test': testProviderHandler,
  'ai:models': listModelsHandler,
  'ai:parse-resume': parseResumeHandler,
  'ai:status': aiStatusHandler,
  'doc:payload': documentPayloadHandler,
  'doc:open': openDocumentHandler,
  'doc:download': downloadDocumentHandler,
  'options:open': openOptionsHandler,
  'sidepanel:open': openSidePanelHandler,
  'frames:broadcast': broadcastHandler,
  'frames:send': sendFrameHandler,
  'frames:toTop': toTopHandler,
  'linkedin:import': linkedInImportHandler,
};

function isBackgroundMessage(message: unknown): message is BackgroundMessage {
  return Boolean(message && typeof message === 'object' && (message as { channel?: string }).channel === 'bg');
}

/** Routes typed requests; always answers with an Envelope so errors reach the caller. */
export function registerRouter(): void {
  chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    if (!isBackgroundMessage(message)) return false;
    const handler = handlers[message.type as BackgroundRequestType] as Handler<BackgroundRequestType> | undefined;
    if (!handler) {
      sendResponse({ ok: false, error: `Unknown request ${message.type}` });
      return false;
    }
    toEnvelope(() => handler(message.payload as never, sender)).then(sendResponse);
    return true;
  });
}
