import type { Settings } from '@/shared/types';
import { PageHeader } from '../../components/PageHeader';
import { AppearanceSettings } from './AppearanceSettings';
import { AutofillSettingsCard } from './AutofillSettingsCard';
import { DataManagement } from './DataManagement';
import { OverlaySettingsCard } from './OverlaySettingsCard';
import { SavedAnswersList } from './SavedAnswersList';
import { SiteMappingsList } from './SiteMappingsList';

export function SettingsSection({ settings }: { settings: Settings }) {
  return (
    <div className="jp-opt-section">
      <PageHeader title="Settings" description="Appearance, the on-page overlay, autofill behaviour and your locally stored data. Changes are saved immediately." />
      <AppearanceSettings theme={settings.theme} />
      <OverlaySettingsCard overlay={settings.overlay} />
      <AutofillSettingsCard autofill={settings.autofill} alwaysCoverLetter={settings.alwaysCoverLetter} />
      <SavedAnswersList />
      <SiteMappingsList />
      <DataManagement />
    </div>
  );
}
