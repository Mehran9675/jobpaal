import type { BackgroundRequestType, BackgroundRequests } from '@/shared/messaging';

export type Handler<K extends BackgroundRequestType> = (
  payload: BackgroundRequests[K]['req'],
  sender: chrome.runtime.MessageSender,
) => Promise<BackgroundRequests[K]['res']>;

export type HandlerMap = { [K in BackgroundRequestType]: Handler<K> };
