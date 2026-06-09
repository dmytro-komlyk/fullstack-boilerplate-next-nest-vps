import * as dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { z } from 'zod';

expand(dotenv.config({ path: ['.env.local', '.env'] }));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_PORT: z.string().regex(/^\d+$/, 'Must be a numeric string'),
  APP_NAME: z.string().min(1),
  APP_WEBSITE_URL: z.string().url(),
  APP_ADMIN_URL: z.string().url(),
  APP_HTTP_URL: z.string().url().optional(),
  APP_SOCKET_URL: z.string().optional(),
  APP_BASE_URL: z.string().optional(),
  APP_SWAGGER: z.string().default('swagger'),
  APP_STATIC_ASSETS: z.string().default('assets'),
  JWT_ACCESS_TOKEN: z.string().min(32),
  JWT_REFRESH_TOKEN: z.string().min(32),
  JWT_RESET_TOKEN: z.string().min(32),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  GOOGLE_WEB_CLIENT_ID: z.string().optional(),
  GOOGLE_WEB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_IOS_CLIENT_ID: z.string().optional(),
  GOOGLE_ANDROID_CLIENT_ID: z.string().optional(),
  SMTP_DOMAIN: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_TO_EMAIL: z.string().optional(),
  SMTP_TO_PASSWORD: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().email().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = (() => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    console.error('❌ Invalid environment variables:');
    for (const [key, messages] of Object.entries(errors)) {
      console.error(`  ${key}: ${messages?.join(', ')}`);
    }
    process.exit(1);
  }
  return result.data;
})();
