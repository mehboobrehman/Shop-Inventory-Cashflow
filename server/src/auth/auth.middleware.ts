import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JWTPayload } from '@shop/shared';

export class AuthMiddleware {
  authenticate(req: Request, res: Response, next: NextFunction) {
    // Extract token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.substring(7)
      : req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
      
      // Attach user to request
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
    }
  }

  // Role-based authorization middleware
  authorize(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        });
      }

      next();
    };
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}