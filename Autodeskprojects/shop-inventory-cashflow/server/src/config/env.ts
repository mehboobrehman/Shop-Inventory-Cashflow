import dotenv from 'dotenv';

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  PORT: parseInt(process.env.PORT ?? '4000', 10),
  DATABASE_URL: required(
    'DATABASE_URL',
    'postgresql://shopadmin:shoplocaldev123@localhost:5432/shop_inventory',
  ),
  JWT_SECRET: required('JWT_SECRET', 'dev-jwt-secret-change-in-production'),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
} as const;
