import { listDocuments, watchDocuments } from '@/shared/storage';
import type { StoredDocument } from '@/shared/types';
import { useAsyncStore } from './useAsyncStore';

export function useDocuments(): StoredDocument[] | undefined {
  return useAsyncStore(listDocuments, watchDocuments).value;
}
