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
    webhookSecret: required('STRIPE_WEBHOOK_SECRET'),
  },
  backendDir: process.env.BACKEND_DIR ?? '../backend',
};

// Hard safety guard: refuse to run against a non-test database.
if (!/test/i.test(env.db.database)) {
  throw new Error(`Refusing to run: DB_NAME="${env.db.database}" does not look like a test DB.`);
}
