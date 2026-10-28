/** All chrome.storage.local keys used by JobPaal. Everything lives in the user's browser. */
export const STORAGE_KEYS = {
  profile: 'profile',
  settings: 'settings',
  ai: 'ai',
  usage: 'usage',
  prompts: 'prompts',
  applications: 'applications',
  documents: 'documents',
  documentDataPrefix: 'docdata:',
  jobs: 'jobs',
  siteMappings: 'siteMappings',
  savedAnswers: 'savedAnswers',
  forcedPages: 'forcedPages',
  installedAt: 'installedAt',
} as const;
