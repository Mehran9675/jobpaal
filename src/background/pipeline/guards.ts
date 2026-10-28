import { TERMS_VERSION } from '@/shared/defaults/settings';
import { AiNotConfiguredError, isAiReady } from '@/shared/ai';
import { getProfile, getSettings, isProfileUsable } from '@/shared/storage';
import { checkJobDescriptionProse } from '@/shared/text/prose';
import type { JobPosting, Profile } from '@/shared/types';

export async function assertTermsAccepted(): Promise<void> {
  const settings = await getSettings();
  if (settings.terms?.version !== TERMS_VERSION) {
    throw new Error('Accept the JobPaal terms in the management page before using this feature.');
  }
}

export async function assertAiReady(): Promise<void> {
  if (!(await isAiReady())) throw new AiNotConfiguredError();
}

export async function requireUsableProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!isProfileUsable(profile)) {
    throw new Error('Your profile is empty. Add your experience in JobPaal → My profile (or import a resume) first.');
  }
  return profile;
}

/** The prose rule applies to every description, wherever it came from. */
export function assertRealDescription(job: JobPosting): void {
  const check = checkJobDescriptionProse(job.description);
  if (!check.ok) {
    throw new Error(
      `No usable job description: ${check.reason} Pick the description on the page, paste it, or choose a recent job.`,
    );
  }
}
