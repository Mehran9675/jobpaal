import { useRef, type ReactNode } from 'react';
import { Button, type ButtonProps } from '@/ui/components/Button';

export interface FileButtonProps extends Omit<ButtonProps, 'onClick' | 'onChange'> {
  accept?: string;
  onFile: (file: File) => void;
  children: ReactNode;
}

/** A normal, keyboard-accessible button that opens a file picker. */
export function FileButton({ accept, onFile, children, ...rest }: FileButtonProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button {...rest} onClick={() => input.current?.click()}>
        {children}
      </Button>
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onFile(file);
        }}
      />
    </>
  );
}
