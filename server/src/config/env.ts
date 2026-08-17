import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
console.log('DEBUG DATABASE_URL from dotenv:', process.env.DATABASE_URL);

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function resolveDatabaseUrl(rawUrl?: string): string {
  const url = rawUrl ?? 'file:./server/prisma/dev.db';
  if (url.startsWith('file:')) {
    const filePath = url.replace(/^file:/, '');
    if (!path.isAbsolute(filePath)) {
      const absolutePath = path.resolve(process.cwd(), filePath).replace(/\\/g, '/');
      const normalizedUrl = `file:${absolutePath}`;
      process.env.DATABASE_URL = normalizedUrl;
      return normalizedUrl;
    }
    // Ensure path with drive letter uses forward slashes
    const normalizedUrl = `file:${filePath.replace(/\\/g, '/')}`;
    process.env.DATABASE_URL = normalizedUrl;
    return normalizedUrl;
  }
  return url;
}

export const env = {
  PORT: parseInt(process.env.PORT ?? '4000', 10),
  DATABASE_URL: resolveDatabaseUrl(process.env.DATABASE_URL),
  JWT_SECRET: required('JWT_SECRET', 'dev-jwt-secret-change-in-production'),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
} as const;
