import { cleanInline, isInsideOverlay } from '@/content/picker/dom';

const APPLY_TEXT = /^(apply|apply now|apply here|apply online|apply for (this|the) (job|position|role)|easy apply|quick apply|submit (your )?application|start (your )?application|i'?m interested|apply on company (site|website))$/i;

const TITLE_WORDS =
  /\b(engineer|developer|manager|designer|analyst|specialist|scientist|consultant|director|lead|head of|architect|administrator|coordinator|associate|assistant|intern(ship)?|technician|representative|officer|nurse|accountant|recruiter|writer|editor|marketer|programmer|operator|agent|advisor|executive|supervisor|strategist|researcher|teacher|tutor|driver|clerk|cashier|chef|cook|electrician|mechanic|therapist|pharmacist|physician|attorney|paralegal|product owner|devops|sre|qa|tester|vp|president|partner|trainee|apprentice|fellow)\b/i;

/** An apply button / link exists on the page. */
export function hasApplySignal(doc: Document): boolean {
  try {
    const items = doc.querySelectorAll('a, button, input[type=submit], [role="button"]');
    const max = Math.min(items.length, 1500);
    for (let i = 0; i < max; i++) {
      const el = items[i];
      if (isInsideOverlay(el)) continue;
      const text = cleanInline(el.textContent || el.getAttribute('value') || el.getAttribute('aria-label'), 80);
      if (text && text.length <= 50 && APPLY_TEXT.test(text)) return true;
    }
    if (doc.querySelector('a[href*="/apply"], form[action*="apply"], [data-automation-id*="apply"], #application_form, #application-form')) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function hasTitleWord(title: string): boolean {
  return TITLE_WORDS.test(title);
}

export function hasJobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /(job|career|position|opening|vacanc|posting|requisition|stellen|empleo|emploi|offre|vacature)/i.test(parsed.pathname + parsed.search);
  } catch {
    return false;
  }
}

/**
 * Number of distinct links that look like individual job postings. Search / listing pages
 * have many; a single posting has few (similar jobs widgets aside).
 */
export function jobLinkCount(doc: Document, url: string): number {
  const seen = new Set<string>();
  try {
    const own = new URL(url);
    const links = doc.querySelectorAll('a[href]');
    const max = Math.min(links.length, 3000);
    for (let i = 0; i < max; i++) {
      const href = links[i].getAttribute('href') ?? '';
      if (!/(\/(jobs?|careers?|positions?|openings?|vacanc\w*|postings?|job-listing|viewjob)\/?[^?#]*[\w-]{3,})|([?&](jk|jobid|job_id|gh_jid|jid|currentJobId)=)/i.test(href)) continue;
      let resolved: URL;
      try {
        resolved = new URL(href, own);
      } catch {
        continue;
      }
      if (resolved.pathname === own.pathname && resolved.search === own.search) continue;
      const key = resolved.pathname + resolved.search;
      if (/\/(search|login|signin|apply)\b/i.test(resolved.pathname)) continue;
      seen.add(key);
    }
  } catch {
    /* ignore */
  }
  return seen.size;
}
