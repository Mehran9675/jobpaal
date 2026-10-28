import { Card } from '@/ui/components/Card';
import { Logo } from './Logo';
import { TermsAcceptForm } from './TermsAcceptForm';
import { TermsDocument } from './TermsDocument';

/** Replaces every section (except Terms and privacy) until the current terms are accepted. */
export function TermsGate() {
  return (
    <div className="jp-opt-gate">
      <div className="jp-row" style={{ gap: 12 }}>
        <Logo size={36} />
        <div>
          <h1 className="jp-opt-header__title">Welcome to JobPaal</h1>
          <p className="jp-muted">Before you start, please read the terms and confirm each statement below.</p>
        </div>
      </div>
      <Card>
        <TermsDocument scroll />
      </Card>
      <Card>
        <TermsAcceptForm />
      </Card>
    </div>
  );
}
