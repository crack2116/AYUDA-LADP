export type AppErrorCode =
  | "validation_error"
  | "duplicate_warning"
  | "forbidden"
  | "not_found"
  | "unexpected";

export interface AppError {
  code: AppErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function fail<T>(error: AppError): Result<T> {
  return { ok: false, error };
}
