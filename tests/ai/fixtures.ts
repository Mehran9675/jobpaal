import { createEmptyProfile } from '@/shared/defaults/profile';
import type { JobAnalysis, JobPosting, Profile, ProviderConfig } from '@/shared/types';

export function makeProfile(): Profile {
  const profile = createEmptyProfile();
  profile.basics.firstName = 'Ada';
  profile.basics.lastName = 'Park';
  profile.basics.email = 'ada@example.com';
  profile.summary = 'Backend engineer building Go services and Kubernetes platforms.';
  profile.skills = [
    { id: 's1', name: 'Languages', skills: ['Go', 'Python', 'C++'] },
    { id: 's2', name: 'Platforms', skills: ['Kubernetes', 'PostgreSQL', 'Node.js'] },
  ];
  profile.experience = [
    {
      id: 'e1',
      company: 'Acme',
      title: 'Backend Engineer',
      location: 'Berlin',
      startDate: '2021-03',
      endDate: '',
      current: true,
      description: 'Payments platform team.',
      highlights: ['Reduced API latency by 40% by caching hot paths', 'Migrated 12 services to Kubernetes'],
      skills: ['Go', 'Kubernetes'],
    },
    {
      id: 'e2',
      company: 'Beta GmbH',
      title: 'Software Developer',
      location: 'Hamburg',
      startDate: '2019-01',
      endDate: '2021-02',
      current: false,
      description: '',
      highlights: ['Built internal billing tools in Python'],
      skills: ['Python'],
    },
  ];
  profile.projects = [
    {
      id: 'p1',
      name: 'Tracer',
      role: 'Author',
      url: '',
      startDate: '2022',
      endDate: '',
      description: 'Open source tracing library.',
      highlights: ['Used by 300 developers'],
      skills: ['Go'],
    },
  ];
  profile.eligibility.authorizedCountries = 'Germany, EU';
  profile.eligibility.requiresSponsorship = 'no';
  profile.eligibility.noticePeriod = '3 months';
  return profile;
}

export function makeJob(overrides: Partial<JobPosting> = {}): JobPosting {
  return {
    id: 'j1',
    url: 'https://jobs.example.com/1',
    pageKey: 'https://jobs.example.com/1',
    host: 'jobs.example.com',
    siteName: 'Example',
    atsKey: 'generic',
    title: 'Senior Backend Engineer',
    company: 'Globex',
    location: 'Berlin, Germany',
    salary: '',
    employmentType: 'Full-time',
    description: 'We are looking for a Senior Backend Engineer with Go, Kubernetes and Kafka experience. Contact Jane Smith.',
    requirements: [],
    keywords: ['Go', 'Kafka', 'Terraform'],
    postedAt: '',
    sources: {},
    detectedAt: 0,
    ...overrides,
  };
}

export function makeAnalysis(overrides: Partial<JobAnalysis> = {}): JobAnalysis {
  return {
    seniority: 'senior',
    responsibilities: [],
    requiredSkills: ['Go', 'Kubernetes', 'Kafka'],
    preferredSkills: ['Terraform', 'Rust'],
    atsKeywords: ['microservices', 'Kafka'],
    cultureSignals: [],
    redFlags: [],
    summary: '',
    mustProveThemes: [],
    score: 70,
    recommendation: 'good match',
    reasons: [],
    matchedSkills: ['Go', 'Kubernetes'],
    missingSkills: ['Kafka', 'Terraform'],
    analyzedAt: 0,
    descriptionHash: '',
    providerId: 'prov',
    ...overrides,
  };
}

export function makeConfig(overrides: Partial<ProviderConfig> = {}): ProviderConfig {
  return {
    id: 'prov',
    presetId: 'openai',
    name: 'OpenAI',
    protocol: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-test',
    model: 'gpt-4.1-mini',
    extra: {},
    temperature: 0.3,
    maxTokens: 1000,
    lastTest: null,
    createdAt: 0,
    ...overrides,
  };
}
