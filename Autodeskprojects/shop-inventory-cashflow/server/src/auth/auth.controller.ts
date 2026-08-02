import { Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { LoginResponse } from '@shop/shared';
import { AuthService } from './auth.service';

const authService = new AuthService();

// Zod schemas for validation
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const result = RegisterSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: result.error.issues.map(issue => issue.message),
          },
        });
      }

      const { email, password, name, role } = result.data;
      const user = await authService.register({ email, password, name, role: role as any });
      return res.status(201).json({
        success: true,
        data: user,
        message: 'User registered successfully',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.issues.map((e: any) => e.message),
          },
        });
      }

      if (error instanceof Error && error.message === 'User already exists') {
        return res.status(409).json({
          success: false,
          data: null,
          error: {
            code: 'CONFLICT',
            message: 'User already exists',
          },
        });
      }

      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during registration',
        },
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const result = LoginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: result.error.issues.map(issue => issue.message),
          },
        });
      }

      const { email, password } = result.data;
      const { token, user } = await authService.login(email, password);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      return res.json({
        success: true,
        data: { user },
        message: 'Login successful',
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'AUTH_FAILED',
          message: 'Invalid credentials',
        },
      });
    }
  }

  async logout(_req: Request, res: Response) {
    res.clearCookie('token');
    return res.json({
      success: true,
      data: null,
      message: 'Logged out successfully',
    });
  }

  async me(req: Request, res: Response) {
    try {
      // User is attached by auth middleware
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized access',
          },
        });
      }

      const user = await authService.getCurrentUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      return res.json({
        success: true,
        data: user,
        message: 'User profile retrieved',
      });
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get user profile',
        },
      });
    }
  }
}