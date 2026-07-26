import { z } from "zod";
import { CreateSaleItemDTO, SaleQueryParams } from '@shop/shared';

// Schema for individual sale item in request
const SaleItemCreateSchema = z.object({
  productId: z.string().uuid({ message: "productId must be a valid UUID" }),
  quantity: z.number().int().positive({ message: "quantity must be a positive integer" }),
});

// Schema for creating a sale
export const createSaleSchema = z.object({
  items: z.array(SaleItemCreateSchema).min(1, "At least one item is required"),
  accountId: z.string().uuid().optional().nullable(),
});

// Schema for sales query parameters (GET /sales)
export const saleQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

// Helper to type-guard CreateSaleItemDTO from validated Zod data
export type CreateSaleItemInput = z.infer<typeof SaleItemCreateSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type SaleQueryInput = z.infer<typeof saleQuerySchema>;
