import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import {
  CATALOG_CAROUSEL_COUNT,
  countPendingCatalogImages,
  validateCatalogUploadLimits,
  type PendingCatalogImage,
} from '@/services/catalog-upload';
import type { CatalogImage } from '@/types/seller-api';
import type { PendingDocument } from '@/utils/prepare-document-upload';

function buildSavedCountBySlot(catalogImages: CatalogImage[]): Map<number, number> {
  const map = new Map<number, number>();
  for (let slot = 1; slot <= CATALOG_CAROUSEL_COUNT; slot++) {
    map.set(slot, 0);
  }
  catalogImages.forEach((img) => {
    map.set(img.display_order, (map.get(img.display_order) ?? 0) + 1);
  });
  return map;
}

const MAX_DESCRIPTION = 100;
const MAX_WHATSAPP_DIGITS = 12;
const MAX_DOCUMENT_BYTES = 300 * 1024 * 1024;

export type ProfileFormValidationInput = {
  businessName: string;
  categoryId: number | null;
  description: string;
  country: string;
  state: string[];
  whatsappDialCode: string;
  whatsappNumber: string;
  instagram: string;
  facebook: string;
  website: string;
  pendingPdf: PendingDocument | null;
  pendingExcel: PendingDocument | null;
  catalogImages: CatalogImage[];
  pendingCatalogBySlot: Record<number, PendingCatalogImage[]>;
};

function fileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function isValidWebsite(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function validateWhatsapp(dialCode: string, number: string): string | null {
  const digits = number.replace(/\D/g, '');
  if (!digits.length) {
    return 'Ingresa tu número de WhatsApp.';
  }
  if (digits.length > MAX_WHATSAPP_DIGITS) {
    return `El número de WhatsApp no puede tener más de ${MAX_WHATSAPP_DIGITS} dígitos.`;
  }
  if (!dialCode.trim()) {
    return 'Selecciona el prefijo de tu país para WhatsApp.';
  }
  return null;
}

function validatePendingPdf(pdf: PendingDocument | null): string | null {
  if (!pdf) return null;
  if (fileExtension(pdf.name) !== 'pdf') {
    return 'El catálogo debe ser un archivo PDF (.pdf).';
  }
  return null;
}

function validatePendingExcel(excel: PendingDocument | null): string | null {
  if (!excel) return null;
  const ext = fileExtension(excel.name);
  if (ext !== 'xlsx' && ext !== 'xls') {
    return 'La lista de productos debe ser Excel (.xlsx o .xls).';
  }
  return null;
}

/**
 * Validaciones en la app antes de llamar al API (evita 422 por archivos mal formados o datos inválidos).
 */
export function validateProfileFormBeforeSave(input: ProfileFormValidationInput): string | null {
  if (!input.businessName.trim()) {
    return 'Ingresa el nombre comercial.';
  }

  if (input.businessName.trim().length > 255) {
    return 'El nombre comercial no puede superar 255 caracteres.';
  }

  if (!input.categoryId) {
    return 'Selecciona un rubro de negocio.';
  }

  if (input.description.length > MAX_DESCRIPTION) {
    return `La descripción no puede superar ${MAX_DESCRIPTION} caracteres.`;
  }

  if (!input.country.trim()) {
    return 'Selecciona un país.';
  }

  if (input.state.length === 0) {
    return 'Selecciona al menos un estado o provincia.';
  }

  const whatsappError = validateWhatsapp(input.whatsappDialCode, input.whatsappNumber);
  if (whatsappError) return whatsappError;

  if (input.instagram.length > 25) {
    return 'Instagram no puede superar 25 caracteres.';
  }

  if (input.facebook.length > 25) {
    return 'Facebook no puede superar 25 caracteres.';
  }

  if (!isValidWebsite(input.website)) {
    return 'La página web no tiene un formato válido (ej. https://misitio.com).';
  }

  const pdfError = validatePendingPdf(input.pendingPdf);
  if (pdfError) return pdfError;

  const excelError = validatePendingExcel(input.pendingExcel);
  if (excelError) return excelError;

  const catalogError = validateCatalogUploadLimits(
    input.catalogImages.length,
    input.pendingCatalogBySlot,
    buildSavedCountBySlot(input.catalogImages),
  );
  if (catalogError) return catalogError;

  return null;
}

async function readDocumentByteSize(uri: string): Promise<number | null> {
  if (Platform.OS === 'web') {
    if (typeof fetch === 'undefined') return null;
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob.size;
    } catch {
      return null;
    }
  }

  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && 'size' in info && typeof info.size === 'number') {
      return info.size;
    }
  } catch {
    return null;
  }

  return null;
}

/** Tras elegir archivo, comprobar que no supere 300 MB (web y móvil). */
export async function validateDocumentSizeOnWeb(
  uri: string,
  label: string,
): Promise<string | null> {
  const size = await readDocumentByteSize(uri);
  if (size != null && size > MAX_DOCUMENT_BYTES) {
    return `${label} no puede superar 300 MB.`;
  }

  return null;
}
