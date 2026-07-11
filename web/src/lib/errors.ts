/**
 * ApiError — mirrors backend ApiException + validation errors.
 *
 * Backend error shapes:
 *   ApiException       → { success: false, message, code, data }
 *   Validation (422)   → { success: false, message, errors: { field: [...] } }
 *   AuthException (401)→ { success: false, message, data: [], statusCode: 401 }
 */
export class ApiError extends Error {
  /** HTTP status code. */
  readonly status: number;

  /** Internal error code from backend (e.g. 'NOT_FOUND', 'ACCOUNT_LOCKED'). */
  readonly code: string;

  /** Validation errors — present only when status = 422. */
  readonly errors: Record<string, string[]> | undefined;

  /** Extra data from backend (optional). */
  readonly data: unknown;

  constructor(
    message: string,
    status: number,
    code: string = "ERROR",
    errors?: Record<string, string[]>,
    data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.data = data;
  }

  /** True if this is a validation error (HTTP 422). */
  get isValidation(): boolean {
    return this.status === 422;
  }

  /** True if this is an authentication error (HTTP 401). */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** True if this is a forbidden error (HTTP 403). */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** True if this is a not-found error (HTTP 404). */
  get isNotFound(): boolean {
    return this.status === 404;
  }
}
