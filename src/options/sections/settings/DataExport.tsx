import { useState } from 'react';
import { exportData } from '@/shared/storage';
import { Button } from '@/ui/components/Button';
import { Checkbox } from '@/ui/components/Checkbox';
import { useConfirm } from '@/ui/components/useConfirm';
import { ActionFeedback } from '../../components/ActionFeedback';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { downloadJson, todayStamp } from '../../lib/download';

export function DataExport() {
  const [includeKeys, setIncludeKeys] = useState(false);
  const action = useAsyncAction();
  const { confirm, dialog } = useConfirm();

  const run = async () => {
    if (includeKeys) {
      const ok = await confirm({
        title: 'Include API keys?',
        message: 'Anyone with the export file can use your AI provider accounts. Store the file somewhere safe and do not share it.',
        confirmLabel: 'Export with keys',
        danger: true,
      });
      if (!ok) return;
    }
    await action.run(
      'export',
      async () => downloadJson(await exportData(includeKeys), `jobpaal-export-${todayStamp()}.json`),
      'Export downloaded.',
    );
  };

  return (
    <section className="jp-stack" aria-labelledby="jp-data-export">
      <h3 id="jp-data-export" className="jp-opt-subheading">
        Export everything
      </h3>
      <p className="jp-small jp-muted">One JSON file with your profile, applications, documents, settings, saved answers, mappings and usage.</p>
      <Checkbox checked={includeKeys} onChange={setIncludeKeys} label="Include API keys (off by default)" />
      <div>
        <Button onClick={() => void run()} loading={action.busy === 'export'}>
          Export as JSON
        </Button>
      </div>
      <ActionFeedback error={action.error} message={action.message} />
      {dialog}
    </section>
  );
}
