import { Router } from 'express';
import { ProductController } from './product.controller';
import { AuthMiddleware } from '../auth/auth.middleware';

const router = Router();
const productController = new ProductController();
const authMiddleware = new AuthMiddleware();

// All product routes are protected
router.use(authMiddleware.authenticate);

// Barcode lookup route
router.get('/barcode/:barcode', productController.getProductByBarcode);

// Product CRUD routes
router.post('/', authMiddleware.authorize(['ADMIN']), productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', authMiddleware.authorize(['ADMIN']), productController.updateProduct);
router.delete('/:id', authMiddleware.authorize(['ADMIN']), productController.deleteProduct);

export default router;
