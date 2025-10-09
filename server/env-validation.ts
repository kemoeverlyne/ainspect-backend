/**
 * Environment variable validation utility
 * Ensures all required environment variables are set at startup
 */

interface EnvConfig {
  required: string[];
  optional: string[];
}

const envConfig: EnvConfig = {
  required: [
    'SESSION_SECRET',
    'JWT_SECRET',
    'CONTRACTOR_JWT_SECRET',
    'DATABASE_URL',
    'GOOGLE_CLOUD_STORAGE_BUCKET',
    'GOOGLE_CLOUD_STORAGE_BASE_URL',
    'SUPPORT_EMAIL',
    'NOREPLY_EMAIL',
    'ADMIN_EMAIL'
  ],
  optional: [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'STRIPE_SECRET_KEY',
    'SENDGRID_API_KEY',
    'ELITE_MGA_API_KEY',
    'ELITE_MGA_API_URL',
    'GOOGLE_REDIRECT_URI',
    'REDIS_URL',
    'MAX_FILE_SIZE',
    'ALLOWED_FILE_TYPES',
    'LOG_LEVEL',
    'GENERAL_RATE_LIMIT',
    'API_RATE_LIMIT',
    'ALLOWED_ORIGINS',
    'REPLIT_DEV_DOMAIN'
  ]
};

export function validateEnvironment(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  for (const envVar of envConfig.required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check optional but recommended environment variables
  for (const envVar of envConfig.optional) {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  }

  // Throw error if required variables are missing
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => {
      console.error(`   - ${envVar}`);
    });
    console.error('\nPlease set these environment variables before starting the application.');
    console.error('See .env.example for reference.');
    process.exit(1);
  }

  // Log warnings for missing optional variables
  if (warnings.length > 0) {
    console.warn('⚠️  Missing optional environment variables:');
    warnings.forEach(envVar => {
      console.warn(`   - ${envVar}`);
    });
    console.warn('Some features may not work correctly without these variables.');
  }

  // Validate specific environment variables
  validateSpecificEnvVars();

  console.log('✅ Environment validation passed');
}

function validateSpecificEnvVars(): void {
  // Validate SESSION_SECRET strength
  const sessionSecret = process.env.SESSION_SECRET;
  if (sessionSecret && sessionSecret.length < 32) {
    console.warn('⚠️  SESSION_SECRET should be at least 32 characters long for security');
  }

  // Validate JWT secrets strength
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    console.warn('⚠️  JWT_SECRET should be at least 32 characters long for security');
  }

  const contractorJwtSecret = process.env.CONTRACTOR_JWT_SECRET;
  if (contractorJwtSecret && contractorJwtSecret.length < 32) {
    console.warn('⚠️  CONTRACTOR_JWT_SECRET should be at least 32 characters long for security');
  }

  // Validate email format
  const supportEmail = process.env.SUPPORT_EMAIL;
  if (supportEmail && !isValidEmail(supportEmail)) {
    console.warn('⚠️  SUPPORT_EMAIL should be a valid email address');
  }

  const noreplyEmail = process.env.NOREPLY_EMAIL;
  if (noreplyEmail && !isValidEmail(noreplyEmail)) {
    console.warn('⚠️  NOREPLY_EMAIL should be a valid email address');
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && !isValidEmail(adminEmail)) {
    console.warn('⚠️  ADMIN_EMAIL should be a valid email address');
  }

  // Validate file size
  const maxFileSize = process.env.MAX_FILE_SIZE;
  if (maxFileSize && isNaN(parseInt(maxFileSize))) {
    console.warn('⚠️  MAX_FILE_SIZE should be a valid number (bytes)');
  }

  // Validate rate limits
  const generalRateLimit = process.env.GENERAL_RATE_LIMIT;
  if (generalRateLimit && isNaN(parseInt(generalRateLimit))) {
    console.warn('⚠️  GENERAL_RATE_LIMIT should be a valid number');
  }

  const apiRateLimit = process.env.API_RATE_LIMIT;
  if (apiRateLimit && isNaN(parseInt(apiRateLimit))) {
    console.warn('⚠️  API_RATE_LIMIT should be a valid number');
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default validateEnvironment;

