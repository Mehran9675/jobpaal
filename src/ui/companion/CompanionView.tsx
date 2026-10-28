import { TERMS_VERSION } from '@/shared/defaults/settings';
import { sendToBackground, sendToContent } from '@/shared/messaging';
import { Button } from '@/ui/components/Button';
import { MatchPanel } from '@/ui/components/MatchPanel';
import { Notice } from '@/ui/components/Notice';
import { useAiSettings } from '@/ui/hooks/useAiSettings';
import { useSettings } from '@/ui/hooks/useSettings';
import { useTheme } from '@/ui/hooks/useTheme';
import { openSidePanel } from '@/ui/lib/sidePanel';
import { CompanionActions } from './CompanionActions';
import { CompanionAnswers } from './CompanionAnswers';
import { CompanionFiles } from './CompanionFiles';
import { CompanionSection } from './CompanionSection';
import { LinkedInScanButton } from './LinkedInScanButton';
import { OverlaySwitch } from './OverlaySwitch';
import { PageStatusCard } from './PageStatusCard';
import { ProviderStatus } from './ProviderStatus';
import { RecentApplicationsList } from './RecentApplicationsList';
import { useActiveTab } from './useActiveTab';
import { useApplicationData } from './useApplicationData';
import { useContentState } from './useContentState';

export interface CompanionViewProps {
  variant: 'popup' | 'sidepanel';
}

/** The popup and the side panel share this view: page status, actions, match, files, answers. */
export function CompanionView({ variant }: CompanionViewProps) {
  const settings = useSettings();
  const ai = useAiSettings();
  const theme = useTheme(settings?.theme);
  const tab = useActiveTab();
  const { state, unavailable, refresh } = useContentState(tab);
  const { application, documents, analysis } = useApplicationData(state);
  const aiReady = Boolean(ai?.activeProviderId && ai.providers.some((p) => p.id === ai.activeProviderId));
  const termsAccepted = settings?.terms?.version === TERMS_VERSION;
  const hasDocuments = documents.some((d) => d.kind === 'resume');
  const onLinkedInProfile = /linkedin\.com\/in\//.test(tab?.url ?? '');

  return (
    <div className={`jp-root jp-companion jp-companion--${variant}`} data-theme={theme}>
      <header className="jp-companion__header">
        <img src={chrome.runtime.getURL('icons/icon-32.png')} alt="" width={22} height={22} />
        <strong className="jp-grow">JobPaal</strong>
        {settings && <OverlaySwitch enabled={settings.overlay.enabled} />}
      </header>

      <main className="jp-companion__body">
        {settings && !termsAccepted && (
          <Notice tone="warning">
            Accept the terms before using JobPaal.{' '}
            <button type="button" className="jp-ov-link" onClick={() => sendToBackground('options:open', { section: 'terms' })}>
              Open terms
            </button>
          </Notice>
        )}
        {unavailable && <Notice>{unavailable}</Notice>}
        {tab?.id !== undefined && state && (
          <>
            <PageStatusCard state={state} />
            <CompanionActions tabId={tab.id} state={state} hasDocuments={hasDocuments} aiReady={aiReady && termsAccepted} onChanged={refresh} />
            {onLinkedInProfile && <LinkedInScanButton tabId={tab.id} />}
            <CompanionSection title="Match">
              <MatchPanel
                analysis={analysis}
                aiReady={aiReady && termsAccepted}
                canRun={state.detection.hasValidDescription}
                onRun={() => sendToContent(tab.id!, 'content:match', {}).finally(refresh)}
                compact={variant === 'popup'}
              />
            </CompanionSection>
            <CompanionSection title={`Files${documents.length ? ` (${documents.length})` : ''}`} defaultOpen={documents.length > 0}>
              <CompanionFiles documents={documents} applicationId={application?.id ?? null} />
            </CompanionSection>
            <CompanionSection title={`Answers${application?.answers.length ? ` (${application.answers.length})` : ''}`} defaultOpen={variant === 'sidepanel'}>
              <CompanionAnswers answers={application?.answers ?? []} />
            </CompanionSection>
          </>
        )}
        <CompanionSection title="Recent applications" defaultOpen={variant === 'sidepanel' || !state}>
          <RecentApplicationsList limit={variant === 'popup' ? 4 : 10} />
        </CompanionSection>
      </main>

      <footer className="jp-companion__footer">
        <ProviderStatus />
        <div className="jp-row">
          <Button size="sm" className="jp-grow" onClick={() => sendToBackground('options:open', {})}>
            Open JobPaal
          </Button>
          {variant === 'popup' && (
            <Button size="sm" variant="ghost" onClick={() => openSidePanel().then((ok) => ok && window.close())}>
              Side panel
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
