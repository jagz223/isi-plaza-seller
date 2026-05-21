export type AccessStatus = 'pending' | 'active' | 'denied';

export type BusinessCategory = {
  id: number;
  name: string;
  slug: string;
};

export type CatalogImage = {
  id: number;
  image_url: string;
  display_order: number;
};

export type SellerProfile = {
  id: number;
  access_status: AccessStatus;
  is_verified: boolean;
  has_paid_promotion: boolean;
  subscription_expires_at: string | null;
  subscription_granted_at: string | null;
  avatar_url?: string | null;
  description?: string | null;
  country?: string | null;
  state?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  website?: string | null;
  business_category_id?: number | null;
  business_category?: BusinessCategory | null;
};

export type SellerUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  has_access?: boolean;
  seller_profile: SellerProfile | null;
  catalog_images: CatalogImage[];
};

export type AuthResponse = {
  token: string;
  token_type: string;
  user: SellerUser;
};

export type MeResponse = {
  data: SellerUser;
};

export type SubscriptionResponse = {
  subscription_price_label: string;
  whatsapp_payment_url: string;
  access_status: AccessStatus;
  can_access_app: boolean;
  is_blocked_on_subscription_screen: boolean;
  message: string;
};

export type MetricsResponse = {
  period_label: string;
  profile_views_count: number;
  whatsapp_clicks_count: number;
};

export type SettingsResponse = {
  subscription_expires_at: string | null;
  subscription_expires_at_formatted: string | null;
  promotion_whatsapp_url: string;
  has_paid_promotion: boolean;
};

export type ProfileResponse = {
  data: SellerUser;
};

export type CatalogImagesResponse = {
  data: CatalogImage[];
};

export type BusinessCategoriesResponse = {
  data: BusinessCategory[];
};

export type ValidationErrors = Record<string, string[]>;

export type ApiErrorBody = {
  message?: string;
  errors?: ValidationErrors;
  access_status?: AccessStatus;
};
