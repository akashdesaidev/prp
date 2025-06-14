import { z } from 'zod';
import dotenv from 'dotenv';

// Ensure .env is loaded here because this module may run before index.js executes
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().optional(),
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(20),
  // AI Services (optional for development)
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  // Frontend URL for CORS
  FRONTEND_URL: z.string().url().optional().default('http://localhost:3000')
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  if (process.env.NODE_ENV === 'test') {
    console.warn('Invalid env in test mode, using defaults');
  } else {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
}

// Warn if AI keys are missing in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
    console.warn('⚠️  Warning: No AI service keys configured. AI features will be disabled.');
  }
}

export const env = result.data;
