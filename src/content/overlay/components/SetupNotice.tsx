import { openManagement } from '@/content/controller/documentActions';

export interface SetupNoticeProps {
  termsAccepted: boolean;
  aiReady: boolean;
  profileReady: boolean;
}

/** Explains what is still needed before AI features work. Autofill works without AI. */
export function SetupNotice({ termsAccepted, aiReady, profileReady }: SetupNoticeProps) {
  if (termsAccepted && aiReady && profileReady) return null;
  const steps: { text: string; section: string }[] = [];
  if (!termsAccepted) steps.push({ text: 'Accept the terms', section: 'terms' });
  if (!profileReady) steps.push({ text: 'Add your profile or import a resume', section: 'profile' });
  if (!aiReady) steps.push({ text: 'Connect an AI provider (tailoring, answers and matching need one)', section: 'providers' });
  return (
    <div className="jp-notice jp-notice--warning">
      <div className="jp-stack" style={{ gap: 4 }}>
        <strong>Finish setting up JobPaal</strong>
        {steps.map((step) => (
          <button key={step.section} type="button" className="jp-ov-link" style={{ textAlign: 'left' }} onClick={() => openManagement(step.section)}>
            {step.text}
          </button>
        ))}
      </div>
    </div>
  );
}
