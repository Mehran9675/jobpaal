import { Card } from '@/ui/components/Card';
import { DataDelete } from './DataDelete';
import { DataExport } from './DataExport';
import { DataImport } from './DataImport';

export function DataManagement() {
  return (
    <Card title="Your data">
      <div className="jp-stack jp-stack--lg">
        <p className="jp-small jp-muted">Everything JobPaal stores lives in this browser. Export it for a backup or to move to another browser, import it back, or delete it.</p>
        <DataExport />
        <hr className="jp-divider" />
        <DataImport />
        <hr className="jp-divider" />
        <DataDelete />
      </div>
    </Card>
  );
}
