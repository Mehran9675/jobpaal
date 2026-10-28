/** CONTRACT — implemented by the page-reading module. */
import type { Profile } from '@/shared/types';

export declare function isLinkedInProfilePage(url: string): boolean;
/** Reads the open LinkedIn profile page into profile data, or null when it is not readable. */
export declare function scanLinkedInProfile(doc: Document): Partial<Profile> | null;
