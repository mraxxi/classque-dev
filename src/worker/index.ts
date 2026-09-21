import { Hono } from 'hono';
import { identityMiddleware } from './middleware/identity';
import { csrfMiddleware } from './middleware/csrf';
import { meRouter } from './routes/me';
import { AppError } from '../shared/errors';

const app = new Hono<{ Bindings: { DB: any, ENVIRONMENT: string, DEV_USER_EMAIL?: string, ACCESS_TEAM_DOMAIN?: string, ACCESS_AUD?: string } }>();

// Global Error Handler
app.onError((err, c) => {
  console.error(err);
  if (err instanceof AppError) {
    return c.json(err.toJSON(), err.statusCode as any);
  }
  return c.json({ error: { code: 'internal_error', messageKey: 'errors.error' } }, 500);
});

// Health check (No Auth)
app.get('/api/v1/health', (c) => {
  return c.json({ ok: true });
});

const api = app.basePath('/api/v1');

// CSRF & Identity Middleware for all other API routes
api.use('*', csrfMiddleware);
api.use('*', identityMiddleware);

api.route('/me', meRouter);

export default app;
