import { z } from "zod";
import { StockMovementType } from "@shop/shared";

// Schema for stock-in requests
export const stockInSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
  userId: z.string(),
});

// Schema for stock adjustment requests
export const stockAdjustmentSchema = z.object({
  productId: z.string(),
  newQuantity: z.number().int().min(0), // Ensure newQuantity is at least 0
  reason: z.string().optional(),
  userId: z.string(),
});

// Schema for stock movement query parameters
export const stockMovementQuerySchema = z.object({
  productId: z.string().optional(),
  type: z.nativeEnum(StockMovementType).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
  skip: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().positive().optional(),
});