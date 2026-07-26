import { Request, Response } from 'express';
import { z } from 'zod';
import { ProductService } from './product.service';


const productService = new ProductService();

// Zod schemas for validation
const CreateProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  barcode: z.string().nullable().optional(),
  salePrice: z.number().min(0, 'Sale price must be positive'),
  currentStock: z.number().min(0, 'Stock cannot be negative').optional(),
  minStockLimit: z.number().min(0, 'Minimum stock limit cannot be negative').optional(),
});

const UpdateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  barcode: z.string().nullable().optional(),
  salePrice: z.number().min(0, 'Sale price must be positive').optional(),
  minStockLimit: z.number().min(0, 'Minimum stock limit cannot be negative').optional(),
  isActive: z.boolean().optional(),
});

const ProductQuerySchema = z.object({
  search: z.string().optional(),
  lowStock: z.boolean().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export class ProductController {
  async getProductByBarcode(req: Request, res: Response) {
    try {
      const barcode = req.params.barcode;
      const product = await productService.getProductByBarcode(barcode);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        });
      }
      
      return res.json({
        success: true,
        data: product,
        message: 'Product retrieved successfully',
      });
    } catch (error) {
      console.error('Get product by barcode error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get product by barcode',
        },
      });
    }
  }
  
  async createProduct(req: Request, res: Response) {
    try {
      const result = CreateProductSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: result.error.issues.reduce((acc: Record<string, string>, issue) => {
              acc[issue.path.join('.')] = issue.message;
              return acc;
            }, {}),
          },
        });
      }

      const product = await productService.createProduct(result.data);
      return res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully',
      });
    } catch (error) {
      console.error('Create product error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create product',
        },
      });
    }
  }

  async getProducts(req: Request, res: Response) {
    try {
      const result = ProductQuerySchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: result.error.issues.reduce((acc: Record<string, string>, issue) => {
              acc[issue.path.join('.')] = issue.message;
              return acc;
            }, {}),
          },
        });
      }

      const products = await productService.getProducts(result.data);
      return res.json({
        success: true,
        data: products,
        message: 'Products retrieved successfully',
      });
    } catch (error) {
      console.error('Get products error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get products',
        },
      });
    }
  }

  async getProductById(req: Request, res: Response) {
    try {
      const productId = req.params.id;
      if (!z.string().uuid().safeParse(productId).success) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid ID format. Must be a valid UUID.',
          },
        });
      }

      const product = await productService.getProductById(productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        });
      }

      return res.json({
        success: true,
        data: product,
        message: 'Product retrieved successfully',
      });
    } catch (error) {
      console.error('Get product by ID error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get product',
        },
      });
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const productId = req.params.id;
      if (!z.string().uuid().safeParse(productId).success) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid ID format. Must be a valid UUID.',
          },
        });
      }

      const result = UpdateProductSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: result.error.issues.reduce((acc: Record<string, string>, issue) => {
              acc[issue.path.join('.')] = issue.message;
              return acc;
            }, {}),
          },
        });
      }

      const product = await productService.updateProduct(productId, result.data);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        });
      }

      return res.json({
        success: true,
        data: product,
        message: 'Product updated successfully',
      });
    } catch (error) {
      console.error('Update product error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update product',
        },
      });
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const productId = req.params.id;
      if (!z.string().uuid().safeParse(productId).success) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid ID format. Must be a valid UUID.',
          },
        });
      }

      const product = await productService.deleteProduct(productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        });
      }

      return res.json({
        success: true,
        data: product,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      console.error('Delete product error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete product',
        },
      });
    }
  }

}
