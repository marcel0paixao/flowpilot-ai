export type RuntimeConfig = {
  nodeEnv: string;
  logLevel: string;
  databaseUrl: string;
  rabbitmqUrl: string;
  redisUrl: string;
  qdrantUrl: string;
};

export function readConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  return {
    nodeEnv: env.NODE_ENV ?? "development",
    logLevel: env.LOG_LEVEL ?? "info",
    databaseUrl: requireEnv(env, "DATABASE_URL"),
    rabbitmqUrl: requireEnv(env, "RABBITMQ_URL"),
    redisUrl: requireEnv(env, "REDIS_URL"),
    qdrantUrl: requireEnv(env, "QDRANT_URL")
  };
}

function requireEnv(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}
