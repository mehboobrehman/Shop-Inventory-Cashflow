import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthMiddleware } from './auth.middleware';

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

    // Public routes
    router.post('/login', authController.login);
    
    // Admin only routes
    router.post('/register', authMiddleware.authenticate, authMiddleware.authorize(['ADMIN']), authController.register);
    
    // Protected routes
    router.get('/me', authMiddleware.authenticate, authController.me);
    router.post('/logout', authMiddleware.authenticate, authController.logout);

export default router;