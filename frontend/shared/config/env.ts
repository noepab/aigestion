import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_ENABLE_ANALYTICS: z.string().transform((val) => val === 'true').optional(),
  VITE_ENABLE_AI_STREAMING: z.string().transform((val) => val === 'true').optional(),
  MODE: z.enum(['development', 'production', 'test']),
});

const _env = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
  VITE_ENABLE_AI_STREAMING: import.meta.env.VITE_ENABLE_AI_STREAMING,
  MODE: import.meta.env.MODE,
};

const parsed = envSchema.safeParse(_env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables. Check console for details.');
}

export const env = parsed.data;
