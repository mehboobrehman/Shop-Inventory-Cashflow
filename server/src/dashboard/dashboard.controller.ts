import { Request, Response } from 'express';
import {
  getDashboardStats,
  getRecentSales,
  getSalesTrend,
} from './dashboard.service';
import { success } from '../utils/response.util';
import { DashboardStats, SalesTrendData, Sale } from '@shop/shared';

/**
 * GET /api/v1/dashboard/stats
 * Returns aggregate dashboard statistics.
 */
export async function getDashboardStatsHandler(_req: Request, res: Response) {
  try {
    const stats: DashboardStats = await getDashboardStats();
    res.json(success(stats));
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch dashboard stats',
      },
    });
  }
}

/**
 * GET /api/v1/dashboard/recent-sales
 * Returns the last N sales (default 10) with item details.
 */
export async function getRecentSalesHandler(_req: Request, res: Response) {
  try {
    const sales: Sale[] = await getRecentSales(10);
    res.json(success(sales));
  } catch (error) {
    console.error('Error fetching recent sales:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch recent sales',
      },
    });
  }
}

/**
 * GET /api/v1/dashboard/sales-trend
 * Returns daily sales totals for chart visualization.
 * Query param: days=7|30 (default 7)
 */
export async function getSalesTrendHandler(req: Request, res: Response) {
  try {
    const daysParam = req.query.days;
    let days = 7;
    if (daysParam) {
      const parsed = parseInt(daysParam as string, 10);
      if ([7, 30].includes(parsed)) {
        days = parsed;
      } else {
        days = 7; // fallback
      }
    }
    const trendData: SalesTrendData[] = await getSalesTrend(days);
    res.json(success(trendData));
  } catch (error) {
    console.error('Error fetching sales trend:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch sales trend',
      },
    });
  }
}