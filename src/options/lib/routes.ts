export type SectionId =
  | 'dashboard'
  | 'profile'
  | 'documents'
  | 'applications'
  | 'designs'
  | 'providers'
  | 'prompts'
  | 'settings'
  | 'terms';

export interface SectionInfo {
  id: SectionId;
  label: string;
}

export const SECTIONS: SectionInfo[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'profile', label: 'My profile' },
  { id: 'documents', label: 'Documents' },
  { id: 'applications', label: 'Applications' },
  { id: 'designs', label: 'Resume designs' },
  { id: 'providers', label: 'AI providers' },
  { id: 'prompts', label: 'Prompts and style' },
  { id: 'settings', label: 'Settings' },
  { id: 'terms', label: 'Terms and privacy' },
];

export interface Route {
  section: SectionId;
  /** Application id for `#applications/<id>` and `#applications/<id>/edit`. */
  applicationId?: string;
  /** Application sub-view. */
  view?: 'detail' | 'edit';
  /** Part of a section to scroll to (e.g. the usage report in providers). */
  focus?: 'usage';
}

const SECTION_IDS = new Set<string>(SECTIONS.map((s) => s.id));

/** Parses a location hash (with or without the leading '#') into a route. Unknown hashes go to the dashboard. */
export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  const [head = '', ...rest] = raw.split('/').map((part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return part;
    }
  });
  const name = head.toLowerCase();
  if (name === 'usage') return { section: 'providers', focus: 'usage' };
  if (!SECTION_IDS.has(name)) return { section: 'dashboard' };
  const section = name as SectionId;
  if (section === 'applications' && rest[0]) {
    return { section, applicationId: rest[0], view: rest[1] === 'edit' ? 'edit' : 'detail' };
  }
  if (section === 'providers' && rest[0] === 'usage') return { section, focus: 'usage' };
  return { section };
}

/** Builds the hash (including '#') for a route. */
export function routeToHash(route: Route): string {
  if (route.section === 'providers' && route.focus === 'usage') return '#usage';
  if (route.section === 'applications' && route.applicationId) {
    const id = encodeURIComponent(route.applicationId);
    return route.view === 'edit' ? `#applications/${id}/edit` : `#applications/${id}`;
  }
  return `#${route.section}`;
}

export function applicationHash(id: string, edit = false): string {
  return routeToHash({ section: 'applications', applicationId: id, view: edit ? 'edit' : 'detail' });
}

export function navigate(hash: string): void {
  if (location.hash !== hash) location.hash = hash;
}
