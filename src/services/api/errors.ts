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

function translateValidationMessage(message: string): string {
  const normalized = message.trim();

  if (/^the pdf failed to upload\.?$/i.test(normalized)) {
    return 'No se pudo subir el PDF. Comprueba que pese menos de 300 MB y vuelve a intentarlo.';
  }
  if (/^the excel failed to upload\.?$/i.test(normalized)) {
    return 'No se pudo subir el Excel. Comprueba que pese menos de 300 MB y vuelve a intentarlo.';
  }
  if (/^the pdf must be a file of type: pdf\.?$/i.test(normalized)) {
    return 'El catálogo debe ser un archivo PDF (.pdf).';
  }
  if (/^the excel must be a file of type: (xlsx, xls)\.?$/i.test(normalized)) {
    return 'La lista debe ser un archivo Excel (.xlsx o .xls).';
  }

  return message;
}

export function formatValidationErrors(errors: ValidationErrors | undefined): string {
  if (!errors) return '';
  return Object.values(errors)
    .flat()
    .map(translateValidationMessage)
    .join('\n');
}
