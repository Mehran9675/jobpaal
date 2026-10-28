import { useEffect, useState } from 'react';
import { createDefaultPromptSettings } from '@/shared/defaults/prompts';
import { getPromptSettings, savePromptSettings } from '@/shared/storage';
import type { AiTask, PromptSettings } from '@/shared/types';
import { Badge } from '@/ui/components/Badge';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Spinner } from '@/ui/components/Spinner';
import { TagInput } from '@/ui/components/TagInput';
import { TextField } from '@/ui/components/TextField';
import { useConfirm } from '@/ui/components/useConfirm';
import { ActionFeedback } from '../../components/ActionFeedback';
import { PageHeader } from '../../components/PageHeader';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useUnsavedWarning } from '../../hooks/useUnsavedWarning';
import { TaskTemplateEditor } from './TaskTemplateEditor';
import { TruthRulesNotice } from './TruthRulesNotice';

const TASKS: { id: AiTask; label: string; description: string }[] = [
  { id: 'parse-resume', label: 'Resume parsing', description: 'Turns an imported resume into profile fields.' },
  { id: 'analyze', label: 'Job analysis and match', description: 'Reads the posting and scores the match.' },
  { id: 'tailor', label: 'Resume tailoring', description: 'Rewrites the presentation of your resume for the posting.' },
  { id: 'cover-letter', label: 'Cover letter', description: 'Writes the cover letter.' },
  { id: 'answers', label: 'Screening answers', description: 'Drafts answers to the questions found on a form.' },
  { id: 'answer-one', label: 'Single answer', description: 'Drafts one answer from the Answers panel.' },
];

export function PromptsSection() {
  const [saved, setSaved] = useState<PromptSettings | null>(null);
  const [draft, setDraft] = useState<PromptSettings | null>(null);
  const action = useAsyncAction();
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    let alive = true;
    getPromptSettings().then((p) => {
      if (!alive) return;
      setSaved(p);
      setDraft(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  const dirty = Boolean(draft && saved && JSON.stringify(draft) !== JSON.stringify(saved));
  useUnsavedWarning(dirty);

  if (!draft || !saved) {
    return (
      <div className="jp-opt-loading">
        <Spinner label="Loading" />
      </div>
    );
  }

  const set = <K extends keyof PromptSettings>(key: K, value: PromptSettings[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d));

  const save = () =>
    action.run(
      'save',
      async () => {
        const clean: PromptSettings = {
          ...draft,
          templates: Object.fromEntries(Object.entries(draft.templates).filter(([, v]) => v && v.trim())),
        };
        await savePromptSettings(clean);
        setSaved(clean);
        setDraft(clean);
      },
      'Saved.',
    );

  const restore = async () => {
    const ok = await confirm({
      title: 'Restore defaults?',
      message: 'Tone, style, word lists and all task instructions return to the built-in defaults.',
      confirmLabel: 'Restore defaults',
      danger: true,
    });
    if (!ok) return;
    const defaults = createDefaultPromptSettings();
    await action.run(
      'restore',
      async () => {
        await savePromptSettings(defaults);
        setSaved(defaults);
        setDraft(defaults);
      },
      'Defaults restored.',
    );
  };

  return (
    <div className="jp-opt-section">
      <PageHeader
        title="Prompts and style"
        description="Optional adjustments to how AI-written text sounds. The defaults work well for most people."
        actions={
          <>
            {dirty && <Badge tone="warning">Unsaved changes</Badge>}
            <Button onClick={() => void restore()} loading={action.busy === 'restore'}>
              Restore defaults
            </Button>
            <Button variant="primary" onClick={() => void save()} disabled={!dirty} loading={action.busy === 'save'}>
              Save
            </Button>
          </>
        }
      />
      <ActionFeedback error={action.error} message={action.message} />
      <TruthRulesNotice />
      <Card title="Voice">
        <div className="jp-stack jp-stack--lg">
          <TextField label="Tone" value={draft.tone} onChange={(v) => set('tone', v)} hint="e.g. professional, warm and direct" />
          <TextField label="Writing style" value={draft.writingStyle} onChange={(v) => set('writingStyle', v)} hint="e.g. concise, concrete, active voice" />
          <TagInput label="Words to avoid" values={draft.wordsToAvoid} onChange={(v) => set('wordsToAvoid', v)} />
          <TagInput
            label="Themes to emphasise"
            values={draft.themesToEmphasise}
            onChange={(v) => set('themesToEmphasise', v)}
            hint="Only emphasised where your profile actually supports them."
          />
        </div>
      </Card>
      <Card title="Task instructions">
        <div className="jp-stack jp-stack--lg">
          <p className="jp-small jp-muted">Leave a task empty to use the built-in instructions. Custom instructions are added within the fixed rules above; they cannot override them.</p>
          {TASKS.map((task) => (
            <TaskTemplateEditor
              key={task.id}
              label={task.label}
              description={task.description}
              value={draft.templates[task.id] ?? ''}
              onChange={(value) => set('templates', { ...draft.templates, [task.id]: value })}
            />
          ))}
        </div>
      </Card>
      {dialog}
    </div>
  );
}
