import { importData } from '@/shared/storage';
import { useConfirm } from '@/ui/components/useConfirm';
import { ActionFeedback } from '../../components/ActionFeedback';
import { FileButton } from '../../components/FileButton';
import { useAsyncAction } from '../../hooks/useAsyncAction';

export function DataImport() {
  const action = useAsyncAction();
  const { confirm, dialog } = useConfirm();

  const onFile = async (file: File) => {
    let bundle: unknown;
    try {
      bundle = JSON.parse(await file.text());
    } catch {
      await action.run('import', async () => {
        throw new Error('This file is not valid JSON.');
      });
      return;
    }
    const ok = await confirm({
      title: 'Import this export?',
      message: `Data in ${file.name} replaces the matching data stored in this browser (for example, your profile and applications). Data not in the file is kept.`,
      confirmLabel: 'Import',
      danger: true,
    });
    if (!ok) return;
    await action.run('import', () => importData(bundle), (count) => `Imported ${count} item${count === 1 ? '' : 's'}.`);
  };

  return (
    <section className="jp-stack" aria-labelledby="jp-data-import">
      <h3 id="jp-data-import" className="jp-opt-subheading">
        Import
      </h3>
      <p className="jp-small jp-muted">Restore a JobPaal export file.</p>
      <div>
        <FileButton accept=".json,application/json" onFile={(f) => void onFile(f)} loading={action.busy === 'import'}>
          Choose export file…
        </FileButton>
      </div>
      <ActionFeedback error={action.error} message={action.message} />
      {dialog}
    </section>
  );
}
