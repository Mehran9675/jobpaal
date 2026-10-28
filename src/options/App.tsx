import { useEffect } from 'react';
import { hasAcceptedTerms } from '@/shared/legal/terms';
import { Spinner } from '@/ui/components/Spinner';
import { useSettings } from '@/ui/hooks/useSettings';
import { useTheme } from '@/ui/hooks/useTheme';
import { Sidebar } from './components/Sidebar';
import { TermsGate } from './components/TermsGate';
import { useHashRoute } from './hooks/useHashRoute';
import { SECTIONS } from './lib/routes';
import { SectionView } from './SectionView';

export function App() {
  const settings = useSettings();
  const theme = useTheme(settings?.theme);
  const route = useHashRoute();
  const accepted = hasAcceptedTerms(settings);

  useEffect(() => {
    const label = SECTIONS.find((s) => s.id === route.section)?.label;
    document.title = label ? `${label} · JobPaal` : 'JobPaal';
  }, [route.section]);

  useEffect(() => {
    if (!route.focus) window.scrollTo(0, 0);
  }, [route.section, route.applicationId, route.view, route.focus]);

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
    document.body.style.margin = '0';
  }, [theme]);

  return (
    <div className="jp-root jp-opt-app" data-theme={theme}>
      <Sidebar current={route.section} locked={settings !== undefined && !accepted} />
      <main className="jp-opt-main" id="main" tabIndex={-1}>
        {settings === undefined ? (
          <div className="jp-opt-loading">
            <Spinner label="Loading" />
          </div>
        ) : !accepted && route.section !== 'terms' ? (
          <TermsGate />
        ) : (
          <SectionView route={route} settings={settings} />
        )}
      </main>
    </div>
  );
}
