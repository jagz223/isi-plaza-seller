import { SellerDocumentPreview } from '@/components/seller/SellerDocumentPreview';
import { resolveMediaUrl } from '@/services/api/config';
import { consumerDocumentPreviewUrl } from '@/utils/consumer-document-url';

type Props = {
  url: string;
  type: 'pdf' | 'excel';
};

/** Vista previa inline del catálogo (sin descargar; usa el mismo visor que el mayorista). */
export function CatalogDocumentEmbed({ url, type }: Props) {
  const previewUrl = consumerDocumentPreviewUrl(resolveMediaUrl(url) ?? url);

  return <SellerDocumentPreview uri={previewUrl} type={type} />;
}
