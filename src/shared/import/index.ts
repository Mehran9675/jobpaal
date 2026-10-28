/**
 * CONTRACT — implemented by the documents module. Resume import (runs in extension pages with DOM).
 */
import type { Profile } from '@/shared/types';

/** Extracts plain text from a PDF, DOCX, TXT or MD file. */
export declare function extractTextFromFile(file: File): Promise<string>;
/** Converts a JSON Resume (jsonresume.org schema) object into profile data. */
export declare function jsonResumeToProfile(json: unknown): Partial<Profile>;
/** Merges imported data into a profile, generating ids for new entries. Imported scalar values replace empty ones only unless `overwrite`. */
export declare function mergeProfile(base: Profile, incoming: Partial<Profile>, overwrite: boolean): Profile;
