import "dotenv/config";

import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default("*"),
  DATABASE_URL: z.string().url(),
  RABBITMQ_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  QDRANT_URL: z.string().url()
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid API environment: ${z.prettifyError(parsed.error)}`);
}

export const appConfig = {
  nodeEnv: parsed.data.NODE_ENV,
  host: parsed.data.API_HOST,
  port: parsed.data.API_PORT,
  corsOrigin: parsed.data.CORS_ORIGIN,
  databaseUrl: parsed.data.DATABASE_URL,
  rabbitmqUrl: parsed.data.RABBITMQ_URL,
  redisUrl: parsed.data.REDIS_URL,
  qdrantUrl: parsed.data.QDRANT_URL
} as const;
