import { useEffect, useState } from 'react';
import { documentStorageSummary } from '@/shared/storage';
import type { DocumentKind, StoredDocument } from '@/shared/types';
import { StatTile } from '@/ui/components/StatTile';
import { DOCUMENT_KIND_LABELS } from '../../lib/documents';
import { formatBytes } from '../../lib/format';

type Summary = Awaited<ReturnType<typeof documentStorageSummary>>;

/** Count, size and per-kind breakdown of stored documents. Recomputed when documents change. */
export function StorageSummary({ docs }: { docs: StoredDocument[] }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  useEffect(() => {
    let alive = true;
    documentStorageSummary().then((s) => alive && setSummary(s));
    return () => {
      alive = false;
    };
  }, [docs]);
  if (!summary) return null;
  return (
    <div className="jp-opt-stats" role="group" aria-label="Storage summary">
      <StatTile label="Documents" value={summary.count} />
      <StatTile label="Storage used" value={formatBytes(summary.bytes)} hint="In this browser only" />
      {(Object.keys(DOCUMENT_KIND_LABELS) as DocumentKind[]).map((kind) => (
        <StatTile key={kind} label={DOCUMENT_KIND_LABELS[kind]} value={summary.byKind[kind] ?? 0} />
      ))}
    </div>
  );
}
