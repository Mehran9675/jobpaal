import { useMemo, useState } from 'react';
import type { Application, StoredDocument } from '@/shared/types';
import { Card } from '@/ui/components/Card';
import { EmptyState } from '@/ui/components/EmptyState';
import { Spinner } from '@/ui/components/Spinner';
import { useApplications } from '@/ui/hooks/useApplications';
import { useDocuments } from '@/ui/hooks/useDocuments';
import { PageHeader } from '../../components/PageHeader';
import { EMPTY_DOCUMENT_FILTER, filterDocuments, type DocumentFilter } from '../../lib/documents';
import { DocumentFilters } from './DocumentFilters';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { DocumentTable } from './DocumentTable';
import { StorageSummary } from './StorageSummary';

export function DocumentsSection() {
  const docs = useDocuments();
  const apps = useApplications();
  const [filter, setFilter] = useState<DocumentFilter>(EMPTY_DOCUMENT_FILTER);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const appsById = useMemo(() => Object.fromEntries((apps ?? []).map((a) => [a.id, a])) as Record<string, Application>, [apps]);
  const shown = useMemo(() => filterDocuments(docs ?? [], filter, appsById), [docs, filter, appsById]);
  const preview: StoredDocument | undefined = docs?.find((d) => d.id === previewId);

  if (!docs || !apps) {
    return (
      <div className="jp-opt-loading">
        <Spinner label="Loading documents" />
      </div>
    );
  }

  return (
    <div className="jp-opt-section">
      <PageHeader
        title="Documents"
        description="Every generated and uploaded file, stored locally. File names never include the employer or role."
        actions={
          <a className="jp-btn" href="#designs">
            Upload your own files
          </a>
        }
      />
      <StorageSummary docs={docs} />
      <Card>
        <div className="jp-stack jp-stack--lg">
          <DocumentFilters value={filter} onChange={setFilter} />
          {docs.length === 0 ? (
            <EmptyState>No documents yet. Tailor an application or upload your own files in Resume designs.</EmptyState>
          ) : shown.length === 0 ? (
            <EmptyState>No documents match these filters.</EmptyState>
          ) : (
            <DocumentTable docs={shown} appsById={appsById} onPreview={(doc) => setPreviewId(doc.id)} />
          )}
        </div>
      </Card>
      {preview && <DocumentPreviewModal document={preview} application={preview.applicationId ? appsById[preview.applicationId] : undefined} onClose={() => setPreviewId(null)} />}
    </div>
  );
}
