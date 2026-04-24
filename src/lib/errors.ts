export class AppError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;

  constructor(message: string, options?: { code?: string; statusCode?: number; details?: unknown }) {
    super(message);
    this.name = "AppError";
    this.code = options?.code ?? "APP_ERROR";
    this.statusCode = options?.statusCode ?? 500;
    this.details = options?.details;
  }
}

export class ValidationAppError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { code: "VALIDATION_ERROR", statusCode: 400, details });
    this.name = "ValidationAppError";
  }
}

export class ConfigAppError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { code: "CONFIG_ERROR", statusCode: 500, details });
    this.name = "ConfigAppError";
  }
}

export class NotFoundAppError extends AppError {
  constructor(message: string) {
    super(message, { code: "NOT_FOUND", statusCode: 404 });
    this.name = "NotFoundAppError";
  }
}

export class UnauthorizedAppError extends AppError {
  constructor(message: string) {
    super(message, { code: "UNAUTHORIZED", statusCode: 401 });
    this.name = "UnauthorizedAppError";
  }
}
