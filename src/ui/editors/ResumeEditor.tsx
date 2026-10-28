import { useId } from 'react';
import type {
  ResumeAwardEntry,
  ResumeCertificationEntry,
  ResumeContent,
  ResumeEducationEntry,
  ResumeExperienceEntry,
  ResumeLanguageEntry,
  ResumeProjectEntry,
} from '@/shared/types';
import { formatDateRange } from '@/shared/utils/date';
import { Checkbox } from '../components/Checkbox';
import { Notice } from '../components/Notice';
import { RepeatableList } from '../components/RepeatableList';
import { StringListEditor } from '../components/StringListEditor';
import { TagInput } from '../components/TagInput';
import { TextAreaField } from '../components/TextAreaField';
import { TextField } from '../components/TextField';

export interface ResumeEditorProps {
  value: ResumeContent;
  onChange: (value: ResumeContent) => void;
}

const keyOf = (prefix: string) => (item: { sourceId?: string }, index: number) => `${prefix}-${item.sourceId || 'new'}-${index}`;

const newExperience = (): ResumeExperienceEntry => ({
  sourceId: '',
  title: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
  bullets: [],
});
const newEducation = (): ResumeEducationEntry => ({
  sourceId: '',
  institution: '',
  degree: '',
  field: '',
  location: '',
  startDate: '',
  endDate: '',
  grade: '',
  description: '',
});
const newCertification = (): ResumeCertificationEntry => ({ sourceId: '', name: '', issuer: '', date: '' });
const newLanguage = (): ResumeLanguageEntry => ({ sourceId: '', language: '', fluency: '' });
const newProject = (): ResumeProjectEntry => ({ sourceId: '', name: '', role: '', url: '', description: '', bullets: [] });
const newAward = (): ResumeAwardEntry => ({ sourceId: '', title: '', issuer: '', date: '', description: '' });

/** Structured editor for a tailored resume. Wording can change; facts must stay true. */
export function ResumeEditor({ value, onChange }: ResumeEditorProps) {
  const uid = useId();
  const set = <K extends keyof ResumeContent>(key: K, next: ResumeContent[K]) => onChange({ ...value, [key]: next });

  return (
    <div className="jp-editor">
      <Notice tone="info">Edit wording freely, but keep facts true — JobPaal never adds facts for you.</Notice>

      <section className="jp-editor__section" aria-labelledby={`${uid}-re-header`}>
        <h3 id={`${uid}-re-header`} className="jp-editor__heading">
          Header
        </h3>
        <p className="jp-small jp-muted">
          {value.name || 'Your name'} · contact details come from your profile.
        </p>
        <TextField label="Headline" value={value.headline} onChange={(v) => set('headline', v)} hint="Based on your real most recent role. Never inflate seniority." />
      </section>

      <section className="jp-editor__section" aria-labelledby={`${uid}-re-summary`}>
        <h3 id={`${uid}-re-summary`} className="jp-editor__heading">
          Summary
        </h3>
        <TextAreaField label="Professional summary" value={value.summary} onChange={(v) => set('summary', v)} rows={5} />
      </section>

      <section className="jp-editor__section" aria-labelledby={`${uid}-re-skills`}>
        <h3 id={`${uid}-re-skills`} className="jp-editor__heading">
          Skills
        </h3>
        <RepeatableList
          items={value.skills}
          onChange={(next) => set('skills', next)}
          create={() => ({ name: '', skills: [] })}
          getKey={(_, i) => `skills-${i}`}
          getTitle={(g) => `${g.name || 'Untitled group'} (${g.skills.length})`}
          itemNoun="skill group"
          addLabel="Add skill group"
          renderItem={(group, update) => (
            <>
              <TextField label="Group name" value={group.name} onChange={(name) => update({ ...group, name })} />
              <TagInput label="Skills" values={group.skills} onChange={(skills) => update({ ...group, skills })} />
            </>
          )}
        />
      </section>

      <section className="jp-editor__section" aria-labelledby={`${uid}-re-exp`}>
        <h3 id={`${uid}-re-exp`} className="jp-editor__heading">
          Experience
        </h3>
        <RepeatableList
          items={value.experience}
          onChange={(next) => set('experience', next)}
          create={newExperience}
          getKey={keyOf('exp')}
          getTitle={(e) => (
            <>
              {[e.title, e.company].filter(Boolean).join(' · ') || 'New role'}
              <span className="jp-faint jp-small"> {formatDateRange(e.startDate, e.endDate, e.current)}</span>
            </>
          )}
          itemNoun="role"
          addLabel="Add role"
          renderItem={(entry, update) => (
            <>
              <div className="jp-grid-2">
                <TextField label="Job title" value={entry.title} onChange={(title) => update({ ...entry, title })} />
                <TextField label="Company" value={entry.company} onChange={(company) => update({ ...entry, company })} />
                <TextField label="Location" value={entry.location} onChange={(location) => update({ ...entry, location })} />
                <div />
                <TextField label="Start (YYYY-MM)" value={entry.startDate} onChange={(startDate) => update({ ...entry, startDate })} placeholder="2021-04" />
                <TextField
                  label="End (YYYY-MM)"
                  value={entry.current ? '' : entry.endDate}
                  disabled={entry.current}
                  onChange={(endDate) => update({ ...entry, endDate })}
                  placeholder={entry.current ? 'Present' : '2023-09'}
                />
              </div>
              <Checkbox label="I currently work here" checked={entry.current} onChange={(current) => update({ ...entry, current })} />
              <TextAreaField label="Description" value={entry.description} onChange={(description) => update({ ...entry, description })} rows={3} />
              <StringListEditor label="Bullet points" items={entry.bullets} onChange={(bullets) => update({ ...entry, bullets })} multiline addLabel="Add bullet" />
            </>
          )}
        />
      </section>

      <section className="jp-editor__section" aria-labelledby={`${uid}-re-edu`}>
        <h3 id={`${uid}-re-edu`} className="jp-editor__heading">
          Education
        </h3>
        <RepeatableList
          items={value.education}
          onChange={(next) => set('education', next)}
          create={newEducation}
          getKey={keyOf('edu')}
          getTitle={(e) => [e.degree, e.field, e.institution].filter(Boolean).join(' · ') || 'New education'}
          itemNoun="education entry"
          addLabel="Add education"
          renderItem={(entry, update) => (
            <>
              <div className="jp-grid-2">
                <TextField label="Institution" value={entry.institution} onChange={(institution) => update({ ...entry, institution })} />
                <TextField label="Degree" value={entry.degree} onChange={(degree) => update({ ...entry, degree })} />
                <TextField label="Field of study" value={entry.field} onChange={(field) => update({ ...entry, field })} />
                <TextField label="Location" value={entry.location} onChange={(location) => update({ ...entry, location })} />
                <TextField label="Start" value={entry.startDate} onChange={(startDate) => update({ ...entry, startDate })} />
                <TextField label="End" value={entry.endDate} onChange={(endDate) => update({ ...entry, endDate })} />
                <TextField label="Grade" value={entry.grade} onChange={(grade) => update({ ...entry, grade })} />
              </div>
              <TextAreaField label="Description" value={entry.description} onChange={(description) => update({ ...entry, description })} rows={2} />
            </>
          )}
        />
      </section>

      <section className="jp-editor__section" aria-labelledby={`${uid}-re-cert`}>
        <h3 id={`${uid}-re-cert`} className="jp-editor__heading">
          Certifications
        </h3>
        <RepeatableList
          items={value.certifications}
          onChange={(next) => set('certifications', next)}
          create={newCertification}
          getKey={keyOf('cert')}
          getTitle={(c) => c.name || 'New certification'}
          itemNoun="certification"
          addLabel="Add certification"
          renderItem={(entry, update) => (
            <div className="jp-grid-3">
              <TextField label="Name" value={entry.name} onChange={(name) => update({ ...entry, name })} />
              <TextField label="Issuer" value={entry.issuer} onChange={(issuer) => update({ ...entry, issuer })} />
              <TextField label="Date" value={entry.date} onChange={(date) => update({ ...entry, date })} />
            </div>
          )}
        />
      </section>

      <section className="jp-editor__section" aria-labelledby={`${uid}-re-lang`}>
        <h3 id={`${uid}-re-lang`} className="jp-editor__heading">
          Languages
        </h3>
        <RepeatableList
          items={value.languages}
          onChange={(next) => set('languages', next)}
          create={newLanguage}
          getKey={keyOf('lang')}
          getTitle={(l) => [l.language, l.fluency].filter(Boolean).join(' · ') || 'New language'}
          itemNoun="language"
          addLabel="Add language"
          renderItem={(entry, update) => (
            <div className="jp-grid-2">
              <TextField label="Language" value={entry.language} onChange={(language) => update({ ...entry, language })} />
              <TextField label="Fluency" value={entry.fluency} onChange={(fluency) => update({ ...entry, fluency })} />
            </div>
          )}
        />
      </section>

      <section className="jp-editor__section" aria-labelledby={`${uid}-re-proj`}>
        <h3 id={`${uid}-re-proj`} className="jp-editor__heading">
          Projects
        </h3>
        <RepeatableList
          items={value.projects}
          onChange={(next) => set('projects', next)}
          create={newProject}
          getKey={keyOf('proj')}
          getTitle={(p) => p.name || 'New project'}
          itemNoun="project"
          addLabel="Add project"
          renderItem={(entry, update) => (
            <>
              <div className="jp-grid-3">
                <TextField label="Name" value={entry.name} onChange={(name) => update({ ...entry, name })} />
                <TextField label="Role" value={entry.role} onChange={(role) => update({ ...entry, role })} />
                <TextField label="URL" type="url" value={entry.url} onChange={(url) => update({ ...entry, url })} />
              </div>
              <TextAreaField label="Description" value={entry.description} onChange={(description) => update({ ...entry, description })} rows={2} />
              <StringListEditor label="Bullet points" items={entry.bullets} onChange={(bullets) => update({ ...entry, bullets })} multiline addLabel="Add bullet" />
            </>
          )}
        />
      </section>

      <section className="jp-editor__section" aria-labelledby={`${uid}-re-awards`}>
        <h3 id={`${uid}-re-awards`} className="jp-editor__heading">
          Awards
        </h3>
        <RepeatableList
          items={value.awards}
          onChange={(next) => set('awards', next)}
          create={newAward}
          getKey={keyOf('award')}
          getTitle={(a) => a.title || 'New award'}
          itemNoun="award"
          addLabel="Add award"
          renderItem={(entry, update) => (
            <>
              <div className="jp-grid-3">
                <TextField label="Title" value={entry.title} onChange={(title) => update({ ...entry, title })} />
                <TextField label="Issuer" value={entry.issuer} onChange={(issuer) => update({ ...entry, issuer })} />
                <TextField label="Date" value={entry.date} onChange={(date) => update({ ...entry, date })} />
              </div>
              <TextAreaField label="Description" value={entry.description} onChange={(description) => update({ ...entry, description })} rows={2} />
            </>
          )}
        />
      </section>
    </div>
  );
}
