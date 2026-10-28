import { hasDocumentsForPage, runMatch } from '@/content/controller/jobActions';
import type { OverlayState } from '@/content/controller/state';
import { MatchPanel } from '@/ui/components/MatchPanel';
import { AnswersSection } from './AnswersSection';
import { BusyBar } from './BusyBar';
import { DescriptionPanel } from './DescriptionPanel';
import { DocumentsSection } from './DocumentsSection';
import { FieldGuide } from './FieldGuide';
import { FillSummary } from './FillSummary';
import { JobSummary } from './JobSummary';
import { MainActions } from './MainActions';
import { MessageBar } from './MessageBar';
import { PasteBox } from './PasteBox';
import { RecentJobs } from './RecentJobs';
import { Section } from './Section';
import { SetupNotice } from './SetupNotice';
import { StatusBanner } from './StatusBanner';

function tailorBlockedReason(state: OverlayState): string {
  if (!state.termsAccepted) return 'Accept the terms in the management page first.';
  if (!state.aiReady) return 'Tailoring needs an AI provider. Connect one in JobPaal → AI providers.';
  if (!state.profileReady) return 'Add your profile first so there is something real to tailor.';
  if (!state.detection.hasValidDescription) return 'Provide a real job description first (pick, paste or recent).';
  return '';
}

export function PanelBody({ state, light }: { state: OverlayState; light: 'green' | 'red' }) {
  const busy = Boolean(state.busy) || Boolean(state.picking);
  const blocked = tailorBlockedReason(state);
  const job = state.detection.job;
  const app = state.application;
  const coverLetterInForm = state.form.hasCoverLetterField || Boolean(app?.coverLetter);
  return (
    <>
      {state.busy && <BusyBar text={state.busy} />}
      {state.message && <MessageBar message={state.message} />}
      <SetupNotice termsAccepted={state.termsAccepted} aiReady={state.aiReady} profileReady={state.profileReady} />
      <StatusBanner light={light} issues={state.detection.issues} forced={state.forced} />

      {state.tool === 'guide' && <FieldGuide host={state.host} mapping={state.mapping} disabled={busy} />}
      {state.tool === 'paste' && <PasteBox />}
      {state.tool === 'recent' && <RecentJobs />}

      <MainActions hasDocuments={hasDocumentsForPage()} canTailor={!blocked} busy={busy} tailorBlockedReason={blocked} />
      {state.lastFill && <FillSummary report={state.lastFill} />}

      <Section title="Job">
        <JobSummary job={job} />
      </Section>
      <Section title="Job description" aside={state.detection.hasValidDescription ? undefined : 'missing'}>
        <DescriptionPanel
          job={job}
          valid={state.detection.hasValidDescription}
          overridden={state.override.fields.description !== undefined}
          disabled={busy}
        />
      </Section>
      <Section title="Match">
        <MatchPanel
          analysis={state.analysis}
          aiReady={state.aiReady && state.termsAccepted}
          running={state.busy?.startsWith('Matching') ?? false}
          canRun={state.detection.hasValidDescription && state.profileReady && !busy}
          onRun={runMatch}
          compact
        />
      </Section>
      <AnswersSection
        generated={app?.answers ?? []}
        manual={state.manualAnswers}
        saved={state.savedAnswers}
        questionCount={state.form.screeningQuestions.length}
        aiReady={state.aiReady && state.termsAccepted}
        disabled={busy}
      />
      <DocumentsSection
        documents={state.documents}
        hasCoverLetter={coverLetterInForm}
        aiReady={state.aiReady && state.termsAccepted}
        disabled={busy}
        canTailor={!blocked}
      />
    </>
  );
}
