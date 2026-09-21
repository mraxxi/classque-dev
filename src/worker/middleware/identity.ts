import { Context, Next } from 'hono';
import { IdentityService } from '../services/identity';
import { IdentityRepository } from '../repositories/identity.repo';

export async function identityMiddleware(c: Context, next: Next) {
  const repo = new IdentityRepository(c.env.DB);
  const service = new IdentityService(repo);
  
  const identity = await service.getIdentityFromRequest(c.req.raw, c.env);
  
  if (!identity) {
    return c.json({ error: { code: 'unauthorized', messageKey: 'errors.forbidden' } }, 401);
  }
  
  c.set('identity', identity);
  c.set('identityService', service);
  c.set('identityRepo', repo);
  
  await next();
}
