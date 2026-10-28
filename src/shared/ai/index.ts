/**
 * CONTRACT — implemented by the AI module. Public API of src/shared/ai.
 * All functions run in the background script (service worker / event page).
 */
import type {
  CompletionRequest,
  CompletionResult,
  CoverLetterContent,
  JobAnalysis,
  JobPosting,
  Profile,
  ProviderConfig,
  ProviderPreset,
  ResumeContent,
  ScreeningAnswer,
  ScreeningQuestion,
  AiTask,
} from '@/shared/types';

export class AiNotConfiguredError extends Error {
  constructor() {
    super('Connect and activate an AI provider in JobPaal → AI providers to use this feature.');
    this.name = 'AiNotConfiguredError';
  }
}

export declare const PROVIDER_PRESETS: ProviderPreset[];
export declare function getPreset(id: string): ProviderPreset | undefined;
export declare function complete(config: ProviderConfig, request: CompletionRequest): Promise<CompletionResult>;
export declare function listModels(config: ProviderConfig): Promise<string[]>;
export declare function testConnection(config: ProviderConfig): Promise<{ ok: boolean; message: string }>;
export declare function runAi(task: AiTask, request: CompletionRequest): Promise<CompletionResult & { providerId: string }>;
export declare function isAiReady(): Promise<boolean>;
export declare function analyzeJob(job: JobPosting, profile: Profile): Promise<JobAnalysis>;
export declare function tailorResume(job: JobPosting, analysis: JobAnalysis, profile: Profile): Promise<ResumeContent>;
export declare function writeCoverLetter(job: JobPosting, analysis: JobAnalysis, profile: Profile, resume: ResumeContent): Promise<CoverLetterContent>;
export declare function answerQuestions(questions: ScreeningQuestion[], job: JobPosting, analysis: JobAnalysis | null, profile: Profile): Promise<ScreeningAnswer[]>;
export declare function draftAnswer(question: string, options: string[], job: JobPosting | null, profile: Profile): Promise<string>;
export declare function parseResumeText(text: string): Promise<Partial<Profile>>;
