import { extractDocxText } from './docxText';
import { extractPdfText } from './pdfText';

type Kind = 'pdf' | 'docx' | 'text';

function detectKind(file: File): Kind | null {
  const name = (file.name ?? '').toLowerCase();
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : '';
  const type = (file.type ?? '').toLowerCase();
  if (ext === 'pdf' || type === 'application/pdf') return 'pdf';
  if (ext === 'docx' || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (['txt', 'md', 'markdown', 'text', 'json'].includes(ext)) return 'text';
  if (type.startsWith('text/') || type === 'application/json') return 'text';
  return null;
}

/** Extracts plain text from a PDF, DOCX, TXT or MD file. Throws a user-facing error otherwise. */
export async function extractTextFromFile(file: File): Promise<string> {
  const kind = detectKind(file);
  if (!kind) {
    const name = file.name || 'This file';
    if (/\.doc$/i.test(file.name ?? '')) {
      throw new Error(`${name} is an old Word (.doc) file. Save it as .docx or PDF and try again.`);
    }
    throw new Error(`${name} is not a supported resume file. Use PDF, DOCX, TXT, Markdown or JSON Resume.`);
  }
  if (kind === 'text') {
    const text = (await file.text()).replace(/^\ufeff/, '').replace(/\r\n?/g, '\n').trim();
    if (!text) throw new Error(`${file.name || 'The file'} is empty.`);
    return text;
  }
  const data = await file.arrayBuffer();
  return kind === 'pdf' ? extractPdfText(data) : extractDocxText(data);
}
