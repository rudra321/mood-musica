// Typed domain errors + a single HTTP mapper. The boundary (the route handler)
// catches any error and calls toHttpError to produce a safe status + message —
// internal detail (stack, provider response) never leaks to the client.

export class AppError extends Error {
  /**
   * @param {string} message internal message (for logs)
   * @param {{ code?: string, status?: number, safeMessage?: string, cause?: unknown }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = "AppError";
    this.code = opts.code ?? "app_error";
    this.status = opts.status ?? 500;
    this.safeMessage = opts.safeMessage ?? "Something went wrong.";
    if (opts.cause !== undefined) this.cause = opts.cause;
  }
}

export class ConfigError extends AppError {
  constructor(message, opts = {}) {
    super(message, {
      code: "config_error",
      status: 500,
      safeMessage: "The service is misconfigured. Check the server setup.",
      ...opts,
    });
    this.name = "ConfigError";
  }
}

export class ValidationError extends AppError {
  constructor(message, opts = {}) {
    super(message, {
      code: "validation_error",
      status: 400,
      safeMessage: "Invalid request.",
      ...opts,
    });
    this.name = "ValidationError";
  }
}

export class InterpreterError extends AppError {
  constructor(message, opts = {}) {
    super(message, {
      code: "interpreter_error",
      status: 502,
      safeMessage: "Could not generate a vibe right now. Please try again.",
      ...opts,
    });
    this.name = "InterpreterError";
  }
}

export class ResolverError extends AppError {
  constructor(message, opts = {}) {
    super(message, {
      code: "resolver_error",
      status: 502,
      safeMessage: "Could not look up tracks right now. Please try again.",
      ...opts,
    });
    this.name = "ResolverError";
  }
}

/**
 * Map any thrown value to a safe HTTP status + JSON body.
 * @param {unknown} err
 * @returns {{ status: number, body: { error: { code: string, message: string } } }}
 */
export function toHttpError(err) {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: { error: { code: err.code, message: err.safeMessage } },
    };
  }
  return {
    status: 500,
    body: { error: { code: "internal_error", message: "Something went wrong." } },
  };
}
