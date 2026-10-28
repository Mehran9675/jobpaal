import { buildFileName, renderAnswers, renderCoverLetter, renderResume } from '@/shared/documents';
import { deleteDocuments, getDocumentsByIds, getSettings, putDocument } from '@/shared/storage';
import { OUTPUT_FORMATS, type Application, type DocumentKind, type OutputFormat } from '@/shared/types';

function formatInfo(format: OutputFormat) {
  return OUTPUT_FORMATS.find((f) => f.id === format) ?? OUTPUT_FORMATS[0];
}

/**
 * Renders the application's (edited or generated) content into files with the current design.
 * Purely local: no AI. Existing file ids are reused per kind + format so links stay valid.
 */
export async function renderApplicationFiles(app: Application): Promise<string[]> {
  const settings = await getSettings();
  const { design, fileNaming } = settings;
  const formats: OutputFormat[] = design.outputFormats.length ? design.outputFormats : ['pdf'];
  const existing = await getDocumentsByIds(app.documentIds);
  const keep: string[] = [];

  const resume = app.resume ? (app.resume.edited ?? app.resume.generated) : null;
  if (!resume) return app.documentIds;
  const person = { firstName: resume.firstName, lastName: resume.lastName };

  const jobs: { kind: Exclude<DocumentKind, 'uploaded'>; render: (format: OutputFormat) => Promise<Uint8Array> }[] = [
    { kind: 'resume', render: (format) => renderResume(resume, design, format) },
  ];
  const letter = app.coverLetter ? (app.coverLetter.edited ?? app.coverLetter.generated) : null;
  if (letter && letter.text.trim()) {
    jobs.push({ kind: 'cover-letter', render: (format) => renderCoverLetter(letter, resume, design, format) });
  }
  const answers = app.answers.filter((a) => a.answer.trim());
  if (answers.length) {
    jobs.push({ kind: 'answers', render: (format) => renderAnswers(answers, resume, design, format) });
  }

  for (const job of jobs) {
    for (const format of formats) {
      const info = formatInfo(format);
      const bytes = await job.render(format);
      const previous = existing.find((d) => d.kind === job.kind && d.format === format && d.source === 'generated');
      const doc = await putDocument({
        id: previous?.id,
        applicationId: app.id,
        kind: job.kind,
        format,
        fileName: buildFileName(fileNaming.pattern, person, job.kind, info.ext),
        mimeType: info.mime,
        source: 'generated',
        bytes,
      });
      keep.push(doc.id);
    }
  }

  const stale = existing.filter((d) => d.source === 'generated' && !keep.includes(d.id)).map((d) => d.id);
  await deleteDocuments(stale);
  const uploaded = existing.filter((d) => d.source !== 'generated').map((d) => d.id);
  return [...keep, ...uploaded];
}
