import { TERMS_SECTIONS, TERMS_VERSION } from '@/shared/legal/terms';

/** The full Terms of Use and Privacy notice. */
export function TermsDocument({ scroll }: { scroll?: boolean }) {
  return (
    <article className={`jp-opt-terms${scroll ? ' jp-opt-terms--scroll' : ''}`} tabIndex={scroll ? 0 : undefined} aria-label="Terms of Use and Privacy notice">
      <h2 className="jp-opt-terms__title">Terms of Use and Privacy notice</h2>
      <p className="jp-small jp-faint">Version {TERMS_VERSION}</p>
      {TERMS_SECTIONS.map((section) => (
        <section key={section.title} className="jp-opt-terms__section">
          <h3>{section.title}</h3>
          {section.paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </section>
      ))}
    </article>
  );
}
