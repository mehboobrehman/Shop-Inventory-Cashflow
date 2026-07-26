import { Money, UUID } from './common';

/**
 * Result returned when a barcode is scanned/looked up.
 * Contains enough product info for the UI to display a detail card
 * and optionally create a quick sale.
 */
export interface BarcodeScanResult {
  found: boolean;
  product?: {
    id: UUID;
    name: string;
    barcode: string | null;
    salePrice: Money;
    currentStock: number;
    minStockLimit: number;
    isActive: boolean;
  };
}
