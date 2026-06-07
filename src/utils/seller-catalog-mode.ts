export type SellerCatalogMode = 'none' | 'pdf' | 'excel' | 'carousel';

export function resolveSellerCatalogMode(input: {
  existingPdfUrl: string | null;
  existingExcelUrl: string | null;
  pendingPdf: boolean;
  pendingExcel: boolean;
  catalogImageCount: number;
  pendingCatalogCount: number;
}): SellerCatalogMode {
  if (input.existingPdfUrl || input.pendingPdf) {
    return 'pdf';
  }
  if (input.existingExcelUrl || input.pendingExcel) {
    return 'excel';
  }
  if (input.catalogImageCount > 0 || input.pendingCatalogCount > 0) {
    return 'carousel';
  }
  return 'none';
}

export function catalogModeBlocksPdf(mode: SellerCatalogMode): boolean {
  return mode === 'excel' || mode === 'carousel';
}

export function catalogModeBlocksExcel(mode: SellerCatalogMode): boolean {
  return mode === 'pdf' || mode === 'carousel';
}

export function catalogModeBlocksCarousel(mode: SellerCatalogMode): boolean {
  return mode === 'pdf' || mode === 'excel';
}
