import type { BusinessCategory } from '@/types/seller-api';

export type Treatment = {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

export type TreatmentSection = {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  treatments: Treatment[];
};

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
  treatment_id?: number | null;
  treatment_name?: string | null;
};

export type ConsumerSeller = {
  id: number;
  name: string;
  description: string | null;
  professional_license: string | null;
  address: string | null;
  municipality: string | null;
  country: string | null;
  state: string | string[] | null;
  avatar_url: string | null;
  is_verified: boolean;
  has_active_promotion: boolean;
  business_category: BusinessCategory | null;
  is_favorited: boolean;
  distance_km?: number | null;
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

export type ConsumerComplianceSettings = {
  external_contact_disclaimer: string;
  app_store_url: string;
  play_store_url: string;
  privacy_notice: string;
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
  professional_license: string | null;
  address: string | null;
  municipality: string | null;
  phone: string | null;
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
  services?: {
    id: number;
    treatment_id: number;
    price: number;
    name: string | null;
    section_name: string | null;
  }[];
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
