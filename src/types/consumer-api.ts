import type { BusinessCategory } from '@/types/seller-api';

export type ConsumerUser = {
  id: number;
  name: string;
  whatsapp: string | null;
  role: string;
  provider: string | null;
};

export type ConsumerAuthResponse = {
  token: string;
  token_type: string;
  user: ConsumerUser;
};

export type ConsumerBanner = {
  id: number;
  image_url: string | null;
  sort_order: number;
  link_url: string | null;
};

export type ConsumerSeller = {
  id: number;
  name: string;
  description: string | null;
  country: string | null;
  state: string | string[] | null;
  avatar_url: string | null;
  is_verified: boolean;
  has_active_promotion: boolean;
  business_category: BusinessCategory | null;
  is_favorited: boolean;
};

export type ConsumerSellersResponse = {
  data: ConsumerSeller[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type FilterCountryOption = {
  name: string;
  has_sellers: boolean;
};

export type ConsumerCatalogImage = {
  id: number;
  image_url: string;
  display_order: number;
};

export type ConsumerCarouselMeta = {
  title?: string;
  description?: string;
};

export type CatalogDisplayMode = 'none' | 'pdf' | 'excel' | 'carousel';

export type ConsumerSellerDetail = {
  id: number;
  name: string;
  description: string | null;
  country: string | null;
  state: string | string[] | null;
  avatar_url: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  pdf_url: string | null;
  excel_url: string | null;
  carousel_metadata: ConsumerCarouselMeta[];
  catalog_display_mode?: CatalogDisplayMode;
  catalog_images: ConsumerCatalogImage[];
  is_verified: boolean;
  has_active_promotion: boolean;
  business_category: BusinessCategory | null;
  is_favorited: boolean;
};

export type ConsumerSellerDetailResponse = {
  data: ConsumerSellerDetail;
};

export type ProductCatalogCarousel = {
  slot: number;
  title: string;
  description: string;
  images: ConsumerCatalogImage[];
};
