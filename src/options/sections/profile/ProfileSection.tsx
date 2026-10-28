import { useEffect, useRef, useState } from 'react';
import { mergeProfile } from '@/shared/import';
import { saveProfile } from '@/shared/storage';
import type { Profile } from '@/shared/types';
import { Badge } from '@/ui/components/Badge';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Spinner } from '@/ui/components/Spinner';
import { useConfirm } from '@/ui/components/useConfirm';
import { useProfile } from '@/ui/hooks/useProfile';
import { ActionFeedback } from '../../components/ActionFeedback';
import { PageHeader } from '../../components/PageHeader';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useUnsavedWarning } from '../../hooks/useUnsavedWarning';
import { sameProfile } from '../../lib/profileDraft';
import { AwardsEditor } from './AwardsEditor';
import { BasicsEditor } from './BasicsEditor';
import { CertificationsEditor } from './CertificationsEditor';
import { EducationEditor } from './EducationEditor';
import { EeoEditor } from './EeoEditor';
import { EligibilityEditor } from './EligibilityEditor';
import { ExperienceEditor } from './ExperienceEditor';
import { LanguagesEditor } from './LanguagesEditor';
import { LinkedInImport } from './LinkedInImport';
import { LinksEditor } from './LinksEditor';
import { ProjectsEditor } from './ProjectsEditor';
import { ResumeImport } from './ResumeImport';
import { SkillGroupsEditor } from './SkillGroupsEditor';

export function ProfileSection() {
  const stored = useProfile();
  const [draft, setDraft] = useState<Profile | null>(null);
  const baseline = useRef<Profile | null>(null);
  const action = useAsyncAction();
  const { confirm, dialog } = useConfirm();

  // Follow storage changes while the draft has no local edits.
  useEffect(() => {
    if (!stored) return;
    const previous = baseline.current;
    baseline.current = stored;
    setDraft((current) => (!current || sameProfile(current, previous) ? stored : current));
  }, [stored]);

  const dirty = Boolean(draft && stored && !sameProfile(draft, stored));
  useUnsavedWarning(dirty);

  if (!draft || !stored) {
    return (
      <div className="jp-opt-loading">
        <Spinner label="Loading profile" />
      </div>
    );
  }

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d));

  const save = () =>
    action.run(
      'save',
      async () => {
        const next = await saveProfile(draft);
        baseline.current = next;
        setDraft(next);
      },
      'Profile saved.',
    );

  const discard = async () => {
    const ok = await confirm({ title: 'Discard unsaved changes?', message: 'Your edits since the last save will be lost.', confirmLabel: 'Discard', danger: true });
    if (ok) setDraft(stored);
  };

  /** Merges imported data into the current draft and saves it. */
  const applyImport = async (incoming: Partial<Profile>, overwrite: boolean) => {
    const merged = mergeProfile(draft, incoming, overwrite);
    const next = await saveProfile(merged);
    baseline.current = next;
    setDraft(next);
  };

  const saveButtons = (
    <>
      {dirty ? <Badge tone="warning">Unsaved changes</Badge> : <Badge tone="success">Saved</Badge>}
      {dirty && (
        <Button onClick={discard} size="sm">
          Discard
        </Button>
      )}
      <Button variant="primary" onClick={save} disabled={!dirty} loading={action.busy === 'save'}>
        Save profile
      </Button>
    </>
  );

  return (
    <div className="jp-opt-section">
      <PageHeader
        title="My profile"
        description="The facts JobPaal tailors from. Documents only ever reword, reorder, trim and emphasise what you enter here."
        actions={saveButtons}
      />
      <ActionFeedback error={action.error} message={action.message} />

      <div className="jp-opt-grid-2">
        <ResumeImport onMerge={applyImport} />
        <LinkedInImport onMerge={applyImport} />
      </div>

      <Card title="Basics">
        <BasicsEditor value={draft.basics} onChange={(v) => set('basics', v)} />
      </Card>
      <Card title="Online presence">
        <LinksEditor value={draft.links} onChange={(v) => set('links', v)} />
      </Card>
      <Card title="Professional summary">
        <label className="jp-field">
          <span className="jp-sr-only">Professional summary</span>
          <textarea className="jp-textarea" rows={5} value={draft.summary} onChange={(e) => set('summary', e.target.value)} placeholder="A few sentences about your experience and strengths." />
        </label>
      </Card>
      <Card title="Skills">
        <SkillGroupsEditor value={draft.skills} onChange={(v) => set('skills', v)} />
      </Card>
      <Card title="Work experience">
        <ExperienceEditor value={draft.experience} onChange={(v) => set('experience', v)} />
      </Card>
      <Card title="Education">
        <EducationEditor value={draft.education} onChange={(v) => set('education', v)} />
      </Card>
      <Card title="Certifications">
        <CertificationsEditor value={draft.certifications} onChange={(v) => set('certifications', v)} />
      </Card>
      <Card title="Languages">
        <LanguagesEditor value={draft.languages} onChange={(v) => set('languages', v)} />
      </Card>
      <Card title="Projects">
        <ProjectsEditor value={draft.projects} onChange={(v) => set('projects', v)} />
      </Card>
      <Card title="Awards">
        <AwardsEditor value={draft.awards} onChange={(v) => set('awards', v)} />
      </Card>
      <Card title="Work eligibility">
        <EligibilityEditor value={draft.eligibility} onChange={(v) => set('eligibility', v)} />
      </Card>
      <Card title="Equal-opportunity (EEO) answers">
        <EeoEditor value={draft.eeo} onChange={(v) => set('eeo', v)} />
      </Card>

      {dirty && (
        <div className="jp-opt-savebar" role="region" aria-label="Unsaved changes">
          <span>You have unsaved profile changes.</span>
          <div className="jp-row">{saveButtons}</div>
        </div>
      )}
      {dialog}
    </div>
  );
}
