import { Request, Response } from 'express';
import { getLowStockProducts, getLowStockProductsCount } from './lowStock.service';
import { success } from '../utils/response.util';

/**
 * GET /api/v1/dashboard/low-stock
 * Returns a list of products that are below their minimum stock threshold.
 */
export async function getLowStockProductsHandler(_req: Request, res: Response) {
  try {
    const products = await getLowStockProducts();
    const count = await getLowStockProductsCount();
    
    res.json(success({
      products,
      count,
    }));
  } catch (error) {
    console.error('Error fetching low-stock products:', error);
    res.status(500).json({
      error: 'Failed to fetch low-stock products',
    });
  }
}