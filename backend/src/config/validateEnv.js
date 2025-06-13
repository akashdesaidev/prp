import { z } from 'zod';
import dotenv from 'dotenv';

// Ensure .env is loaded here because this module may run before index.js executes
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().optional(),
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(20)
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = result.data;
