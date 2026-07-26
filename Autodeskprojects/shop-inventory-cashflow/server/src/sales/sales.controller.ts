import { Request, Response } from 'express';
import { SalesService } from './sales.service';
import { success, error, validationError } from '../utils/response.util';
import { createSaleSchema, saleQuerySchema } from '../validators/sale';

const salesService = new SalesService();

export class SalesController {
  /**
   * POST /api/v1/sales
   * Create a new sale.
   */
  async createSale(req: Request, res: Response) {
    try {
      const result = createSaleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json(validationError(result.error.issues.map(i => i.message)));
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(error('UNAUTHORIZED', 'User ID required'));
      }

      const sale = await salesService.createSale(
        { items: result.data.items, accountId: result.data.accountId || null },
        userId
      );

      return res.status(201).json(success(sale));
    } catch (err: any) {
      console.error('Create sale error:', err);
      const message = err.message || 'Failed to create sale';

      // Determine appropriate status and error code based on message
      if (message.includes('Insufficient stock')) {
        return res.status(400).json({ success: false, error: { code: 'INSUFFICIENT_STOCK', message } });
      }
      if (message.includes('not found')) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } });
      }

      return res.status(500).json(error(message));
    }
  }

  /**
   * GET /api/v1/sales
   * List sales with filters and pagination.
   */
  async getSales(req: Request, res: Response) {
    try {
      const result = saleQuerySchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json(validationError(result.error.issues.map(i => i.message)));
      }

      const { from, to, search, page, limit } = result.data;
      const data = await salesService.getSales({
        startDate: from,
        endDate: to,
        search,
        page,
        limit,
      });

      return res.json(success(data));
    } catch (err: any) {
      console.error('Get sales error:', err);
      return res.status(500).json(error('Failed to retrieve sales'));
    }
  }

  /**
   * GET /api/v1/sales/:id
   * Get a single sale with items.
   */
  async getSaleById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validate UUID format manually
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid sale ID format' } });
      }

      const sale = await salesService.getSaleById(id);
      if (!sale) {
        return res.status(404).json(error('NOT_FOUND', 'Sale not found'));
      }

      return res.json(success(sale));
    } catch (err: any) {
      console.error('Get sale by ID error:', err);
      return res.status(500).json(error('Failed to retrieve sale'));
    }
  }
}
