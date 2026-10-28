import { listSavedAnswers, watchSavedAnswers } from '@/shared/storage';
import type { SavedAnswer } from '@/shared/types';
import { useAsyncStore } from './useAsyncStore';

export function useSavedAnswers(): SavedAnswer[] | undefined {
  return useAsyncStore(listSavedAnswers, watchSavedAnswers).value;
}
