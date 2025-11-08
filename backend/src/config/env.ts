import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

interface EnvConfig {
  // MongoDB
  MONGODB_URI: string;

  // Redis
  REDIS_URL: string;

  // JWT
  JWT_SECRET: string;

  // Email (SMTP)
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;

  // URLs
  FRONTEND_URL: string;
  BACKEND_URL: string;

  // Environment
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;

  // Token expiry
  MAGIC_LINK_EXPIRY: number;
  SESSION_EXPIRY: number;
}

interface ValidationError {
  variable: string;
  message: string;
  currentValue?: string;
  example?: string;
}

/**
 * Validates required environment variables and provides detailed error messages
 */
function validateEnv(): EnvConfig {
  const errors: ValidationError[] = [];

  // Helper to check required string variables
  const requireString = (
    name: string,
    example?: string,
    customValidator?: (value: string) => boolean
  ): string => {
    const value = process.env[name];

    if (!value || value.trim() === '') {
      errors.push({
        variable: name,
        message: `${name} is required but not set`,
        example: example || undefined,
      });
      return '';
    }

    if (customValidator && !customValidator(value)) {
      errors.push({
        variable: name,
        message: `${name} has an invalid value`,
        currentValue: value.includes('password') ? '***' : value,
        example,
      });
      return value;
    }

    return value;
  };

  // Helper to check required number variables
  const requireNumber = (name: string, defaultValue?: number, min?: number): number => {
    const value = process.env[name];

    if (!value && defaultValue === undefined) {
      errors.push({
        variable: name,
        message: `${name} is required but not set`,
        example: `${name}=${min || 1}`,
      });
      return 0;
    }

    const num = value ? parseInt(value, 10) : defaultValue!;

    if (isNaN(num)) {
      errors.push({
        variable: name,
        message: `${name} must be a valid number`,
        currentValue: value,
      });
      return 0;
    }

    if (min !== undefined && num < min) {
      errors.push({
        variable: name,
        message: `${name} must be at least ${min}`,
        currentValue: value,
      });
    }

    return num;
  };

  // Validate all required environment variables
  const config: EnvConfig = {
    // MongoDB
    MONGODB_URI: requireString(
      'MONGODB_URI',
      'mongodb://localhost:27017/tablesplit',
      (val) => val.startsWith('mongodb://')
    ),

    // Redis
    REDIS_URL: requireString(
      'REDIS_URL',
      'redis://localhost:6379',
      (val) => val.startsWith('redis://')
    ),

    // JWT
    JWT_SECRET: requireString(
      'JWT_SECRET',
      'Run: openssl rand -base64 32',
      (val) => val.length >= 32 && !val.includes('change-this') && !val.includes('your-')
    ),

    // Email (SMTP)
    SMTP_HOST: requireString('SMTP_HOST', 'smtp.gmail.com'),
    SMTP_PORT: requireNumber('SMTP_PORT', 587, 1),
    SMTP_USER: requireString(
      'SMTP_USER',
      'your-email@gmail.com',
      (val) => val.includes('@') && !val.includes('your-email')
    ),
    SMTP_PASS: requireString(
      'SMTP_PASS',
      'your-app-specific-password',
      (val) => val.length > 8 && !val.includes('your-') && !val.includes('password')
    ),
    SMTP_FROM: requireString('SMTP_FROM', 'TableSplit <noreply@tablesplit.app>'),

    // URLs
    FRONTEND_URL: requireString('FRONTEND_URL', 'http://localhost:3000'),
    BACKEND_URL: requireString('BACKEND_URL', 'http://localhost:4000'),

    // Environment
    NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    PORT: requireNumber('PORT', 4000, 1000),

    // Token expiry (in seconds)
    MAGIC_LINK_EXPIRY: requireNumber('MAGIC_LINK_EXPIRY', 900, 60),
    SESSION_EXPIRY: requireNumber('SESSION_EXPIRY', 604800, 3600),
  };

  // If there are validation errors, display them clearly and exit
  if (errors.length > 0) {
    console.error('\n❌ Environment Variable Validation Failed!\n');
    console.error('━'.repeat(80));
    console.error('\nThe following environment variables are missing or invalid:\n');

    errors.forEach((error, index) => {
      console.error(`${index + 1}. ${error.variable}`);
      console.error(`   ❌ ${error.message}`);
      if (error.currentValue) {
        console.error(`   Current: ${error.currentValue}`);
      }
      if (error.example) {
        console.error(`   Example: ${error.example}`);
      }
      console.error('');
    });

    console.error('━'.repeat(80));
    console.error('\n📝 Quick Fix:\n');
    console.error('1. Copy .env.example to .env:');
    console.error('   cp .env.example .env\n');
    console.error('2. Edit .env and set the required values\n');
    console.error('3. For JWT_SECRET, generate a secure key:');
    console.error('   openssl rand -base64 32\n');
    console.error('4. For SMTP credentials:');
    console.error('   - Gmail: Enable 2FA and create an App Password');
    console.error('   - Or use another SMTP service\n');
    console.error('━'.repeat(80));
    console.error('\n💡 See SETUP.md for detailed configuration instructions\n');

    process.exit(1);
  }

  // Validate JWT_SECRET strength
  if (config.NODE_ENV === 'production' && config.JWT_SECRET.length < 64) {
    logger.warn(
      '⚠️  WARNING: JWT_SECRET should be at least 64 characters in production!'
    );
  }

  // Validate SMTP in production
  if (config.NODE_ENV === 'production') {
    if (config.SMTP_HOST.includes('localhost') || config.SMTP_HOST.includes('127.0.0.1')) {
      logger.warn('⚠️  WARNING: Using localhost SMTP in production!');
    }
  }

  return config;
}

// Validate and export configuration
export const env = validateEnv();

// Log successful validation in development
if (env.NODE_ENV === 'development') {
  logger.info('✅ Environment variables validated successfully');
}
