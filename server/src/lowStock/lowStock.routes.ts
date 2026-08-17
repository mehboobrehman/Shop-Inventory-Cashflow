import { Router } from 'express';
import { getLowStockProductsHandler } from './lowStock.controller';
import { AuthMiddleware } from '../auth/auth.middleware';

const router = Router();
const authMiddleware = new AuthMiddleware();

// All low-stock routes are protected
router.use(authMiddleware.authenticate);

/**
 * Low-stock routes
 */
router.get('/dashboard/low-stock', getLowStockProductsHandler);

export default router;