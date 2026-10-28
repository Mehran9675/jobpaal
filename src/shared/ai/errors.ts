/** Thrown when an AI feature is used without a connected and active provider. */
export class AiNotConfiguredError extends Error {
  constructor() {
    super('Connect and activate an AI provider in JobPaal → AI providers to use this feature.');
    this.name = 'AiNotConfiguredError';
  }
}

/** HTTP failure from a provider, with a user-readable message. */
export class AiHttpError extends Error {
  readonly status: number;
  /** Raw provider error message (used to decide on retries). */
  readonly providerMessage: string;

  constructor(message: string, status: number, providerMessage: string) {
    super(message);
    this.name = 'AiHttpError';
    this.status = status;
    this.providerMessage = providerMessage;
  }
}

/** The model answered, but not in a usable shape (empty, unparseable JSON...). */
export class AiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiResponseError';
  }
}
