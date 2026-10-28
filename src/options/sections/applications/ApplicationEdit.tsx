import { useState } from 'react';
import { sendToBackground } from '@/shared/messaging/client';
import { patchApplication, timelineEvent } from '@/shared/storage';
import type { Application, CoverLetterContent, ResumeContent, ScreeningAnswer } from '@/shared/types';
import { Badge } from '@/ui/components/Badge';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { useConfirm } from '@/ui/components/useConfirm';
import { AnswersEditor } from '@/ui/editors/AnswersEditor';
import { CoverLetterEditor } from '@/ui/editors/CoverLetterEditor';
import { ResumeEditor } from '@/ui/editors/ResumeEditor';
import { ActionFeedback } from '../../components/ActionFeedback';
import { PageHeader } from '../../components/PageHeader';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useUnsavedWarning } from '../../hooks/useUnsavedWarning';
import { applicationHash } from '../../lib/routes';
import { EditTabs, type EditTab } from './EditTabs';

const json = (value: unknown) => JSON.stringify(value);

/** Edits the generated content of an application, then re-renders its files locally (no AI). */
export function ApplicationEdit({ app }: { app: Application }) {
  const [tab, setTab] = useState<EditTab>(app.resume ? 'resume' : app.coverLetter ? 'cover-letter' : 'answers');
  const [resume, setResume] = useState<ResumeContent | null>(app.resume ? app.resume.edited ?? app.resume.generated : null);
  const [letter, setLetter] = useState<CoverLetterContent | null>(app.coverLetter ? app.coverLetter.edited ?? app.coverLetter.generated : null);
  const [answers, setAnswers] = useState<ScreeningAnswer[]>(app.answers);
  const action = useAsyncAction();
  const { confirm, dialog } = useConfirm();

  const currentResume = app.resume ? app.resume.edited ?? app.resume.generated : null;
  const currentLetter = app.coverLetter ? app.coverLetter.edited ?? app.coverLetter.generated : null;
  const dirty = json(resume) !== json(currentResume) || json(letter) !== json(currentLetter) || json(answers) !== json(app.answers);
  useUnsavedWarning(dirty);

  const save = () =>
    action.run(
      'save',
      async () => {
        const changed: string[] = [];
        await patchApplication(app.id, (a) => {
          if (a.resume && resume && json(resume) !== json(currentResume)) {
            a.resume.edited = resume;
            changed.push('resume');
          }
          if (a.coverLetter && letter && json(letter) !== json(currentLetter)) {
            a.coverLetter.edited = letter;
            changed.push('cover letter');
          }
          if (json(answers) !== json(app.answers)) {
            a.answers = answers.filter((x) => x.question.trim() || x.answer.trim());
            changed.push('answers');
          }
          if (changed.length) a.timeline.push(timelineEvent('edited', `Edited ${changed.join(', ')}`));
          return a;
        });
        await sendToBackground('app:render', { applicationId: app.id });
      },
      'Saved. Files were re-rendered locally with your current design.',
    );

  const reset = async (part: 'resume' | 'cover-letter') => {
    const ok = await confirm({
      title: `Reset the ${part === 'resume' ? 'resume' : 'cover letter'} to the generated version?`,
      message: 'Your edits will be discarded and the files re-rendered locally. No AI is used.',
      confirmLabel: 'Reset',
      danger: true,
    });
    if (!ok) return;
    await action.run(
      `reset:${part}`,
      async () => {
        await patchApplication(app.id, (a) => {
          if (part === 'resume' && a.resume) a.resume.edited = null;
          if (part === 'cover-letter' && a.coverLetter) a.coverLetter.edited = null;
          a.timeline.push(timelineEvent('edited', `Reset ${part === 'resume' ? 'resume' : 'cover letter'} to the generated version`));
          return a;
        });
        if (part === 'resume' && app.resume) setResume(app.resume.generated);
        if (part === 'cover-letter' && app.coverLetter) setLetter(app.coverLetter.generated);
        await sendToBackground('app:render', { applicationId: app.id });
      },
      'Reset to the generated version and re-rendered.',
    );
  };

  return (
    <div className="jp-opt-section">
      <PageHeader
        back={{ href: applicationHash(app.id), label: 'Back to application' }}
        title={`Edit content · ${app.job.title || 'Untitled job'}`}
        description="Changes are saved to this application and the files are re-rendered locally with your current design. No AI is used."
        actions={
          <>
            {dirty ? <Badge tone="warning">Unsaved changes</Badge> : <Badge tone="success">Saved</Badge>}
            <Button variant="primary" onClick={() => void save()} disabled={!dirty} loading={action.busy === 'save'}>
              Save and re-render
            </Button>
          </>
        }
      />
      <ActionFeedback error={action.error} message={action.message} />
      <EditTabs value={tab} onChange={setTab} counts={{ answers: answers.length }} />
      <div role="tabpanel" id={`jp-edit-panel-${tab}`} aria-labelledby={`jp-edit-tab-${tab}`}>
        {tab === 'resume' && (
          <Card
            title="Resume"
            actions={
              app.resume?.edited ? (
                <Button size="sm" onClick={() => void reset('resume')} loading={action.busy === 'reset:resume'}>
                  Reset to generated
                </Button>
              ) : undefined
            }
          >
            {resume ? <ResumeEditor value={resume} onChange={setResume} /> : <p className="jp-muted">No tailored resume for this application yet.</p>}
          </Card>
        )}
        {tab === 'cover-letter' && (
          <Card
            title="Cover letter"
            actions={
              app.coverLetter?.edited ? (
                <Button size="sm" onClick={() => void reset('cover-letter')} loading={action.busy === 'reset:cover-letter'}>
                  Reset to generated
                </Button>
              ) : undefined
            }
          >
            {letter ? (
              <CoverLetterEditor value={letter} onChange={setLetter} />
            ) : (
              <p className="jp-muted">
                No cover letter was generated for this application. You can generate one from the <a href={applicationHash(app.id)}>application page</a>.
              </p>
            )}
          </Card>
        )}
        {tab === 'answers' && (
          <Card title="Screening answers">
            <AnswersEditor value={answers} onChange={setAnswers} />
          </Card>
        )}
      </div>
      {dialog}
    </div>
  );
}
