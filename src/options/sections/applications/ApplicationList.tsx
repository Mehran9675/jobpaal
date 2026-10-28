import { useMemo, useState } from 'react';
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from '@/shared/types';
import { Card } from '@/ui/components/Card';
import { EmptyState } from '@/ui/components/EmptyState';
import { SelectField } from '@/ui/components/SelectField';
import { TextField } from '@/ui/components/TextField';
import { PageHeader } from '../../components/PageHeader';
import { filterApplications, type ApplicationFilter } from '../../lib/applicationFilters';
import { ApplicationRow } from './ApplicationRow';

const STATUS_OPTIONS: { value: ApplicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  ...APPLICATION_STATUSES.map((s) => ({ value: s.id, label: s.label })),
];

export function ApplicationList({ apps }: { apps: Application[] }) {
  const [filter, setFilter] = useState<ApplicationFilter>({ search: '', status: 'all' });
  const shown = useMemo(() => filterApplications(apps, filter), [apps, filter]);
  return (
    <div className="jp-opt-section">
      <PageHeader title="Applications" description="Every application you tailored, with its documents, answers, notes and timeline." />
      <Card>
        <div className="jp-stack jp-stack--lg">
          <div className="jp-opt-filters" role="search">
            <TextField
              className="jp-opt-filters__search"
              label="Search"
              type="search"
              value={filter.search}
              placeholder="Job title, company or site"
              onChange={(search) => setFilter((f) => ({ ...f, search }))}
            />
            <SelectField label="Status" value={filter.status} options={STATUS_OPTIONS} onChange={(status) => setFilter((f) => ({ ...f, status }))} />
          </div>
          {apps.length === 0 ? (
            <EmptyState>No applications yet. Open a job posting, click the JobPaal button and press Tailor and fill.</EmptyState>
          ) : shown.length === 0 ? (
            <EmptyState>No applications match your search.</EmptyState>
          ) : (
            <div className="jp-opt-table-wrap">
              <table className="jp-opt-table">
                <thead>
                  <tr>
                    <th scope="col">Job</th>
                    <th scope="col">Site</th>
                    <th scope="col">Status</th>
                    <th scope="col">Match</th>
                    <th scope="col">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((app) => (
                    <ApplicationRow key={app.id} app={app} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="jp-small jp-faint">
            {shown.length} of {apps.length} shown · sorted by last update
          </p>
        </div>
      </Card>
    </div>
  );
}
