import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Environment variable schema with validation rules
 * This ensures all required environment variables are present and valid at startup
 */
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('Application environment'),

  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535))
    .describe('Server port number'),

  // Frontend URL
  FRONTEND_URL: z.string().url().default('http://localhost:3000').describe('Frontend application URL'),

  // CORS Configuration
  CORS_ORIGIN: z
    .string()
    .default('*')
    .transform((val) => {
      if (val === '*') return '*';
      return val.split(',').map((origin) => origin.trim());
    })
    .describe('Allowed CORS origins (comma-separated)'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('900000') // 15 minutes
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .describe('Rate limit window in milliseconds'),

  RATE_LIMIT_MAX: z
    .string()
    .default('100')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .describe('Maximum requests per window'),

  // Auth Rate Limiting
  AUTH_RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('3600000') // 1 hour
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .describe('Auth rate limit window in milliseconds'),

  AUTH_RATE_LIMIT_MAX: z
    .string()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .describe('Maximum auth requests per window'),

  // AI Rate Limiting
  AI_RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('600000') // 10 minutes
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .describe('AI rate limit window in milliseconds'),

  AI_RATE_LIMIT_MAX: z
    .string()
    .default('30')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .describe('Maximum AI requests per window'),

  // JWT Configuration
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security')
    .describe('Secret key for JWT signing'),

  JWT_EXPIRES_IN: z.string().default('7d').describe('JWT expiration time (e.g., 7d, 24h, 60m)'),

  JWT_COOKIE_EXPIRES_IN: z
    .string()
    .default('7')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .describe('JWT cookie expiration in days'),

  // MongoDB Configuration
  MONGODB_URI: z
    .string()
    .url()
    .or(z.string().regex(/^mongodb(\+srv)?:\/\/.+/))
    .describe('MongoDB connection URI'),

  // Logging
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
    .default('info')
    .describe('Winston log level'),

  // API Keys
  GOOGLE_GENAI_API_KEY: z
    .string()
    .optional()
    .describe('Google Gemini API key (GOOGLE_GENAI_API_KEY)'),
  GEMINI_API_KEY: z
    .string()
    .optional()
    .describe('Google Gemini API key (optional for development)'),

  // MCP / Antigravity
  MCP_SERVER_URL: z.string().url().optional().describe('Base URL for Antigravity MCP server'),
  MCP_API_KEY: z.string().optional().describe('API key/secret for Antigravity MCP server'),

  // Runway API Token
  RUNWAY_API_KEY: z.string().optional().describe('Runway API token for external services'),

  // Google Cloud Platform APIs
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional().describe('Google Cloud project ID'),

  GOOGLE_CLOUD_LOCATION: z
    .string()
    .default('us-central1')
    .describe('Google Cloud location (region)'),

  GOOGLE_APPLICATION_CREDENTIALS: z
    .string()
    .optional()
    .describe('Path to Google Cloud service account JSON key file'),

  GOOGLE_CLIENT_ID: z.string().optional().describe('Generic Google OAuth2 Client ID'),
  GOOGLE_CLIENT_SECRET: z.string().optional().describe('Generic Google OAuth2 Client Secret'),
  GOOGLE_REDIRECT_URI: z.string().optional().describe('Generic Google OAuth2 Redirect URI'),

  // YouTube Configuration
  YOUTUBE_API_KEY: z.string().optional().describe('YouTube Data API v3 key'),

  // Google Drive API
  GOOGLE_DRIVE_API_KEY: z.string().optional().describe('Google Drive API key'),

  // Google Calendar API
  GOOGLE_CALENDAR_API_KEY: z.string().optional().describe('Google Calendar API key'),

  // Google Sheets API
  GOOGLE_SHEETS_API_KEY: z.string().optional().describe('Google Sheets API key'),

  // Google Maps API
  GOOGLE_MAPS_API_KEY: z.string().optional().describe('Google Maps API key'),

  // Google Cloud Storage
  GCS_BUCKET_NAME: z.string().optional().describe('Google Cloud Storage bucket name'),

  // Google Cloud Vision API
  GOOGLE_VISION_API_KEY: z.string().optional().describe('Google Cloud Vision API key'),

  // Google Cloud Translation API
  GOOGLE_TRANSLATE_API_KEY: z.string().optional().describe('Google Cloud Translation API key'),

  // Google Cloud Natural Language API
  GOOGLE_NL_API_KEY: z.string().optional().describe('Google Cloud Natural Language API key'),

  // YouTube Channel - Personal (Documentation)
  YOUTUBE_PERSONAL_CHANNEL_ID: z
    .string()
    .optional()
    .describe('YouTube channel ID for nemisanalex (documentation)'),

  YOUTUBE_PERSONAL_EMAIL: z
    .string()
    .email()
    .default('nemisanalex@gmail.com')
    .describe('Email for personal YouTube channel'),

  YOUTUBE_PERSONAL_CLIENT_ID: z
    .string()
    .optional()
    .describe('OAuth2 Client ID for personal channel'),

  YOUTUBE_PERSONAL_CLIENT_SECRET: z
    .string()
    .optional()
    .describe('OAuth2 Client Secret for personal channel'),

  YOUTUBE_PERSONAL_REFRESH_TOKEN: z
    .string()
    .optional()
    .describe('OAuth2 Refresh Token for personal channel'),

  // YouTube Channel - Business (NEXUS V1)
  YOUTUBE_BUSINESS_CHANNEL_ID: z
    .string()
    .optional()
    .describe('YouTube channel ID for NEXUS V1 (business)'),

  YOUTUBE_BUSINESS_EMAIL: z
    .string()
    .email()
    .default('a.fernandez@nexusv1.net')
    .describe('Email for business YouTube channel'),

  YOUTUBE_BUSINESS_CLIENT_ID: z
    .string()
    .optional()
    .describe('OAuth2 Client ID for business channel'),

  YOUTUBE_BUSINESS_CLIENT_SECRET: z
    .string()
    .optional()
    .describe('OAuth2 Client Secret for business channel'),

  YOUTUBE_BUSINESS_REFRESH_TOKEN: z
    .string()
    .optional()
    .describe('OAuth2 Refresh Token for business channel'),

  // API Documentation
  API_DOCS_PATH: z.string().default('/api-docs').describe('Swagger documentation path'),

  API_DOCS_VERSION: z.string().default('1.0.0').describe('API version for documentation'),

  API_TITLE: z.string().default('NEXUS V1 Dashboard API').describe('API title for documentation'),

  API_DESCRIPTION: z
    .string()
    .default('API for NEXUS V1 Dashboard application')
    .describe('API description for documentation'),

  // Email Configuration (optional for future use)
  EMAIL_HOST: z.string().default('smtp.gmail.com').describe('SMTP server host'),

  EMAIL_PORT: z
    .string()
    .default('587')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535))
    .describe('SMTP server port'),

  EMAIL_USERNAME: z.string().optional().describe('SMTP username'),

  EMAIL_PASSWORD: z.string().optional().describe('SMTP password'),

  EMAIL_FROM: z
    .string()
    .email()
    .default('no-reply@nexusv1.net')
    .describe('Default sender email address'),

  // Gmail API - Personal Mailbox (OAuth2)
  GMAIL_PERSONAL_EMAIL: z.string().email().optional().describe('Personal Gmail address for OAuth2'),

  GMAIL_PERSONAL_CLIENT_ID: z.string().optional().describe('OAuth2 Client ID for personal Gmail'),

  GMAIL_PERSONAL_CLIENT_SECRET: z
    .string()
    .optional()
    .describe('OAuth2 Client Secret for personal Gmail'),

  GMAIL_PERSONAL_REFRESH_TOKEN: z
    .string()
    .optional()
    .describe('OAuth2 Refresh Token for personal Gmail'),

  // Gmail API - Professional Mailbox (OAuth2)
  GMAIL_PROFESSIONAL_EMAIL: z
    .string()
    .email()
    .optional()
    .describe('Professional Gmail address for OAuth2'),
  // Optional list of additional company Gmail accounts (comma‑separated)
  // Example: "company1@example.com,company2@example.com"
  GMAIL_COMPANY_EMAILS: z
    .string()
    .optional()
    .default('')
    .transform((val) =>
      val
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    )
    .describe('Comma‑separated list of additional company Gmail addresses for OAuth2'),

  GMAIL_PROFESSIONAL_CLIENT_ID: z
    .string()
    .optional()
    .describe('OAuth2 Client ID for professional Gmail'),

  GMAIL_PROFESSIONAL_CLIENT_SECRET: z
    .string()
    .optional()
    .describe('OAuth2 Client Secret for professional Gmail'),

  GMAIL_PROFESSIONAL_REFRESH_TOKEN: z
    .string()
    .optional()
    .describe('OAuth2 Refresh Token for professional Gmail'),

  // Gmail API - Service Account
  GMAIL_SERVICE_ACCOUNT_SUBJECT: z
    .string()
    .email()
    .optional()
    .describe('Email to impersonate with service account (domain-wide delegation)'),

  // WhatsApp Configuration
  WHATSAPP_PHONE_NUMBER: z.string().default('34618779308'),
  WHATSAPP_API_URL: z.string().url().default('https://graph.facebook.com/v17.0'),
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_BUSINESS_PHONE_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().default('nexus_v1_secret_verify_token'),

  // Social Media - Meta
  FACEBOOK_PAGE_ID: z.string().optional(),
  META_ACCESS_TOKEN: z.string().optional(),
  INSTAGRAM_BUSINESS_ID: z.string().optional(),

  // Social Media - TikTok
  TIKTOK_API_KEY: z.string().optional(),
  TIKTOK_API_SECRET: z.string().optional(),
  TIKTOK_API_URL: z.string().url().optional(),

  // Social Media - LinkedIn
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),

  // Suno AI Configuration
  SUNO_API_KEY: z.string().optional(),
  SUNO_API_BASE_URL: z.string().url().default('https://api.sunoapi.org/api/v1'),

  // RabbitMQ Configuration
  RABBITMQ_URL: z.string().default('amqp://localhost'),
  // Social Media - Instagram
  INSTAGRAM_ACCESS_TOKEN: z.string().optional(),
  INSTAGRAM_BUSINESS_ACCOUNT_ID: z.string().optional(),

  // Social Media - LinkedIn
  LINKEDIN_ACCESS_TOKEN: z.string().optional(),
  LINKEDIN_ORGANIZATION_URN: z.string().optional(),

  // Social Media - TikTok
  TIKTOK_ACCESS_TOKEN: z.string().optional(),

  // Social Media - X (Twitter)
  X_API_KEY: z.string().optional(),
  X_API_SECRET: z.string().optional(),
  X_ACCESS_TOKEN: z.string().optional(),
  X_ACCESS_SECRET: z.string().optional(),
  X_BEARER_TOKEN: z.string().optional(),

  // Messaging - Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),

  // Stripe Configuration
  STRIPE_SECRET_KEY: z.string().optional().describe('Stripe Secret Key'),
  STRIPE_WEBHOOK_SECRET: z.string().optional().describe('Stripe Webhook Signing Secret'),
  STRIPE_CURRENCY: z.string().default('usd').describe('Default currency for payments'),
  TAVILY_API_KEY: z.string().optional().describe('Tavily API key for web search'),
});

/**
 * Validated and typed environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * @throws {ZodError} If validation fails
 */
function validateEnv(): Env {
  try {
    if (process.env.NODE_ENV === 'test') {
      return process.env as unknown as Env;
    }
    if (process.env.SKIP_ENV_VALIDATION === 'true') {
      return process.env as unknown as Env;
    }
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((issue: any) => {
        const path = issue.path.join('.');
        return `  - ${path}: ${issue.message}`;
      });

      console.error('❌ Environment validation failed:\n');
      console.error(errorMessages.join('\n'));
      console.error(
        '\nPlease check your .env file and ensure all required variables are set correctly.\n'
      );

      process.exit(1);
    }
    throw error;
  }
}

/**
 * Validated environment variables - available as a singleton
 * This is parsed once at module load time
 */
export const env = validateEnv();

/**
 * Helper to check if we're in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper to check if we're in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper to check if we're in test mode
 */
export const isTest = env.NODE_ENV === 'test';
