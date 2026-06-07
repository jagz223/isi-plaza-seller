import {
  appendPreparedFileToFormData,
  prepareFileForMultipart,
  type PreparedMultipartFile,
} from '@/utils/prepare-multipart-file';

export type PreparedImageUpload = PreparedMultipartFile;

export function appendPreparedImageToFormData(
  formData: FormData,
  fieldName: string,
  prepared: PreparedImageUpload,
): void {
  appendPreparedFileToFormData(formData, fieldName, prepared);
}

/**
 * Copia la imagen a cache file:// para que PHP reciba el binario en $_FILES.
 * En Android, content:// suele fallar si se pasa directo a FormData/fetch.
 */
export async function prepareImageForMultipart(localUri: string): Promise<PreparedImageUpload> {
  const rawName = localUri.split('/').pop()?.split('?')[0] ?? `image-${Date.now()}.jpg`;
  const name = rawName.includes('.') ? rawName : `${rawName}.jpg`;
  const type = name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

  return prepareFileForMultipart(localUri, name, type);
}