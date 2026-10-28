import { hasAcceptedTerms } from '@/shared/legal/terms';
import type { Settings } from '@/shared/types';
import { Card } from '@/ui/components/Card';
import { TermsAcceptForm } from '../../components/TermsAcceptForm';
import { TermsDocument } from '../../components/TermsDocument';
import { PageHeader } from '../../components/PageHeader';
import { TermsStatus } from './TermsStatus';

export function TermsSection({ settings }: { settings: Settings }) {
  const accepted = hasAcceptedTerms(settings);
  return (
    <div className="jp-opt-section">
      <PageHeader title="Terms and privacy" description="The full terms are always available here, together with what you agreed to and when." />
      <Card title="Your acceptance">{accepted ? <TermsStatus settings={settings} /> : <TermsAcceptForm />}</Card>
      <Card>
        <TermsDocument />
      </Card>
    </div>
  );
}
