import type { ApiErrorBody, ValidationErrors } from '@/types/seller-api';

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody, fallbackMessage?: string) {
    super(body.message ?? fallbackMessage ?? `Error HTTP ${status}`);
    this.status = status;
    this.body = body;
  }

  get validationErrors(): ValidationErrors | undefined {
    return this.body.errors;
  }

  get accessStatus() {
    return this.body.access_status;
  }
}

export function getFieldError(errors: ValidationErrors | undefined, field: string): string | undefined {
  return errors?.[field]?.[0];
}

export function formatValidationErrors(errors: ValidationErrors | undefined): string {
  if (!errors) return '';
  return Object.values(errors)
    .flat()
    .join('\n');
}
