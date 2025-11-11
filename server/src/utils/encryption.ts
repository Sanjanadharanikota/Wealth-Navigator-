import CryptoJS from 'crypto-js';

const AES_KEY = process.env.AES_256_KEY || '';

if (!AES_KEY) {
  throw new Error('AES_256_KEY must be set in environment variables');
}

/**
 * Encrypt sensitive data using AES-256
 */
export function encrypt(data: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, AES_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data using AES-256
 */
export function decrypt(encryptedData: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, AES_KEY);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a random AES-256 key
 */
export function generateAESKey(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}

/**
 * Generate a random JWT secret
 */
export function generateJWTSecret(): string {
  return CryptoJS.lib.WordArray.random(64).toString();
}
