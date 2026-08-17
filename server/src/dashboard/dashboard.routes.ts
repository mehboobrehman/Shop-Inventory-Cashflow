import { Router } from 'express';
import {
  getDashboardStatsHandler,
  getRecentSalesHandler,
  getSalesTrendHandler,
} from './dashboard.controller';
import { AuthMiddleware } from '../auth/auth.middleware';

const router = Router();
const authMiddleware = new AuthMiddleware();

// All dashboard routes are protected
router.use(authMiddleware.authenticate);

/**
 * Dashboard routes
 */
router.get('/stats', getDashboardStatsHandler);
router.get('/recent-sales', getRecentSalesHandler);
router.get('/sales-trend', getSalesTrendHandler);

export default router;