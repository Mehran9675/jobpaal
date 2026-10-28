import type { ResumeContent } from '@/shared/types';
import { nonEmpty } from './text';
import type { DocHeader } from './types';

export function personName(content: ResumeContent): string {
  return (content.name || nonEmpty([content.firstName, content.lastName]).join(' ')).trim();
}

export function buildHeader(content: ResumeContent, options: { photo: boolean; headline: boolean }): DocHeader {
  const contact = content.contact ?? { email: '', phone: '', location: '', links: [] };
  return {
    name: personName(content),
    headline: options.headline ? (content.headline ?? '').trim() : '',
    contact: nonEmpty([contact.email, contact.phone, contact.location]),
    links: (contact.links ?? [])
      .filter((l) => (l.url ?? '').trim())
      .map((l) => ({ label: (l.label ?? '').trim(), url: l.url.trim() })),
    photo: options.photo && /^data:image\/(png|jpe?g);base64,/i.test(content.photo ?? '') ? content.photo : '',
  };
}
