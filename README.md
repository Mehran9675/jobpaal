# JobPaal

JobPaal is a browser extension for job seekers. It turns the job posting you are looking at into a tailored application: a resume rewritten for that posting, a cover letter when the form asks for one, draft answers to screening questions, and a filled application form. It keeps a private, local record of every application.

- **Never submits.** You review every document and form and submit yourself.
- **Never invents facts.** It rewords, reorders, trims and emphasises what is in your profile. No new employers, titles, seniority, dates, skills, tools or metrics. Truth guards check every AI output before it reaches a document.
- **Bring your own AI.** More than 40 providers preconfigured (OpenAI, Anthropic, Gemini, Vertex, xAI, Mistral, Cohere, DeepSeek, OpenRouter, Azure OpenAI, Groq, Ollama, LM Studio and more).
- **Local only.** No account, server, telemetry or ads. Everything is stored in `chrome.storage.local`; content leaves the browser only when it is sent to the AI provider you configured.

The full product description is in [docs/PRODUCT.md](docs/PRODUCT.md).

## Install from a release

Publishing a GitHub release runs `.github/workflows/release.yml`, which type-checks, tests, builds and attaches these files to the release (the release tag, e.g. `v1.2.0`, becomes the extension version):

- `jobpaal-chrome-<version>.zip` — Chrome, Edge, Brave, Opera. Unzip it, open `chrome://extensions` (or `edge://extensions`, `brave://extensions`, `opera://extensions`), enable Developer mode, choose *Load unpacked* and select the unzipped folder. The same zip is what you upload to the Chrome Web Store, Edge Add-ons or Opera add-ons.
- `jobpaal-firefox-<version>.xpi` / `.zip` — Firefox. For testing, open `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on* and pick the file. Permanent installs in release Firefox require the add-on to be signed by Mozilla (upload the zip to addons.mozilla.org, listed or unlisted); Firefox Developer Edition / Nightly can install the unsigned `.xpi` with `xpinstall.signatures.required` set to `false`.

## Build

Requires Node.js 22+.

```bash
npm install
```

```bash
npm run build
```

This writes two unpacked extensions:

- `dist/chrome` — Chrome, Edge, Brave, Opera (Manifest V3, service worker, side panel)
- `dist/firefox` — Firefox 115+ (Manifest V3, event page, sidebar)

Build one target only with `npm run build:chrome` or `npm run build:firefox`. `npm run zip` packs the built folders into store-ready zip files.

### Load it

- **Chromium:** open `chrome://extensions`, enable Developer mode, choose *Load unpacked* and select `dist/chrome`.
- **Firefox:** open `about:debugging#/runtime/this-firefox`, choose *Load Temporary Add-on* and select `dist/firefox/manifest.json`.

The management page opens on first install and asks you to accept the terms.

## Develop

```bash
npm run typecheck
```

```bash
npm test
```

## Project structure

```
scripts/                build (multi-target Vite builds + manifests) and zip packaging
public/icons/           extension icons
src/
  background/           service worker / event page
    handlers/           typed request handlers (jobs, AI, documents, frames, navigation)
    pipeline/           tailoring pipeline, analysis reuse, regeneration, local file rendering
  content/              content script (runs in every frame)
    controller/         top-frame state store and actions (detect, tailor, fill, pick, answers, documents)
    detection/          job page readers: named boards/ATS, JSON-LD, generic reader
    autofill/           form scanning, field classification, filling, file attachment
    picker/             click-to-pick tool and element locators
    linkedin/           LinkedIn profile scanner
    frame/              per-frame agent answering relayed frame requests
    overlay/            on-page overlay (React in a shadow root)
  popup/                toolbar popup
  sidepanel/            side panel (Chromium) / sidebar (Firefox)
  options/              management page
  viewer/               document viewer tab
  shared/
    ai/                 providers, protocols, prompts, tasks and truth guards
    documents/          PDF, DOCX, HTML, Markdown, text and JSON Resume renderers
    import/             resume import (PDF, DOCX, JSON Resume, text)
    storage/            chrome.storage.local repositories
    messaging/          typed messages between background, content scripts and pages
    types/              shared data model
  ui/                   shared React components, hooks, editors and styles
tests/                  Vitest unit tests
```

Every React component lives in its own file named after the component.

## How the pieces talk

- Pages (popup, side panel, management page) and content scripts call the background with typed `sendToBackground(type, payload)` requests. Responses are wrapped so errors arrive intact.
- The popup and side panel talk to the top frame of the active tab with `sendToContent(tabId, type, payload)`.
- Application forms are often split across iframes. The top frame asks the background to relay `frame:*` requests to every frame of the tab (scan, fill, attach, pick), so cross-origin frames can be read, picked and filled.
- AI calls only happen in the background, against the provider you activated, and every call is recorded in the local usage log.

## Rules the code enforces

1. Tailored resumes are composed from profile facts; AI only supplies wording and order, which passes numeric, skill, seniority and years-of-experience guards.
2. There is no code path that submits a form or clicks a submit button.
3. A job description is used only when it reads like prose; otherwise the user is told and pointed to Pick, Paste or Recent jobs.
4. AI features stay disabled until the terms are accepted and a provider is connected and active. Autofill and design previews work without AI.
5. File names use only your name and the document kind (for example `Jane-Doe-resume.pdf`), never the employer or role.

## License

See [LICENSE](LICENSE).
