import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';

export type ConfirmOptions = Omit<ConfirmDialogProps, 'onConfirm' | 'onCancel'>;

/**
 * Promise-based confirmation. Render `dialog` somewhere in the component and
 * `await confirm({...})` before destructive or AI-using actions.
 */
export function useConfirm(): { confirm: (options: ConfirmOptions) => Promise<boolean>; dialog: ReactNode } {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    resolver.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };

  const dialog = options ? <ConfirmDialog {...options} onConfirm={() => settle(true)} onCancel={() => settle(false)} /> : null;
  return { confirm, dialog };
}
