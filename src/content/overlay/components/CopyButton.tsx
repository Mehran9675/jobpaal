import { useState } from 'react';
import { Button } from '@/ui/components/Button';

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Button size="sm" onClick={copy} disabled={!text.trim()}>
      {copied ? 'Copied' : label}
    </Button>
  );
}
