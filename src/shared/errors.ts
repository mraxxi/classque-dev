export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly messageKey: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(code);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        messageKey: this.messageKey,
        details: this.details
      }
    };
  }
}

export function notFound(messageKey = 'errors.not_found') {
  return new AppError('not_found', messageKey, 404);
}

export function forbidden(messageKey = 'errors.forbidden') {
  return new AppError('forbidden', messageKey, 403);
}

export function validationFailed(details: unknown, messageKey = 'errors.validation_failed') {
  return new AppError('validation_failed', messageKey, 400, details);
}
