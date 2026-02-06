import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

/**
 * Load environment variables from .env files based on NODE_ENV
 * Priority: .env.{NODE_ENV}.local > .env.{NODE_ENV} > .env.local > .env
 */
const nodeEnv = process.env.NODE_ENV || 'development';

const envFiles = [
  path.resolve(rootDir, '.env'),
  path.resolve(rootDir, '.env.local'),
  path.resolve(rootDir, `.env.${nodeEnv}`),
  path.resolve(rootDir, `.env.${nodeEnv}.local`),
];

envFiles.forEach((file) => {
  dotenv.config({ path: file });
});

/**
 * Validate and export environment configuration
 */
const requiredVars = ['CLERK_SECRET_KEY'];
const missingVars = requiredVars.filter((v) => !process.env[v]);

if (missingVars.length > 0 && nodeEnv === 'production') {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}`
  );
}

export const config = {
  // Core
  NODE_ENV: nodeEnv,
  PORT: parseInt(process.env.PORT || '3000', 10),
  
  // Clerk Auth
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
  CLERK_WEBHOOK_SIGNING_SECRET: process.env.CLERK_WEBHOOK_SIGNING_SECRET || '',
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || '',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // Features
  DEBUG: process.env.DEBUG === 'true',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Validation
  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
};

// Log warnings for missing optional vars in development
if (config.isDevelopment && missingVars.length > 0) {
  console.warn(
    'Missing environment variables:',
    missingVars.join(', ')
  );
}

// Freeze config to prevent mutations
Object.freeze(config);

// Named exports for backward compatibility
export const NODE_ENV = config.NODE_ENV;
export const PORT = config.PORT;
export const CLERK_SECRET_KEY = config.CLERK_SECRET_KEY;
export const CLERK_WEBHOOK_SIGNING_SECRET = config.CLERK_WEBHOOK_SIGNING_SECRET;
export const CLERK_PUBLISHABLE_KEY = config.CLERK_PUBLISHABLE_KEY;
export const DATABASE_URL = config.DATABASE_URL;
export const DEBUG = config.DEBUG;
export const LOG_LEVEL = config.LOG_LEVEL;

export default config;
