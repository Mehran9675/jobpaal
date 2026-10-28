import type { CoverLetterContent, DesignSettings, OutputFormat, ResumeContent, ScreeningAnswer } from '@/shared/types';
import { textToBytes } from '@/shared/utils/base64';
import { renderDocx } from './docx/render';
import { renderHtmlDocument } from './html/render';
import { resumeToJsonResume } from './jsonResume';
import { renderMarkdown } from './markdown';
import { buildAnswersModel, buildCoverLetterModel } from './model/letterModel';
import { personName } from './model/header';
import { buildResumeModel } from './model/resumeModel';
import type { DocModel } from './model/types';
import { renderPdf } from './pdf/render';
import { renderPlainText } from './plainText';

const json = (value: unknown) => textToBytes(JSON.stringify(value, null, 2) + '\n');

/** Renders a model to any non-JSON format. */
async function renderModel(model: DocModel, design: DesignSettings, format: Exclude<OutputFormat, 'json'>): Promise<Uint8Array> {
  switch (format) {
    case 'pdf':
      return renderPdf(model, design);
    case 'docx':
      return renderDocx(model, design);
    case 'html':
      return textToBytes(renderHtmlDocument(model, design));
    case 'md':
      return textToBytes(renderMarkdown(model));
    case 'txt':
      return textToBytes(renderPlainText(model));
    default:
      throw new Error(`Unsupported output format: ${String(format)}`);
  }
}

export async function renderResume(content: ResumeContent, design: DesignSettings, format: OutputFormat): Promise<Uint8Array> {
  if (format === 'json') return json(resumeToJsonResume(content));
  return renderModel(buildResumeModel(content, design), design, format);
}

export async function renderCoverLetter(
  letter: CoverLetterContent,
  header: ResumeContent,
  design: DesignSettings,
  format: OutputFormat,
): Promise<Uint8Array> {
  const model = buildCoverLetterModel(letter, header);
  if (format === 'json') {
    return json({
      type: 'cover-letter',
      name: personName(header),
      date: model.dateLine,
      recipient: letter.recipient ?? '',
      company: letter.company ?? '',
      role: letter.role ?? '',
      text: letter.text ?? '',
    });
  }
  return renderModel(model, design, format);
}

export async function renderAnswers(
  answers: ScreeningAnswer[],
  header: ResumeContent,
  design: DesignSettings,
  format: OutputFormat,
): Promise<Uint8Array> {
  if (format === 'json') {
    return json({
      type: 'application-answers',
      name: personName(header),
      answers: answers.map((a) => ({ question: a.question, answer: a.answer })),
    });
  }
  return renderModel(buildAnswersModel(answers, header), design, format);
}

export function renderResumeHtml(content: ResumeContent, design: DesignSettings): string {
  return renderHtmlDocument(buildResumeModel(content, design), design);
}

export function renderCoverLetterHtml(letter: CoverLetterContent, header: ResumeContent, design: DesignSettings): string {
  return renderHtmlDocument(buildCoverLetterModel(letter, header), design);
}
