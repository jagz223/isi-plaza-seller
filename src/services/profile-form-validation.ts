import { CATALOG_MAX_IMAGES_PER_CAROUSEL } from '@/services/catalog-upload';

const MAX_DESCRIPTION = 100;
const MAX_WHATSAPP_DIGITS = 12;

export type ProfileFormValidationInput = {
  businessName: string;
  description: string;
  country: string;
  state: string[];
  whatsappDialCode: string;
  whatsappNumber: string;
  savedPhotoCount: number;
  pendingPhotoCount: number;
};

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

/**
 * Validaciones en la app antes de llamar al API.
 */
export function validateProfileFormBeforeSave(input: ProfileFormValidationInput): string | null {
  if (!input.businessName.trim()) {
    return 'Ingresa el nombre comercial.';
  }

  if (input.businessName.trim().length > 255) {
    return 'El nombre comercial no puede superar 255 caracteres.';
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

  if (input.savedPhotoCount + input.pendingPhotoCount > CATALOG_MAX_IMAGES_PER_CAROUSEL) {
    return `Solo puedes tener hasta ${CATALOG_MAX_IMAGES_PER_CAROUSEL} fotos en el carrusel.`;
  }

  return null;
}
