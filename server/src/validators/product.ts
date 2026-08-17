import { z } from 'zod';

// Define the Zod schemas for product validation
const productBaseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  barcode: z.string().optional(),
  salePrice: z.number().positive('Sale price must be positive'),
  currentStock: z.number().nonnegative('Current stock cannot be negative'),
  minStockLimit: z.number().nonnegative('Minimum stock limit cannot be negative'),
  isActive: z.boolean().optional(),
});

export const productCreateSchema = productBaseSchema.extend({
  barcode: z.string().min(1, 'Barcode is required'),
});

export const productUpdateSchema = productBaseSchema.partial().extend({
  barcode: z.string().optional(),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;