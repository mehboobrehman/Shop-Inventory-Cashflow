import express, { type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './auth/auth.routes';
import productRoutes from './product/product.routes';
import stockRoutes from './stock/stock.routes';
import lowStockRoutes from './lowStock/lowStock.routes';
import dashboardRoutes from './dashboard/dashboard.routes';
import accountRoutes from './account/account.routes';
import salesRoutes from './sales/sales.routes';

export function createApp(): express.Application {
  const app = express();

  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());

  // Health check endpoint
  app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Auth routes
  app.use('/api/v1/auth', authRoutes);

  // Product routes
  app.use('/api/v1/products', productRoutes);
  
  // Stock routes
  app.use('/api/v1/stock', stockRoutes);

  // Low-stock routes
  app.use('/api/v1', lowStockRoutes);

  // Dashboard routes
  app.use('/api/v1/dashboard', dashboardRoutes);

  // Account routes
  app.use('/api/v1/accounts', accountRoutes);

  // Sales routes
  app.use('/api/v1/sales', salesRoutes);

  return app;
}
