import { ISODateString, Money, UUID } from './common';

/** Product inventory item. */
export interface Product {
  id: UUID;
  name: string;
  /** Unique barcode (EAN/UPC). Nullable for products without barcodes. */
  barcode: string | null;
  salePrice: Money;
  currentStock: number;
  /** Threshold below which a low-stock alert is triggered. */
  minStockLimit: number;
  /** Soft-delete flag. Inactive products are hidden from default views. */
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** Payload for creating a new product. */
export interface CreateProductDTO {
  name: string;
  barcode?: string | null;
  salePrice: Money;
  currentStock?: number;
  minStockLimit?: number;
}

/** Payload for updating an existing product (all fields optional). */
export interface UpdateProductDTO {
  name?: string;
  barcode?: string | null;
  salePrice?: Money;
  minStockLimit?: number;
  isActive?: boolean;
}

/** Query parameters for product list/search endpoint. */
export interface ProductQueryParams {
  search?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}
