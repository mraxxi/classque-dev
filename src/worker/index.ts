import { Hono } from 'hono';
import { identityMiddleware } from './middleware/identity';
import { csrfMiddleware } from './middleware/csrf';
import { meRouter } from './routes/me';
import { workplacesRouter, termsRouter } from './routes/workplaces';
import { groupsRouter } from './routes/groups';
import { learnersRouter } from './routes/learners';
import { sessionsRouter } from './routes/sessions';
import { scheduleRouter, scheduleRulesRouter } from './routes/schedule';
import { AppError } from '../shared/errors';
import { ZodError } from 'zod';

const app = new Hono<{ Bindings: { DB: any, ENVIRONMENT: string, DEV_USER_EMAIL?: string, ACCESS_TEAM_DOMAIN?: string, ACCESS_AUD?: string } }>();

// Global Error Handler
app.onError((err, c) => {
  console.error(err);
  if (err instanceof AppError) {
    return c.json(err.toJSON(), err.statusCode as any);
  }
  if (err instanceof ZodError) {
    return c.json({ error: { code: 'validation_failed', messageKey: 'errors.validation_failed', details: err.flatten() } }, 400);
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
api.route('/workplaces', workplacesRouter);
api.route('/terms', termsRouter);
api.route('/groups', groupsRouter);
api.route('/learners', learnersRouter);
api.route('/sessions', sessionsRouter);
api.route('/schedule', scheduleRouter);
api.route('/schedule-rules', scheduleRulesRouter);
export default app;
