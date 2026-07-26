import { z } from "zod";

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