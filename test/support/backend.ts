import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(dir, '..', env.backendDir);

/** Run a one-shot `dotnet run -- <arg>` against the test DB and wait for exit. */
export function runBackendCommand(arg: '--migrate' | '--seed'): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('dotnet', ['run', '--project', 'BookingSystem.Api.csproj', '--', arg], {
      cwd: backendDir,
      env: { ...process.env, DB_NAME: env.db.database },
      stdio: 'inherit',
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${arg} exited ${code}`))));
  });
}

/** Poll a URL until it responds or the timeout elapses. */
export async function waitForUrl(url: string, timeoutMs = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}
