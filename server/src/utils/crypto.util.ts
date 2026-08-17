import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES uses 16-byte IV

let ENCRYPTION_KEY: Buffer;
const envKey = process.env.ENCRYPTION_KEY;

if (envKey) {
  // Hash with SHA-256 to ensure exactly 32 bytes (256 bits)
  ENCRYPTION_KEY = crypto.createHash('sha256').update(envKey).digest();
} else {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY is not set in production environment');
  }
  console.warn('WARNING: ENCRYPTION_KEY environment variable is missing! Using fallback key for development.');
  ENCRYPTION_KEY = crypto.createHash('sha256').update('fallback-development-key-32-bytes-long').digest();
}

/**
 * Encrypt a plain text string using AES-256-CBC.
 * Returns IV concatenated with the encrypted content in hex format.
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt an encrypted string (in "iv:encrypted" hex format) using AES-256-CBC.
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}
