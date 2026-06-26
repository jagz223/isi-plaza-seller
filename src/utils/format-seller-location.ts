type SellerLocationFields = {
  address?: string | null;
  municipality?: string | null;
  state?: string | string[] | null;
  country?: string | null;
  description?: string | null;
};

export function formatSellerLocationBlock(seller: SellerLocationFields): string {
  const statePart = Array.isArray(seller.state)
    ? seller.state.join(', ')
    : (seller.state?.trim() ?? '');

  const parts = [seller.address, seller.municipality, statePart, seller.country].filter(
    (part) => typeof part === 'string' && part.trim().length > 0,
  ) as string[];

  if (parts.length === 0) {
    const fallback = seller.description?.trim();
    return fallback ? fallback.toUpperCase() : '';
  }

  return parts.join(', ').toUpperCase();
}
