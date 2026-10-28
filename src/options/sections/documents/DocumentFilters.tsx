import { OUTPUT_FORMATS, type DocumentKind, type StoredDocument } from '@/shared/types';
import { SelectField } from '@/ui/components/SelectField';
import { TextField } from '@/ui/components/TextField';
import { DOCUMENT_KIND_LABELS, type DocumentFilter } from '../../lib/documents';

export interface DocumentFiltersProps {
  value: DocumentFilter;
  onChange: (value: DocumentFilter) => void;
}

const KIND_OPTIONS: { value: DocumentKind | 'all'; label: string }[] = [
  { value: 'all', label: 'All kinds' },
  ...(Object.entries(DOCUMENT_KIND_LABELS) as [DocumentKind, string][]).map(([value, label]) => ({ value, label })),
];
const FORMAT_OPTIONS: { value: StoredDocument['format'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All formats' },
  ...OUTPUT_FORMATS.map((f) => ({ value: f.id, label: f.label })),
  { value: 'other', label: 'Other' },
];
const SOURCE_OPTIONS: { value: StoredDocument['source'] | 'all'; label: string }[] = [
  { value: 'all', label: 'Generated and uploaded' },
  { value: 'generated', label: 'Generated' },
  { value: 'uploaded', label: 'Uploaded' },
];

export function DocumentFilters({ value, onChange }: DocumentFiltersProps) {
  return (
    <div className="jp-opt-filters" role="search">
      <TextField
        className="jp-opt-filters__search"
        label="Search"
        type="search"
        value={value.search}
        placeholder="File name, job title or company"
        onChange={(search) => onChange({ ...value, search })}
      />
      <SelectField label="Kind" value={value.kind} options={KIND_OPTIONS} onChange={(kind) => onChange({ ...value, kind })} />
      <SelectField label="Format" value={value.format} options={FORMAT_OPTIONS} onChange={(format) => onChange({ ...value, format })} />
      <SelectField label="Source" value={value.source} options={SOURCE_OPTIONS} onChange={(source) => onChange({ ...value, source })} />
    </div>
  );
}
