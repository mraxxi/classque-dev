import { Context, Next } from 'hono';

export async function csrfMiddleware(c: Context, next: Next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)) {
    const contentType = c.req.header('content-type') || '';
    if (!contentType.includes('application/json')) {
      return c.json({ error: { code: 'bad_request', messageKey: 'errors.validation_failed' } }, 400);
    }
    
    // Check Origin (Same-origin policy)
    const origin = c.req.header('origin');
    const host = c.req.header('host');
    
    // If running in development and testing directly, origin might be missing or match localhost
    if (c.env.ENVIRONMENT === 'production') {
      if (!origin || !host) {
        return c.json({ error: { code: 'forbidden', messageKey: 'errors.forbidden' } }, 403);
      }
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return c.json({ error: { code: 'forbidden', messageKey: 'errors.forbidden' } }, 403);
        }
      } catch {
        return c.json({ error: { code: 'forbidden', messageKey: 'errors.forbidden' } }, 403);
      }
    }
  }
  await next();
}
