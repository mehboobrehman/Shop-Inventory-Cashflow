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
router.post('/', productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

export default router;
