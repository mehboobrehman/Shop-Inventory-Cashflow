import { Router } from 'express';
import { SalesController } from './sales.controller';
import { AuthMiddleware } from '../auth/auth.middleware';

const router = Router();
const salesController = new SalesController();
const authMiddleware = new AuthMiddleware();

// All sales routes are protected
router.use(authMiddleware.authenticate);

router.post('/', salesController.createSale);
router.get('/', salesController.getSales);
router.get('/:id', salesController.getSaleById);

export default router;
