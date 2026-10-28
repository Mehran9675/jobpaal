import { useEffect, useState } from 'react';
import { patchApplication, timelineEvent } from '@/shared/storage';
import type { Application } from '@/shared/types';
import { truncate } from '@/shared/utils/text';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { ActionFeedback } from '../../components/ActionFeedback';
import { useAsyncAction } from '../../hooks/useAsyncAction';

export function ApplicationNotes({ app }: { app: Application }) {
  const [notes, setNotes] = useState(app.notes);
  const [base, setBase] = useState(app.notes);
  const action = useAsyncAction();

  // Follow external changes when there are no local edits.
  useEffect(() => {
    setNotes((current) => (current === base ? app.notes : current));
    setBase(app.notes);
  }, [app.notes]);

  const dirty = notes !== app.notes;
  const save = () =>
    action.run(
      'save',
      async () => {
        await patchApplication(app.id, (a) => {
          a.notes = notes;
          const summary = notes.trim() ? `Notes updated: ${truncate(notes.trim().replace(/\s+/g, ' '), 80)}` : 'Notes cleared';
          a.timeline.push(timelineEvent('note', summary));
          return a;
        });
      },
      'Notes saved.',
    );

  return (
    <Card title="Notes">
      <div className="jp-stack">
        <label className="jp-field">
          <span className="jp-sr-only">Notes</span>
          <textarea
            className="jp-textarea"
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contacts, interview dates, follow-ups, anything you want to remember."
          />
        </label>
        <div className="jp-row">
          <Button variant="primary" size="sm" onClick={() => void save()} disabled={!dirty} loading={action.busy === 'save'}>
            Save notes
          </Button>
          {dirty && <span className="jp-small jp-faint">Unsaved changes</span>}
        </div>
        <ActionFeedback error={action.error} message={action.message} />
      </div>
    </Card>
  );
}
