import type { CatalogImage } from '@/types/seller-api';

import { ApiError } from '@/services/api/errors';
import { uploadCatalogImage } from '@/services/api/seller';

/** 5 carruseles × 5 imágenes (alineado con Laravel). */
export const CATALOG_CAROUSEL_COUNT = 5;
export const CATALOG_MAX_IMAGES_PER_CAROUSEL = 5;
export const CATALOG_MAX_IMAGES_TOTAL = 25;

export type PendingCatalogImage = {
  localId: string;
  uri: string;
};

export type CatalogUploadJob = {
  localId: string;
  uri: string;
  displayOrder: number;
};

export type CatalogUploadProgress = {
  completed: number;
  total: number;
  displayOrder: number;
};

export type CatalogUploadFailure = {
  job: CatalogUploadJob;
  message: string;
};

export type CatalogUploadResult = {
  uploaded: CatalogImage[];
  failures: CatalogUploadFailure[];
};

export function countPendingCatalogImages(
  pendingBySlot: Record<number, PendingCatalogImage[]>,
): number {
  return Object.values(pendingBySlot).reduce((sum, list) => sum + list.length, 0);
}

/**
 * Valida límites antes de subir (5 por carrusel, 25 en total con las ya guardadas).
 */
export function validateCatalogUploadLimits(
  savedImageCount: number,
  pendingBySlot: Record<number, PendingCatalogImage[]>,
  savedCountBySlot?: Map<number, number>,
): string | null {
  const pendingTotal = countPendingCatalogImages(pendingBySlot);
  const savedBySlot = savedCountBySlot ?? new Map<number, number>();

  if (savedImageCount + pendingTotal > CATALOG_MAX_IMAGES_TOTAL) {
    return `Solo puedes tener hasta ${CATALOG_MAX_IMAGES_TOTAL} imágenes de catálogo en total.`;
  }

  for (let slot = 1; slot <= CATALOG_CAROUSEL_COUNT; slot++) {
    const pendingInSlot = pendingBySlot[slot]?.length ?? 0;
    const savedInSlot = savedBySlot.get(slot) ?? 0;
    if (savedInSlot + pendingInSlot > CATALOG_MAX_IMAGES_PER_CAROUSEL) {
      return `El carrusel ${slot} solo admite ${CATALOG_MAX_IMAGES_PER_CAROUSEL} imágenes.`;
    }
  }

  return null;
}

export function buildCatalogUploadQueue(
  pendingBySlot: Record<number, PendingCatalogImage[]>,
): CatalogUploadJob[] {
  const jobs: CatalogUploadJob[] = [];

  for (let slot = 1; slot <= CATALOG_CAROUSEL_COUNT; slot++) {
    const pending = pendingBySlot[slot] ?? [];
    for (const item of pending) {
      jobs.push({
        localId: item.localId,
        uri: item.uri,
        displayOrder: slot,
      });
    }
  }

  return jobs;
}

function errorMessageFromUnknown(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'No se pudo subir la imagen.';
}

/**
 * Sube imágenes una por una (POST /catalog-images por archivo).
 * Laravel → Firebase Storage → URL en BD. No hay multipart múltiple en un solo request.
 */
export async function uploadCatalogImageQueue(
  jobs: CatalogUploadJob[],
  onProgress?: (progress: CatalogUploadProgress) => void,
): Promise<CatalogUploadResult> {
  const uploaded: CatalogImage[] = [];
  const failures: CatalogUploadFailure[] = [];
  const total = jobs.length;

  for (let index = 0; index < jobs.length; index++) {
    const job = jobs[index]!;
    onProgress?.({
      completed: index,
      total,
      displayOrder: job.displayOrder,
    });

    try {
      uploaded.push(await uploadCatalogImage(job.uri, job.displayOrder));
    } catch (error: unknown) {
      failures.push({
        job,
        message: errorMessageFromUnknown(error),
      });
    }
  }

  onProgress?.({
    completed: total,
    total,
    displayOrder: jobs[total - 1]?.displayOrder ?? 1,
  });

  return { uploaded, failures };
}

export function applyCatalogUploadResultToPending(
  pendingBySlot: Record<number, PendingCatalogImage[]>,
  result: CatalogUploadResult,
): Record<number, PendingCatalogImage[]> {
  if (result.failures.length === 0) {
    return {};
  }

  const failedLocalIds = new Set(result.failures.map((f) => f.job.localId));
  const next: Record<number, PendingCatalogImage[]> = {};

  for (let slot = 1; slot <= CATALOG_CAROUSEL_COUNT; slot++) {
    const remaining = (pendingBySlot[slot] ?? []).filter((item) =>
      failedLocalIds.has(item.localId),
    );
    if (remaining.length > 0) {
      next[slot] = remaining;
    }
  }

  return next;
}

export function formatCatalogUploadFailureMessage(failures: CatalogUploadFailure[]): string {
  if (failures.length === 0) {
    return '';
  }

  const preview = failures
    .slice(0, 3)
    .map((f) => `Carrusel ${f.job.displayOrder}: ${f.message}`)
    .join('\n');

  const extra =
    failures.length > 3 ? `\n…y ${failures.length - 3} imagen(es) más con error.` : '';

  return `${failures.length} imagen(es) no se subieron.\n${preview}${extra}`;
}
