import { Router } from 'express';
import { SalesController } from './sales.controller';
import { AuthMiddleware } from '../auth/auth.middleware';
import { auditLogMiddleware } from '../middleware/audit';

const router = Router();
const salesController = new SalesController();
const authMiddleware = new AuthMiddleware();

// All sales routes are protected
router.use(authMiddleware.authenticate);

router.post('/', auditLogMiddleware('SALE', 'Sale'), salesController.createSale);
router.get('/', salesController.getSales);
router.get('/:id', salesController.getSaleById);
router.post('/:id/refund', auditLogMiddleware('REFUND', 'Sale'), salesController.refundSale);

export default router;
