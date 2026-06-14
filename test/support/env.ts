import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(dir, '../.env.test') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name} in test/.env.test`);
  return value;
}

export const env = {
  baseUrl: process.env.BASE_URL ?? 'http://localhost:3000',
  apiUrl: process.env.API_URL ?? 'http://localhost:5000/api',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? '3306'),
    database: required('DB_NAME'),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? '',
    webhookSecret: required('STRIPE_WEBHOOK_SECRET'),
  },
  admin: {
    email: process.env.ADMIN_EMAIL ?? 'admin@massage.com',
    password: process.env.ADMIN_PASSWORD ?? 'admin123',
    firstName: process.env.ADMIN_FIRST_NAME ?? 'Admin',
    lastName: process.env.ADMIN_LAST_NAME ?? 'User',
  },
  dotnet: {
    cli: process.env.DOTNET_CLI ?? '/usr/local/share/dotnet/dotnet',
    root: process.env.DOTNET_ROOT ?? '/usr/local/share/dotnet',
  },
  backendDir: process.env.BACKEND_DIR ?? '../backend',
};

// Hard safety guard: refuse to run against a non-test database.
if (!/test/i.test(env.db.database)) {
  throw new Error(`Refusing to run: DB_NAME="${env.db.database}" does not look like a test DB.`);
}

/**
 * Env vars injected into the backend process so it uses the isolated test DB
 * and Stripe test keys. With the EnvLoader fix (real env wins over .env), these
 * override backend/.env without editing it.
 */
export function backendProcessEnv(): Record<string, string> {
  const existingPath = process.env.PATH ?? '';

  return {
    PATH: `${env.dotnet.root}:${existingPath}`,
    DOTNET_ROOT: env.dotnet.root,
    // Backend listens on the port from API_URL.
    PORT: new URL(env.apiUrl).port || '5001',
    DB_HOST: env.db.host,
    DB_PORT: String(env.db.port),
    DB_NAME: env.db.database,
    DB_USER: env.db.user,
    DB_PASSWORD: env.db.password,
    STRIPE_SECRET_KEY: env.stripe.secretKey,
    STRIPE_PUBLISHABLE_KEY: env.stripe.publishableKey,
    STRIPE_WEBHOOK_SECRET: env.stripe.webhookSecret,
    ADMIN_EMAIL: env.admin.email,
    ADMIN_PASSWORD: env.admin.password,
    ADMIN_FIRST_NAME: env.admin.firstName,
    ADMIN_LAST_NAME: env.admin.lastName,
    // Local mock: backend returns synthetic payment intents, no real Stripe API.
    STRIPE_FAKE_PAYMENTS: 'true',
  };
}
