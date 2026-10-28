import type { ReactNode } from 'react';
import { Notice } from '@/ui/components/Notice';

/** Shown where an AI feature is disabled because no provider is connected and active. */
export function AiRequiredNotice({ children }: { children?: ReactNode }) {
  return (
    <Notice tone="warning">
      {children ?? 'This feature uses AI.'} Connect and activate a provider in <a href="#providers">AI providers</a> to enable it.
    </Notice>
  );
}
