import type { Settings } from '@/shared/types';
import type { Route } from './lib/routes';
import { ApplicationsSection } from './sections/applications/ApplicationsSection';
import { DashboardSection } from './sections/dashboard/DashboardSection';
import { DesignsSection } from './sections/designs/DesignsSection';
import { DocumentsSection } from './sections/documents/DocumentsSection';
import { ProfileSection } from './sections/profile/ProfileSection';
import { PromptsSection } from './sections/prompts/PromptsSection';
import { ProvidersSection } from './sections/providers/ProvidersSection';
import { SettingsSection } from './sections/settings/SettingsSection';
import { TermsSection } from './sections/terms/TermsSection';

export interface SectionViewProps {
  route: Route;
  settings: Settings;
}

/** Renders the section for the current route. */
export function SectionView({ route, settings }: SectionViewProps) {
  switch (route.section) {
    case 'dashboard':
      return <DashboardSection />;
    case 'profile':
      return <ProfileSection />;
    case 'documents':
      return <DocumentsSection />;
    case 'applications':
      return <ApplicationsSection applicationId={route.applicationId} view={route.view} />;
    case 'designs':
      return <DesignsSection settings={settings} />;
    case 'providers':
      return <ProvidersSection focus={route.focus} />;
    case 'prompts':
      return <PromptsSection />;
    case 'settings':
      return <SettingsSection settings={settings} />;
    case 'terms':
      return <TermsSection settings={settings} />;
  }
}
