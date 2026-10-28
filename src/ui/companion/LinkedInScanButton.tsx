import { useState } from 'react';
import { sendToBackground, sendToContent } from '@/shared/messaging';
import { errorMessage } from '@/shared/utils/errors';
import { Button } from '@/ui/components/Button';

/** Shown on LinkedIn profile pages: scans the open profile into the management page for review. */
export function LinkedInScanButton({ tabId }: { tabId: number }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const scan = async () => {
    setBusy(true);
    try {
      const result = await sendToContent(tabId, 'content:scanLinkedIn', {});
      if (result.profile) await sendToBackground('linkedin:import', { profile: result.profile });
      setMessage(result.message);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="jp-stack" style={{ gap: 4 }}>
      <Button onClick={scan} loading={busy}>
        Scan this LinkedIn profile
      </Button>
      {message && <span className="jp-small jp-muted">{message}</span>}
    </div>
  );
}
