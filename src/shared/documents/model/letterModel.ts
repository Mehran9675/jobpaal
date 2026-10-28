import type { CoverLetterContent, ResumeContent, ScreeningAnswer } from '@/shared/types';
import { buildHeader, personName } from './header';
import { cleanText, longDate, splitParagraphs } from './text';
import type { DocModel } from './types';

/** Letterhead + date line + the letter text as written (salutation and closing included). */
export function buildCoverLetterModel(letter: CoverLetterContent, header: ResumeContent, date = new Date()): DocModel {
  const name = personName(header);
  return {
    kind: 'cover-letter',
    title: name ? `${name} – Cover letter` : 'Cover letter',
    header: buildHeader(header, { photo: false, headline: true }),
    dateLine: longDate(date),
    sections: [
      {
        key: 'letter',
        title: '',
        blocks: splitParagraphs(letter.text ?? '').map((text) => ({ type: 'paragraph', text, style: 'normal' })),
      },
    ],
  };
}

export function buildAnswersModel(answers: ScreeningAnswer[], header: ResumeContent): DocModel {
  const name = personName(header);
  return {
    kind: 'answers',
    title: name ? `${name} – Application answers` : 'Application answers',
    header: buildHeader(header, { photo: false, headline: false }),
    dateLine: '',
    sections: [
      {
        key: 'answers',
        title: 'Application answers',
        blocks: answers
          .filter((a) => (a.question ?? '').trim() || (a.answer ?? '').trim())
          .map((a) => ({ type: 'qa', question: cleanText(a.question), answer: cleanText(a.answer) })),
      },
    ],
  };
}
