import {
  appendPreparedFileToFormData,
  prepareFileForMultipart,
  type PreparedMultipartFile,
} from '@/utils/prepare-multipart-file';

export type PendingDocument = {
  uri: string;
  name: string;
  type: string;
};

const PDF_MIME = 'application/pdf';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const XLS_MIME = 'application/vnd.ms-excel';

export function mimeTypeForDocumentName(fileName: string, fallback: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return PDF_MIME;
  if (ext === 'xlsx') return XLSX_MIME;
  if (ext === 'xls') return XLS_MIME;
  return fallback;
}

export async function preparePdfForMultipart(doc: PendingDocument): Promise<PreparedMultipartFile> {
  const type = mimeTypeForDocumentName(doc.name, PDF_MIME);
  return prepareFileForMultipart(doc.uri, doc.name, type);
}

export async function prepareExcelForMultipart(doc: PendingDocument): Promise<PreparedMultipartFile> {
  const type = mimeTypeForDocumentName(doc.name, doc.type || XLSX_MIME);
  return prepareFileForMultipart(doc.uri, doc.name, type);
}

export function appendPdfToFormData(formData: FormData, prepared: PreparedMultipartFile): void {
  appendPreparedFileToFormData(formData, 'pdf', prepared);
}

export function appendExcelToFormData(formData: FormData, prepared: PreparedMultipartFile): void {
  appendPreparedFileToFormData(formData, 'excel', prepared);
}
