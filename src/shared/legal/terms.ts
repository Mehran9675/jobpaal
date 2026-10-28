import { TERMS_VERSION } from '@/shared/defaults/settings';
import type { Settings, TermsAcceptance } from '@/shared/types';

export { TERMS_VERSION };

export interface TermsStatement {
  id: string;
  label: string;
}

/** Each statement has its own checkbox. All five must be checked before JobPaal can be used. */
export const TERMS_STATEMENTS: TermsStatement[] = [
  {
    id: 'agree-terms',
    label: 'I have read and agree to the Terms of Use and Privacy notice.',
  },
  {
    id: 'local-only',
    label:
      'I understand JobPaal has no server and cannot collect, receive, retain, harvest, sell or share my data — everything is stored locally in my browser.',
  },
  {
    id: 'provider-policies',
    label:
      "I understand content I choose to process is sent to the AI provider I configure, under that provider's own terms and data policies, which JobPaal cannot control.",
  },
  {
    id: 'comply-laws',
    label: 'I will comply with the laws and rules that apply to job applications where I live and apply.',
  },
  {
    id: 'sole-responsibility',
    label:
      'I accept sole responsibility for the accuracy of everything I submit; the developer does not condone, promote or recommend resume fraud.',
  },
];

export interface TermsSection {
  title: string;
  paragraphs: string[];
}

/** The Terms of Use and Privacy notice, as readable sections. */
export const TERMS_SECTIONS: TermsSection[] = [
  {
    title: '1. What JobPaal does',
    paragraphs: [
      'JobPaal is a browser extension that helps you prepare job applications. It reads the job posting you are viewing, and, using an AI provider that you connect yourself, rewrites the presentation of your own resume for that posting, drafts a cover letter when one is needed, drafts answers to screening questions, and fills application forms with details you have saved.',
      'JobPaal also keeps a private record of your applications, documents, notes and status in your browser so that you can track them.',
    ],
  },
  {
    title: '2. JobPaal never submits anything',
    paragraphs: [
      'JobPaal does not submit applications, forms or messages on your behalf, and it has no capability to do so. It does not apply automatically, queue applications or act unattended. You review every document, answer and form field, and you decide whether and when to submit.',
    ],
  },
  {
    title: '3. No fabrication',
    paragraphs: [
      'JobPaal is designed to optimise how your real experience is presented, never to invent or upgrade it. It is instructed to only reword, reorder, trim and emphasise facts that exist in the data you provide. It must not add employers, job titles, seniority, dates, education, certifications, skills, tools, metrics or achievements that you did not report.',
      'AI output can still contain mistakes. You must read everything before you use it and correct anything that is inaccurate. Using JobPaal to misrepresent your qualifications is not permitted under these terms.',
    ],
  },
  {
    title: '4. Your data stays in your browser',
    paragraphs: [
      'JobPaal has no account, no server and no backend of its own. Your profile, resumes, generated documents, applications, notes, settings, AI usage records and API keys are stored locally in your browser’s extension storage on your device.',
      'The developer of JobPaal cannot collect, receive, retain, harvest, sell or share your data, because it is never sent to the developer. If you uninstall the extension or clear its data, this information is removed from your browser and cannot be recovered by anyone other than you (for example from an export file you created).',
    ],
  },
  {
    title: '5. No telemetry, analytics or advertising',
    paragraphs: [
      'JobPaal contains no telemetry, analytics, tracking pixels, crash reporting services, advertising or third-party marketing code. It does not build a profile of you or your browsing.',
    ],
  },
  {
    title: '6. How content reaches your AI provider',
    paragraphs: [
      'AI features only work after you connect a provider (for example a cloud API with your own key, or a model running on your own computer). When you use an AI feature, JobPaal sends the relevant content — such as the job description and the parts of your profile needed for the task — directly from your browser to the provider you configured.',
      'That content is then handled under that provider’s own terms of service and data policies, including how long it is retained and whether it may be used for training. JobPaal cannot see, control or change how a provider handles your data. Review your provider’s policies before you use it, and choose a local model if you do not want content to leave your device.',
      'Your API keys are stored locally and are only sent to the provider they belong to.',
    ],
  },
  {
    title: '7. Your responsibilities',
    paragraphs: [
      'You are solely responsible for the accuracy and truthfulness of everything you submit to an employer, recruiter or website, whether you wrote it yourself or JobPaal drafted it. The developer does not condone, promote or recommend resume fraud or any misrepresentation.',
      'You agree to comply with the laws, regulations and rules that apply to job applications where you live and where you apply, including rules on equal-opportunity questions, work authorisation statements and data you submit about yourself. You are also responsible for complying with the terms of the websites you use and of your AI provider.',
    ],
  },
  {
    title: '8. No guarantee of outcomes',
    paragraphs: [
      'JobPaal does not guarantee any job outcome. Match scores and recommendations are estimates produced by an AI model and may be wrong. JobPaal makes no claims about interview rates, offer rates or how employers or applicant tracking systems will treat your application.',
    ],
  },
  {
    title: '9. Limitations',
    paragraphs: [
      'Websites differ and change often. JobPaal may fail to read a job posting, may read it incompletely, or may be unable to fill some fields (for example custom widgets, canvas-based controls, closed shadow-DOM inputs or frames it is not permitted to access). When it cannot read something it tells you so and offers manual alternatives. Some sites only accept input typed by hand; you may need to adjust such fields yourself.',
    ],
  },
  {
    title: '10. Disclaimer and limitation of liability',
    paragraphs: [
      'JobPaal is provided “as is” and “as available”, without warranties of any kind, express or implied, including fitness for a particular purpose, accuracy and non-infringement. To the maximum extent permitted by law, the developer is not liable for any direct, indirect, incidental, consequential or special damages arising from your use of JobPaal, including lost opportunities, rejected applications, content produced by an AI provider, charges from your AI provider, or loss of locally stored data.',
      'Nothing in these terms limits rights you have under laws that cannot be excluded by agreement.',
    ],
  },
  {
    title: '11. No account and no contact channel',
    paragraphs: [
      'There is no account to create and nothing to sign in to. Because JobPaal never receives your data, the developer cannot look up, correct, export or delete it for you. You can export, import and delete all of your data yourself at any time in Settings → Data.',
    ],
  },
  {
    title: '12. Changes to these terms',
    paragraphs: [
      'These terms may be updated in a future version of the extension. When the terms change in a way that requires your agreement, JobPaal will ask you to review and accept them again before you continue using it. You can withdraw your acceptance at any time in Terms and privacy; JobPaal’s features will then remain unavailable until you accept again.',
    ],
  },
];

/** The full Terms of Use and Privacy notice as plain text. */
export const TERMS_TEXT: string = [
  `JobPaal — Terms of Use and Privacy notice (version ${TERMS_VERSION})`,
  ...TERMS_SECTIONS.map((section) => [section.title, ...section.paragraphs].join('\n\n')),
].join('\n\n');

/** True when the stored acceptance matches the current terms version. */
export function hasAcceptedTerms(settings: Pick<Settings, 'terms'> | null | undefined): boolean {
  return settings?.terms?.version === TERMS_VERSION;
}

/** True when every statement id is present in the list. */
export function allStatementsChecked(checked: Iterable<string>): boolean {
  const set = new Set(checked);
  return TERMS_STATEMENTS.every((statement) => set.has(statement.id));
}

export function createTermsAcceptance(statements: string[], at: number = Date.now()): TermsAcceptance {
  const known = TERMS_STATEMENTS.map((s) => s.id).filter((id) => statements.includes(id));
  return { version: TERMS_VERSION, acceptedAt: at, statements: known };
}
