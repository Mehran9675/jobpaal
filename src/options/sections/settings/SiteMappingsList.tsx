import { deleteSiteMapping } from '@/shared/storage';
import type { SiteMapping } from '@/shared/types';
import { Card } from '@/ui/components/Card';
import { Spinner } from '@/ui/components/Spinner';
import { useConfirm } from '@/ui/components/useConfirm';
import { useSiteMappings } from '../../hooks/useSiteMappings';
import { SiteMappingItem } from './SiteMappingItem';

/** Field mappings the user taught JobPaal per site with the field guide. */
export function SiteMappingsList() {
  const mappings = useSiteMappings();
  const { confirm, dialog } = useConfirm();

  const remove = async (mapping: SiteMapping) => {
    const ok = await confirm({
      title: `Forget ${mapping.host}?`,
      message: 'All picked job fields and form field mappings for this site are removed. Automatic detection still works.',
      confirmLabel: 'Forget site',
      danger: true,
    });
    if (ok) await deleteSiteMapping(mapping.host);
  };

  return (
    <Card title={`Site field mappings${mappings ? ` (${mappings.length})` : ''}`}>
      {!mappings ? (
        <Spinner label="Loading site mappings" />
      ) : mappings.length === 0 ? (
        <p className="jp-small jp-muted">None yet. Use the field guide in the overlay to teach JobPaal where things are on a site; it saves automatically.</p>
      ) : (
        <ul className="jp-opt-saved">
          {mappings.map((mapping) => (
            <SiteMappingItem key={mapping.host} mapping={mapping} onDelete={() => void remove(mapping)} />
          ))}
        </ul>
      )}
      {dialog}
    </Card>
  );
}
