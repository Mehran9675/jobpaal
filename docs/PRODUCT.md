# JobPaal — product description

## What it is
JobPaal is a browser extension for job seekers. It turns the job posting someone is looking at into a complete, tailored application: a resume rewritten for that posting, a cover letter when the form asks for one, draft answers to screening questions, and filled application forms. It also keeps a private, local record of every application.

It is not an auto-apply bot. It never submits anything. The user reviews every document and form and submits themselves.

The user brings their own AI provider (their own API key or a local model). The extension has no account, no subscription, no ads, and no server of its own. Everything it stores stays in the user's browser, and content only leaves the device when it is sent to the AI provider the user chose.

The product is built on one non-negotiable rule: it optimises how a person's real experience is presented and never invents or upgrades facts. No fabricated employers, job titles, seniority, dates, education, certifications, skills, tools, metrics or achievements. A different seniority, a skill the user does not have, or a metric that was never reported must never appear in any document.

## Who it is for
People applying to many jobs at once who want each application tailored properly instead of sending the same resume everywhere, and who want to use their own AI provider and keep their personal data local.

## The core user journey
1. The user opens a job posting or application form. JobPaal detects the page and shows a small floating button.
2. Clicking the button opens the overlay: the detected job, the job description it will use, and a match score.
3. The user presses **Tailor and fill**. JobPaal analyses the posting, rewrites the resume for it, writes a cover letter if the form has one, drafts answers to the form's screening questions, and fills the form with their saved details and documents.
4. The user checks the generated files, edits anything, downloads or attaches them, completes anything the site refused to accept, and submits the application themselves.
5. The application is stored with its documents, status, notes, timeline and match score, so the user can track it from the management page.

If documents already exist for that page, the main action becomes **Fill this page** and no AI is used: it simply fills the form with the existing documents and answers.

## Feature areas

### 1. Reading the job page
The extension understands job postings and application forms on thousands of sites without configuration. It recognises the major job boards and applicant tracking systems by name (LinkedIn, Indeed, Glassdoor, ZipRecruiter, Wellfound, Greenhouse, Lever, Workday, Ashby, SmartRecruiters, BambooHR, iCIMS, Taleo, Workable, Recruitee, Jobvite), and uses a generic reader elsewhere.

It extracts the job title, company, location, salary, employment type, full description, requirement lines, keywords and posting date. It reads structured job data when a site provides it.

Important rule: content only counts as a job description when it reads like prose. Labels, select options, navigation text or short snippets are never treated as the description. If no real description exists, the user is told so instead of the extension tailoring against nonsense.

The user has three fallbacks when a page is not understood or the description is missing:
- Pick the fields on the page (title, company, location, salary, description) with a click-to-pick tool that highlights elements as the pointer moves.
- Paste the description, either by reading the clipboard in one click (validated the same way as detection) or through a paste box.
- Choose a previously stored job description from a recent-jobs list.

### 2. The on-page overlay
A floating button in the corner of the page opens a compact panel. The button is draggable and remembers its position. It also acts as a status light: green when JobPaal found everything it needs, red when something could not be read, with the specific reasons listed in the panel and a clear message that manual work is needed.

The panel contains:
- The detected job (title, company, location, salary) with source information.
- A job description panel showing where the description came from, its word count, a preview, and actions to pick, paste, choose a recent job, or switch to the page's own description.
- A match panel with the score and expandable reasons, matched skills and missing skills.
- The main actions: Tailor and fill (or Fill this page when documents exist), Fill this form, Guide me, and Open JobPaal.
- Any missing-detection warnings.
- The Answers section: the generated screening answers with copy buttons, plus a manual entry area where the user can type a question and an answer that detection missed. Three actions per entry: Ask AI to draft the answer, Send to field (click the field on the page and fill it immediately), and Save for reuse so matching fields are filled automatically on future forms. Saved entries are listed and can be sent or removed.
- The Documents section: generated files with download, view, attach, choose upload field, edit content, and regenerate.
- The field guide: a per-site teaching tool. The user picks the elements that contain the title, company, location, salary and description, and maps individual application fields. Everything is saved automatically per site, so detection works next time without any save button. The guide can also paste a description.
- AI usage totals and a link to the detailed report.

Panel behaviour: it can be dragged anywhere and remembers the position; it has a fixed height with internal scrolling; it has size controls (85% to 160%) that scale the content while the panel stays inside the viewport; a switch at the very top hides the overlay entirely (the same switch is in the popup); and it always clamps itself back into the viewport when the window or its content changes.

The button appears automatically on pages JobPaal recognises. If a page is not recognised but the user knows it is a job page, the popup has one button, Show overlay here, which treats exactly that page as a job page and shows the overlay there; the same button becomes Hide overlay here. This affects only that page, not the whole site or browser.

### 3. Generated documents
The resume is rewritten for the specific posting: the order, emphasis, vocabulary and summary are aligned to the job, while the facts stay exactly as reported. The professional headline is built from the user's real most recent role and genuine specialisations, not copied from the posting and never inflated in seniority.

A cover letter is generated only when the application form actually contains a cover-letter field, or when the user explicitly requests one.

Screening questions read from the form are answered as draft answers in the first person, grounded in the user's real profile and the job.

Every generated file can be:
- Viewed in a new tab.
- Downloaded.
- Attached to a form, or attached to a specific chosen upload field.
- Edited: the resume has a structured editor (headline, summary, skills groups, experience entries with titles, companies, dates, descriptions and bullet points, education, certifications, languages, projects, awards); the cover letter is a plain text editor; answers are edited per question. The user can reset to the generated version and re-render the file locally with the current design, without calling AI again.
- Regenerated individually or all at once (this is an explicit user action and re-runs the relevant AI tasks).

Design options: multiple resume templates/designs, accent colour, density, page size, section order, hidden sections, optional photo, and a custom font for PDF output. Output formats: PDF, DOCX, HTML, Markdown, plain text and JSON Resume.

File names are neutral and never contain the employer or role (for example First-Last-resume.pdf), so files do not leak the target job.

### 4. Match and analysis
One analysis produces the job's seniority, responsibilities, required and preferred skills, ATS keywords, culture signals, red flags, a short summary, must-prove themes, a 0 to 100 match score with a recommendation (strong match, good match, stretch, weak match), matched skills and missing skills.

The analysis is stored with the job and reused by tailoring, so clicking Tailor and fill after running Match does not repeat the analysis. Explicit clicks re-run the matching function, as expected.

### 5. Filling forms (autofill)
JobPaal fills application forms with the user's saved profile data, screening answers and chosen files. Filled fields are highlighted so the user can verify them. Existing content is not overwritten unless the user allows it.

It learns field mappings per site: the user can point at a field and assign it to a profile value, and that mapping is reused later.

Manual fallbacks cover what autofill cannot read: the answer/field writer described above, attaching a document to a specific upload field, and pasting text.

The product warns that some modern websites only register input that is typed by hand. If a site reports a filled field as empty on submit, the user can click the field and type a character, and the value the extension already placed is accepted.

Form elements inside iframes are pickable, including cross-origin frames, and values picked there are usable immediately.

JobPaal never submits forms. That capability does not exist in the product.

### 6. Application tracking
Every application stores: job title, company, site, URL and the job description used; status (draft, ready to apply, applied, screening, interview, technical, offer, rejected, withdrawn, or no response); the generated documents and the written answers; free-form notes and a dated timeline of events; the match score.

The dashboard shows pipeline statistics (applications tracked, interviews, offers, documents generated), the connected AI provider, an AI usage card (tokens today and all time, calls, errors, per-provider breakdown, optional token budget with a warning when reached) and recent applications.

The applications list supports search, status filtering, opening a detail view, changing status, editing notes, deleting an application (its documents are deleted with it) and regenerating documents. The full application record can be exported as JSON, and data can be imported, or cleared selectively.

### 7. Profile and resume input
The user maintains a profile: contact details, online presence, professional summary, grouped skills, work experience (company, title, location, dates, description, highlights, skills), education, certifications, languages, projects, awards, work eligibility and optional EEO answers.

Resumes can be imported from PDF, DOCX, JSON Resume, plain text or pasted content, and parsed into structured profile data. A LinkedIn profile can be scanned while it is open and imported into the management page.

### 8. AI providers and usage
The user connects their own provider. More than 40 are preconfigured, including OpenAI, Anthropic Claude, Google Gemini, Google Vertex, xAI Grok, Mistral, Cohere, DeepSeek and OpenRouter, plus OpenAI-compatible endpoints such as local models (Ollama, LM Studio). Users can pick models, test connections, manage keys, and see available models. Keys and tokens are stored locally.

AI usage is recorded locally: calls, errors, prompt and completion tokens, per provider, per day, and overall, with an optional token budget that triggers a notification when exceeded. Editing prompt style (tone, writing style, words to avoid, themes to emphasise and the task instruction templates) is available to users in the management page; the product does not promote that and the core truthfulness rules always apply.

AI features are all gated: resume parsing, tailoring, cover letters, screening answers and match scoring stay disabled until a provider is connected and active. Autofill and template previews work without AI.

### 9. Management page
Sections: Dashboard; My profile (profile, resume imports, LinkedIn scan, EEO settings); Documents (all generated and uploaded files, filters, preview, download, regenerate, delete, storage summary); Applications (list, filters, detail view); Resume designs (templates, colours, density, page size, section order, hidden sections, photo, font, output format, file naming, own uploaded files); AI providers (connections, models, tests, usage report, budget); Prompts and style; Settings (appearance, autofill behaviour, data export/import/delete); Terms and privacy (full text always readable, acceptance status and what was agreed).

The management page opens automatically the first time the extension is installed.

### 10. Popup, side panel and context menu
The toolbar popup shows the current page's status and a short action row: Tailor and fill, Fill this form, Show overlay here, Select fields, Paste JD and Match. It also shows the match panel, generated files, written answers, recent applications, the AI provider state and today's usage, and the overlay visibility switch.

The side panel offers the same job status, matching, tailoring and filling actions plus documents and answers.

The right-click menu offers: tailor documents for this job, fill this application form, scan this LinkedIn profile, and open the management page.

## Rules the product must always follow
1. Never fabricate or inflate anything. Only reword, reorder, trim and emphasise facts that exist in the user's data. If a requirement is missing from the profile, it stays out.
2. Never submit an application. The user reviews and submits.
3. Everything is stored locally. No telemetry, analytics, tracking or advertising. The developer cannot collect, receive, retain, harvest, sell or share user data.
4. User content is sent only to the AI provider the user configured, under that provider's own terms and data policies, which the user is told the product cannot control.
5. The user must explicitly accept the terms before use. Each statement has its own checkbox: reading and agreeing to the terms; understanding that JobPaal cannot retain or harvest data; understanding that the AI provider's data policies are outside JobPaal's control; committing to comply with local laws applicable to job applications; and accepting sole responsibility for the accuracy of submitted content, with the developer not condoning, promoting or recommending resume fraud.
6. The product says when it cannot read something instead of guessing, and points the user to the manual path.

## Supported install surfaces
Chrome, Edge, Brave and Opera (Chromium extension), and Firefox. The interface is in English.

## Limitations and out of scope
- No auto-apply, no auto-submit, no queueing or unattended applying.
- Some custom widgets, canvas-based controls and closed shadow-DOM inputs cannot be read or filled; the manual field, paste and answer-writing fallbacks exist for these.
- A small number of sites only accept input typed by hand; the product tells the user how to handle that.
- The extension can only read content in frames it is permitted to access.
- It does not guarantee job outcomes and makes no claims about interview or offer rates.
