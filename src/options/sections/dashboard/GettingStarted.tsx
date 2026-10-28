import { Card } from '@/ui/components/Card';

export interface GettingStartedProps {
  profileReady: boolean;
  providerReady: boolean;
  hasApplications: boolean;
}

export function GettingStarted({ profileReady, providerReady, hasApplications }: GettingStartedProps) {
  const steps = [
    {
      done: profileReady,
      label: 'Add your profile',
      detail: (
        <>
          Fill in <a href="#profile">My profile</a> or import an existing resume (PDF, DOCX, JSON Resume, text) or a LinkedIn profile.
        </>
      ),
    },
    {
      done: providerReady,
      label: 'Connect an AI provider',
      detail: (
        <>
          Add your own API key or a local model in <a href="#providers">AI providers</a>, then test the connection.
        </>
      ),
    },
    {
      done: false,
      label: 'Pick a resume design',
      detail: (
        <>
          Choose a template, colours and file formats in <a href="#designs">Resume designs</a>. The preview works without AI.
        </>
      ),
    },
    {
      done: hasApplications,
      label: 'Tailor your first application',
      detail: 'Open a job posting, click the JobPaal button and press Tailor and fill. Review everything, then submit it yourself.',
    },
  ];
  return (
    <Card title="Getting started">
      <ol className="jp-opt-checklist jp-opt-checklist--steps">
        {steps.map((step) => (
          <li key={step.label} className={step.done ? 'is-done' : undefined}>
            <span aria-hidden="true">{step.done ? '✓' : '○'}</span>
            <span>
              <span className="jp-strong">{step.label}</span>
              {step.done && <span className="jp-sr-only"> (done)</span>}
              <br />
              <span className="jp-small jp-muted">{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
