/** A typed error that route handlers turn into a clean HTTP response. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, message: string, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const unauthorized = (message = 'You need to sign in.') =>
  new ApiError(401, message, 'unauthorized');

export const forbidden = (message = 'You do not have access to this.') =>
  new ApiError(403, message, 'forbidden');

export const notFound = (message = 'Not found.') => new ApiError(404, message, 'not_found');

export const badRequest = (message = 'The request was invalid.') =>
  new ApiError(400, message, 'bad_request');

export const rateLimited = (message = 'Too many requests. Slow down.') =>
  new ApiError(429, message, 'rate_limited');

export const quotaExceeded = (message = 'You have reached a plan limit.') =>
  new ApiError(429, message, 'quota_exceeded');
