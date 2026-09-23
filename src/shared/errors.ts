const DEFAULT_STATUS_CODES: Record<string, number> = {
  validation_failed: 400,
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  internal_error: 500
};

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(
    public readonly code: string,
    public readonly messageKey: string,
    statusCode?: number,
    public readonly details?: unknown
  ) {
    super(code);
    this.name = 'AppError';
    this.statusCode = statusCode ?? DEFAULT_STATUS_CODES[code] ?? 400;
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
