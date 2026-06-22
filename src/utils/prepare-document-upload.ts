import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

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

function sanitizeDocumentFileName(name: string, fallbackExt: string): string {
  const trimmed = name.trim() || `catalogo.${fallbackExt}`;
  const base = trimmed.split(/[/\\]/).pop() ?? trimmed;
  return base.includes('.') ? base : `${base}.${fallbackExt}`;
}

/**
 * En Android/iOS el binario del PDF/Excel debe quedar en caché de la app con nombre limpio;
 * si se pasa la URI del selector directo a FormData, PHP a veces no recibe el archivo.
 */
async function prepareDocumentForMultipart(
  doc: PendingDocument,
  fallbackExt: string,
  mimeType: string,
): Promise<PreparedMultipartFile> {
  const safeName = sanitizeDocumentFileName(doc.name, fallbackExt);

  if (Platform.OS === 'web') {
    return prepareFileForMultipart(doc.uri, safeName, mimeType);
  }

  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error('No hay directorio de caché para preparar el documento.');
  }

  const ext = safeName.split('.').pop()?.toLowerCase() ?? fallbackExt;
  const uploadUri = `${cacheDir}upload-${Date.now()}.${ext}`;
  await FileSystem.copyAsync({ from: doc.uri, to: uploadUri });

  const info = await FileSystem.getInfoAsync(uploadUri);
  if (!info.exists) {
    throw new Error('No se pudo leer el archivo seleccionado.');
  }
  if ('size' in info && info.size !== undefined && info.size === 0) {
    throw new Error('El archivo seleccionado está vacío.');
  }

  return { uri: uploadUri, name: safeName, type: mimeType };
}

export async function preparePdfForMultipart(doc: PendingDocument): Promise<PreparedMultipartFile> {
  const type = mimeTypeForDocumentName(doc.name, PDF_MIME);
  return prepareDocumentForMultipart(doc, 'pdf', type);
}

export async function prepareExcelForMultipart(doc: PendingDocument): Promise<PreparedMultipartFile> {
  const type = mimeTypeForDocumentName(doc.name, doc.type || XLSX_MIME);
  const ext = type === XLS_MIME ? 'xls' : 'xlsx';
  return prepareDocumentForMultipart(doc, ext, type);
}

export function appendPdfToFormData(formData: FormData, prepared: PreparedMultipartFile): void {
  appendPreparedFileToFormData(formData, 'pdf', prepared);
}

export function appendExcelToFormData(formData: FormData, prepared: PreparedMultipartFile): void {
  appendPreparedFileToFormData(formData, 'excel', prepared);
}
