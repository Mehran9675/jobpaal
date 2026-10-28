import { describe, expect, it } from 'vitest';
import { detectJob, identifySite } from '@/content/detection';
import { buildLocator } from '@/content/picker';
import type { SiteMapping } from '@/shared/types';
import { DESCRIPTION_HTML, load } from './helpers';

const DESCRIPTION_JSON = JSON.stringify(DESCRIPTION_HTML);

describe('JSON-LD detection', () => {
  it('reads a JobPosting inside @graph with a salary range', () => {
    const doc = load(`<html><head><title>Careers</title>
      <script type="application/ld+json">{"@context":"https://schema.org","@graph":[
        {"@type":"WebPage","name":"Careers"},
        {"@type":"JobPosting","title":"Senior Frontend Engineer","datePosted":"2026-10-01",
         "hiringOrganization":{"@type":"Organization","name":"Acme GmbH"},
         "jobLocation":[{"@type":"Place","address":{"@type":"PostalAddress","addressLocality":"Berlin","addressCountry":"DE"}}],
         "employmentType":["FULL_TIME","CONTRACTOR"],
         "baseSalary":{"@type":"MonetaryAmount","currency":"EUR","value":{"@type":"QuantitativeValue","minValue":70000,"maxValue":90000,"unitText":"YEAR"}},
         "description":${DESCRIPTION_JSON}}
      ]}</script>
      <script type="application/ld+json">{ this is not json </script>
      </head><body><h1>Careers</h1></body></html>`);
    const result = detectJob(doc, 'https://careers.acme.example/jobs/123', null);
    expect(result.isJobPage).toBe(true);
    expect(result.hasValidDescription).toBe(true);
    const job = result.job!;
    expect(job.title).toBe('Senior Frontend Engineer');
    expect(job.company).toBe('Acme GmbH');
    expect(job.location).toBe('Berlin, DE');
    expect(job.salary).toBe('€70,000 – €90,000 per year');
    expect(job.employmentType).toBe('Full-time, Contract');
    expect(job.postedAt).toBe('2026-10-01');
    expect(job.sources.title).toBe('structured');
    expect(job.sources.description).toBe('structured');
    expect(job.description).toContain('Responsibilities');
    expect(job.description).toContain('• Build and maintain features');
    expect(job.description.split('\n').length).toBeGreaterThan(5);
    expect(job.id).toMatch(/^job_[0-9a-f]{8}$/);
    expect(job.atsKey).toBe('generic');
    expect(job.requirements.length).toBeGreaterThan(0);
    expect(job.keywords.length).toBeGreaterThan(0);
  });
});

describe('site adapters', () => {
  it('reads Greenhouse markup', () => {
    const doc = load(`<html><head><title>Job Application for Senior Frontend Engineer at Acme</title></head><body>
      <div id="app_body"><div id="header"><h1 class="app-title">Senior Frontend Engineer</h1>
      <span class="company-name">at Acme</span><div class="location">Berlin, Germany</div></div>
      <div id="content">${DESCRIPTION_HTML}</div>
      <form id="application_form"><input id="first_name" name="job_application[first_name]"></form></div>
      </body></html>`);
    const url = 'https://boards.greenhouse.io/acme/jobs/4012345';
    expect(identifySite(url, doc)).toEqual({ key: 'greenhouse', name: 'Greenhouse' });
    const result = detectJob(doc, url, null);
    expect(result.isJobPage).toBe(true);
    expect(result.job?.title).toBe('Senior Frontend Engineer');
    expect(result.job?.company).toBe('Acme');
    expect(result.job?.location).toBe('Berlin, Germany');
    expect(result.job?.sources.description).toBe('adapter');
    expect(result.job?.atsKey).toBe('greenhouse');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('reads Lever markup', () => {
    const doc = load(`<html><head><title>Acme - Senior Frontend Engineer</title></head><body>
      <div class="posting-page">
        <div class="posting-headline"><h2>Senior Frontend Engineer</h2>
          <div class="posting-categories"><div class="sort-by-time posting-category location">Remote, Europe /</div>
          <div class="sort-by-commitment posting-category commitment">Full-time /</div></div></div>
        <div class="section-wrapper page-full-width">
          <div class="section page-centered" data-qa="job-description">${DESCRIPTION_HTML}</div>
          <div class="section page-centered"><h3>Nice to have</h3><ul class="posting-requirements"><li>Experience with design systems and accessibility audits.</li></ul></div>
          <div class="section page-centered last-section-apply"><a class="postings-btn template-btn-submit" href="/apply">Apply for this job</a></div>
        </div>
      </div></body></html>`);
    const result = detectJob(doc, 'https://jobs.lever.co/acme/0b1c2d3e-aaaa-bbbb-cccc-1234567890ab', null);
    expect(result.isJobPage).toBe(true);
    expect(result.job?.siteName).toBe('Lever');
    expect(result.job?.title).toBe('Senior Frontend Engineer');
    expect(result.job?.company).toBe('Acme');
    expect(result.job?.location).toBe('Remote, Europe');
    expect(result.job?.employmentType).toBe('Full-time');
    expect(result.job?.description).toContain('design systems');
    expect(result.job?.description).not.toContain('Apply for this job');
  });
});

describe('generic reader', () => {
  it('finds a real description on an unknown site', () => {
    const doc = load(`<html><head><title>Senior Frontend Engineer at Nimbus | Nimbus Careers</title>
      <meta property="og:site_name" content="Nimbus"></head><body>
      <header><nav><a href="/">Home</a><a href="/jobs">Jobs</a><a href="/about">About us</a></nav></header>
      <main><h1>Senior Frontend Engineer</h1><div class="meta"><span>Location: Amsterdam, Netherlands</span></div>
      <article class="job">${DESCRIPTION_HTML}</article>
      <a class="btn" href="/jobs/42/apply">Apply now</a></main>
      <footer><p>Copyright Nimbus. All rights reserved. Privacy policy and terms of use apply to this website and its content.</p></footer>
      </body></html>`);
    const result = detectJob(doc, 'https://nimbus.example/careers/42', null);
    expect(result.hasValidDescription).toBe(true);
    expect(result.isJobPage).toBe(true);
    expect(result.job?.title).toBe('Senior Frontend Engineer');
    expect(result.job?.company).toBe('Nimbus');
    expect(result.job?.location).toBe('Amsterdam, Netherlands');
    expect(result.job?.sources.description).toBe('generic');
    expect(result.job?.description).toContain('About the role');
    expect(result.job?.description).not.toContain('Home');
    expect(result.issues).toEqual([]);
  });

  it('rejects select options and navigation labels as a description', () => {
    const options = Array.from({ length: 80 }, (_, i) => `<option>Option Label ${i}</option>`).join('');
    const links = Array.from({ length: 40 }, (_, i) => `<li><a href="/c/${i}">Category Name ${i}</a></li>`).join('');
    const doc = load(`<html><head><title>Apply</title></head><body>
      <h1>Product Designer</h1>
      <div class="sidebar"><ul>${links}</ul></div>
      <div><label>Country<select>${options}</select></label></div>
      <div class="labels"><span>Department</span><span>Team</span><span>Office</span><span>Remote</span></div>
      </body></html>`);
    const result = detectJob(doc, 'https://example.com/apply', null);
    expect(result.hasValidDescription).toBe(false);
    expect(result.job?.description ?? '').toBe('');
    expect(result.isJobPage).toBe(false);
    const issue = result.issues.find((i) => i.field === 'description');
    expect(issue?.message).toMatch(/No real job description was found/);
  });

  it('does not treat an ordinary article as a job page', () => {
    const paragraphs = Array.from(
      { length: 6 },
      () => '<p>The city council met on Tuesday to discuss the new park, and residents shared their views on the plans for the river walk and the playground near the old station.</p>',
    ).join('');
    const doc = load(`<html><head><title>Council debates new park</title></head><body><h1>Council debates new park</h1><article>${paragraphs}</article></body></html>`);
    const result = detectJob(doc, 'https://news.example/2026/10/park', null);
    expect(result.isJobPage).toBe(false);
  });

  it('applies site-mapping (guide) locators first', () => {
    const doc = load(`<html><head><title>Opening</title></head><body>
      <div class="x"><span class="role">Data Analyst</span><span class="org">Contoso</span></div>
      <div class="desc">${DESCRIPTION_HTML}</div></body></html>`);
    const mapping: SiteMapping = {
      host: 'contoso.example',
      jobFields: {
        title: buildLocator(doc.querySelector('.role')!, ''),
        company: buildLocator(doc.querySelector('.org')!, ''),
        description: buildLocator(doc.querySelector('.desc')!, ''),
      },
      formFields: [],
      updatedAt: 0,
    };
    const result = detectJob(doc, 'https://contoso.example/o/1', mapping);
    expect(result.isJobPage).toBe(true);
    expect(result.job?.title).toBe('Data Analyst');
    expect(result.job?.company).toBe('Contoso');
    expect(result.job?.sources).toMatchObject({ title: 'guide', company: 'guide', description: 'guide' });
  });

  it('never throws on an empty document', () => {
    const doc = load('<html><body></body></html>');
    const result = detectJob(doc, 'not a url', null);
    expect(result.job).toBeNull();
    expect(result.isJobPage).toBe(false);
  });
});
