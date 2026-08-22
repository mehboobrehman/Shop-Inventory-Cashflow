import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import os from 'os';
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
  app.get('/api/v1/health', (req: Request, res: Response) => {
    let serverIp = '127.0.0.1';
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const ifaces = interfaces[name];
      if (ifaces) {
        for (const iface of ifaces) {
          if (iface.family === 'IPv4' && !iface.internal) {
            serverIp = iface.address;
            break;
          }
        }
      }
      if (serverIp !== '127.0.0.1') break;
    }

    const serverPort = process.env.PORT || req.socket?.localPort || 3000;

    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        serverIp,
        serverPort,
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

  // Serve static client SPA if enabled or in production mode
  const serveStatic = process.env.SERVE_STATIC_CLIENT === 'true' || process.env.NODE_ENV === 'production';
  if (serveStatic) {
    const rawPath = process.env.CLIENT_BUILD_PATH || 'client/dist';
    const possiblePaths = [
      path.resolve(process.cwd(), 'client/dist'),
      path.resolve(process.cwd(), '../client/dist'),
      path.resolve(__dirname, '../../../../client/dist'),
      path.resolve(__dirname, '../../../client/dist'),
      path.resolve(__dirname, '../../client/dist'),
      path.resolve(__dirname, '../client/dist'),
      path.resolve(process.cwd(), rawPath),
      path.resolve(process.cwd(), 'server', rawPath),
      path.resolve(__dirname, rawPath),
    ];

    const clientBuildPath = possiblePaths.find((p) => fs.existsSync(p));

    if (clientBuildPath) {
      console.log(`Serving static client SPA from: ${clientBuildPath}`);
      app.use(express.static(clientBuildPath));

      // Catch-all wildcard route to serve SPA index.html for all non-API GET routes
      const catchAllHandler = (req: Request, res: Response, next: NextFunction) => {
        if (req.path.startsWith('/api')) {
          return next();
        }
        return res.sendFile(path.resolve(clientBuildPath, 'index.html'), (err) => {
          if (err) {
            next(err);
          }
        });
      };

      // Support Express 5 wildcard ({*path}) and Express 4 wildcard (*)
      const catchAllPatterns = ['{*path}', '*', '*path'];
      let registered = false;
      for (const pattern of catchAllPatterns) {
        try {
          app.get(pattern, catchAllHandler);
          registered = true;
          break;
        } catch {
          // Ignore path-to-regexp syntax differences across Express versions
        }
      }

      if (!registered) {
        app.use((req: Request, res: Response, next: NextFunction) => {
          if (req.method === 'GET' && !req.path.startsWith('/api')) {
            return catchAllHandler(req, res, next);
          }
          next();
        });
      }
    } else {
      console.warn('SERVE_STATIC_CLIENT enabled, but client build directory not found. Checked:', possiblePaths);
    }
  }

  return app;
}
