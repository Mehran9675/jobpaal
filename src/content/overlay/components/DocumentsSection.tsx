import { regenerate } from '@/content/controller/documentActions';
import { tailorAndFill } from '@/content/controller/jobActions';
import type { StoredDocument } from '@/shared/types';
import { Button } from '@/ui/components/Button';
import { DocumentRow } from './DocumentRow';
import { Section } from './Section';

export interface DocumentsSectionProps {
  documents: StoredDocument[];
  hasCoverLetter: boolean;
  aiReady: boolean;
  disabled: boolean;
  canTailor: boolean;
}

export function DocumentsSection({ documents, hasCoverLetter, aiReady, disabled, canTailor }: DocumentsSectionProps) {
  return (
    <Section title="Documents" aside={documents.length ? `${documents.length} files` : undefined}>
      {documents.length === 0 ? (
        <p className="jp-small jp-muted">No documents for this page yet. Tailor and fill creates them.</p>
      ) : (
        documents.map((doc) => <DocumentRow key={doc.id} doc={doc} aiReady={aiReady} disabled={disabled} />)
      )}
      <div className="jp-row jp-row--wrap">
        {documents.length > 0 && (
          <Button
            size="sm"
            disabled={disabled || !aiReady}
            onClick={() => {
              if (confirm('Regenerate all documents for this job? This uses your AI provider and replaces the current versions.')) void regenerate('all');
            }}
          >
            Regenerate all
          </Button>
        )}
        {!hasCoverLetter && (
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled || !aiReady || !canTailor}
            onClick={() => (documents.length ? regenerate('cover-letter') : tailorAndFill(true))}
            title="The form has no cover-letter field; write one anyway"
          >
            Write a cover letter
          </Button>
        )}
      </div>
    </Section>
  );
}
