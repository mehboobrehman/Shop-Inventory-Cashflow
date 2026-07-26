import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, LoginResponse, JWTPayload } from '@shop/shared';
import { UserRole } from '@shop/shared';

const prisma = new PrismaClient();

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export class AuthService {
  private readonly JWT_ACCESS_EXPIRES_IN = '15m';

  async register(input: RegisterInput): Promise<User> {
    const { email, password, name, role = UserRole.CASHIER } = input;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
      },
    });

    return this.mapToUserResponse(user);
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateAccessToken(user);

    return {
      token,
      user: this.mapToUserResponse(user),
    };
  }

  async getCurrentUser(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ? this.mapToUserResponse(user) : null;
  }

  private generateAccessToken(user: any): string {
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: this.JWT_ACCESS_EXPIRES_IN,
    });
  }

  private mapToUserResponse(user: any): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}