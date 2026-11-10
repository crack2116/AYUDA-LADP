import type { AppError } from "@/application/result";

/** Structural shape of a validation issue; keeps the application layer free of zod. */
export interface ValidationIssue {
  path: ReadonlyArray<PropertyKey>;
  message: string;
}

export interface ValidationIssueBag {
  issues: ReadonlyArray<ValidationIssue>;
}

/**
 * Converts validation issues into the per-field Spanish messages the UI renders.
 * The first issue per field wins so the form stays readable.
 */
export function toValidationError(error: ValidationIssueBag): AppError {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path.length > 0 ? issue.path.map(String).join(".") : "form";
    if (!fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return {
    code: "validation_error",
    message: "Revisa los datos ingresados.",
    fieldErrors,
  };
}
