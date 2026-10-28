import { cleanInline } from '@/content/picker/dom';
import { companyFromSlug, descriptionText, MAX_DESCRIPTION } from '../dom';
import type { SiteAdapter } from '../types';
import { extractBySelectors, hostIs, pathSegment } from './helpers';

function leverDescription(doc: Document): string {
  try {
    const sections = Array.from(
      doc.querySelectorAll('.posting-page .section-wrapper .section.page-centered, .content .section-wrapper .section'),
    ).filter(
      (el) =>
        !el.classList.contains('last-section-apply') &&
        !el.querySelector('a.postings-btn, .template-btn-submit, form') &&
        !el.closest('.posting-headline'),
    );
    return sections
      .map((el) => descriptionText(el))
      .filter(Boolean)
      .join('\n\n')
      .slice(0, MAX_DESCRIPTION);
  } catch {
    return '';
  }
}

export const leverAdapter: SiteAdapter = {
  key: 'lever',
  name: 'Lever',
  matches: (url) => hostIs(url, 'jobs.lever.co', 'jobs.eu.lever.co'),
  isJobPage: (url) => url.pathname.split('/').filter(Boolean).length >= 2,
  extract(doc, url) {
    const job = extractBySelectors(doc, {
      title: ['.posting-headline h2', '.posting-header h2', 'h2'],
      location: ['.posting-categories .location', '.posting-category.location', '.sort-by-time.posting-category'],
      employmentType: ['.posting-categories .commitment', '.posting-category.commitment'],
      salary: ['.posting-categories .salary', '[data-qa="salary-range"]'],
      description: ['[data-qa="job-description"]'],
    });
    const full = leverDescription(doc);
    if (full.length > (job.description?.length ?? 0)) job.description = full;
    const logoAlt = cleanInline(doc.querySelector('.main-header-logo img')?.getAttribute('alt'), 80).replace(/\s*logo$/i, '');
    const titleCompany = cleanInline(doc.title).split(/\s+-\s+/)[0] ?? '';
    job.company = logoAlt || (titleCompany && titleCompany !== job.title ? titleCompany : '') || companyFromSlug(pathSegment(url, 0));
    if (job.location) job.location = job.location.replace(/\s*\/\s*$/, '');
    if (job.employmentType) job.employmentType = job.employmentType.replace(/\s*\/\s*$/, '');
    return job;
  },
};
