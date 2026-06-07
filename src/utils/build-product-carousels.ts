import type {
  ConsumerCatalogImage,
  ConsumerCarouselMeta,
  ProductCatalogCarousel,
} from '@/types/consumer-api';

const CAROUSEL_SLOTS = [1, 2, 3, 4, 5] as const;

export function buildProductCarousels(
  metadata: ConsumerCarouselMeta[] | undefined,
  images: ConsumerCatalogImage[] | undefined,
): ProductCatalogCarousel[] {
  const list = images ?? [];
  const meta = metadata ?? [];

  return CAROUSEL_SLOTS.map((slot) => {
    const metaItem = meta[slot - 1];
    const title = metaItem?.title?.trim() ?? '';
    const description = metaItem?.description?.trim() ?? '';
    const slotImages = list
      .filter((img) => img.display_order === slot)
      .sort((a, b) => a.id - b.id);

    return { slot, title, description, images: slotImages };
  }).filter((c) => c.title || c.description || c.images.length > 0);
}
