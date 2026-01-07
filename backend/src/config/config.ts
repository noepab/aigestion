import { env } from './env.schema';

export const config = {
  // Server configuration
  port: env.PORT,
  nodeEnv: env.NODE_ENV,

  // CORS configuration
  cors: {
    origin: env.CORS_ORIGIN,
  },

  // Rate limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    auth: {
      windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
      max: env.AUTH_RATE_LIMIT_MAX,
    },
    ai: {
      windowMs: env.AI_RATE_LIMIT_WINDOW_MS,
      max: env.AI_RATE_LIMIT_MAX,
    },
    plans: {
      free: {
        max: 100, // 100 requests per window
        windowMs: 15 * 60 * 1000, // 15 minutes
      },
      pro: {
        max: 1000,
        windowMs: 15 * 60 * 1000,
      },
      god: {
        max: 10000,
        windowMs: 15 * 60 * 1000,
      },
      default: {
        max: 100,
        windowMs: 15 * 60 * 1000,
      },
    },
  },

  // JWT configuration
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    cookieExpiresIn: env.JWT_COOKIE_EXPIRES_IN,
  },

  // Gemini API configuration
  geminiApiKey: env.GEMINI_API_KEY || env.GOOGLE_GENAI_API_KEY || '',

  // API documentation
  apiDocs: {
    path: env.API_DOCS_PATH,
    version: env.API_DOCS_VERSION,
    title: env.API_TITLE,
    description: env.API_DESCRIPTION,
  },

  // MongoDB configuration
  mongo: {
    uri: env.MONGODB_URI,
  },

  // Email configuration (for future use)
  email: {
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    username: env.EMAIL_USERNAME || '',
    password: env.EMAIL_PASSWORD || '',
    from: env.EMAIL_FROM,
  },
  // WhatsApp configuration
  whatsapp: {
    phoneNumber: env.WHATSAPP_PHONE_NUMBER,
    apiUrl: env.WHATSAPP_API_URL,
    token: env.WHATSAPP_TOKEN || '',
    businessPhoneId: env.WHATSAPP_BUSINESS_PHONE_ID || '',
    verifyToken: env.WHATSAPP_VERIFY_TOKEN,
  },
  // Social Media Configuration (Meta Express)
  social: {
    instagramBusinessId: env.INSTAGRAM_BUSINESS_ID || env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '',
    facebookPageId: env.FACEBOOK_PAGE_ID || '',
    metaAccessToken: env.META_ACCESS_TOKEN || env.WHATSAPP_TOKEN || '',
    tiktokKey: env.TIKTOK_API_KEY || '',
    tiktokSecret: env.TIKTOK_API_SECRET || '',
    tiktokApiUrl: env.TIKTOK_API_URL || '',
    xApiKey: env.X_API_KEY || '',
    xApiSecret: env.X_API_SECRET || '',
    xAccessToken: env.X_ACCESS_TOKEN || '',
    xAccessSecret: env.X_ACCESS_SECRET || '',
    linkedinClientId: env.LINKEDIN_CLIENT_ID || '',
    linkedinClientSecret: env.LINKEDIN_CLIENT_SECRET || '',
    linkedinAccessToken: env.LINKEDIN_ACCESS_TOKEN || '',
  },
  // Suno AI Configuration
  suno: {
    apiKey: env.SUNO_API_KEY || '',
    baseUrl: env.SUNO_API_BASE_URL,
  },
  // RabbitMQ Configuration
  rabbitmq: {
    url: env.RABBITMQ_URL,
  },
} as const;

export type Config = typeof config;
