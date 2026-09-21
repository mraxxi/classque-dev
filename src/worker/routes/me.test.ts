import { unstable_dev, UnstableDevWorker } from 'wrangler';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';

describe('/api/v1/me integration', () => {
  let prodWorker: UnstableDevWorker;
  let devWorker: UnstableDevWorker;

  beforeAll(async () => {
    prodWorker = await unstable_dev('src/worker/index.ts', {
      experimental: { disableExperimentalWarning: true },
      vars: {
        ENVIRONMENT: 'production',
        DEV_USER_EMAIL: 'test-prod@example.com'
      }
    });

    devWorker = await unstable_dev('src/worker/index.ts', {
      experimental: { disableExperimentalWarning: true },
      vars: {
        ENVIRONMENT: 'development',
        DEV_USER_EMAIL: 'test-dev@example.com'
      }
    });
  });

  afterAll(async () => {
    if (prodWorker) await prodWorker.stop();
    if (devWorker) await devWorker.stop();
  });

  it('proves DEV_USER_EMAIL bypass path is unreachable when ENVIRONMENT !== development', async () => {
    const res = await prodWorker.fetch('/api/v1/me');
    expect(res.status).toBe(401);
    
    const body = await res.json() as any;
    expect(body.error.code).toBe('unauthorized');
  });

  it('provisions account on first login with DEV_USER_EMAIL', async () => {
    // First call creates the account
    const res = await devWorker.fetch('/api/v1/me');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    
    expect(body.email).toBe('test-dev@example.com');
    expect(body.accountId).toBeDefined();

    // Second call should return the existing account
    const res2 = await devWorker.fetch('/api/v1/me');
    expect(res2.status).toBe(200);
    const body2 = await res2.json() as any;
    
    expect(body2.id).toBe(body.id);
    expect(body2.accountId).toBe(body.accountId);
  });
});
