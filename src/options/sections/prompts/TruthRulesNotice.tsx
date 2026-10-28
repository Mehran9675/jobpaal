/** Fixed, non-editable statement of the rules every AI task follows. */
export function TruthRulesNotice() {
  return (
    <section className="jp-opt-rules" aria-labelledby="jp-truth-rules">
      <h2 id="jp-truth-rules" className="jp-strong">
        Always applied (cannot be changed)
      </h2>
      <ul>
        <li>Only facts from your profile are used. Nothing is invented or upgraded: no new employers, titles, seniority, dates, education, certifications, skills, tools, metrics or achievements.</li>
        <li>Wording may be rephrased, reordered, trimmed and emphasised; the facts stay exactly as you reported them.</li>
        <li>Requirements your profile does not show stay out of the documents.</li>
        <li>Headlines come from your real most recent role and are never inflated.</li>
      </ul>
    </section>
  );
}
