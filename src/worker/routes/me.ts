import { Hono } from 'hono';
import { IdentityRepository } from '../repositories/identity.repo';
import { UpdateMeSchema, Identity } from '../../shared/schemas/identity';
import { validationFailed } from '../../shared/errors';

const meRouter = new Hono<{ Bindings: { DB: any }, Variables: { identity: Identity, identityRepo: IdentityRepository } }>();

meRouter.get('/', async (c) => {
  const identity = c.get('identity');
  const repo = c.get('identityRepo');
  
  const user = await repo.findUserByEmail(identity.email);
  if (!user) {
    // Should not happen as middleware provisions
    return c.json({ error: { code: 'not_found', messageKey: 'errors.not_found' } }, 404);
  }
  
  return c.json({
    id: user.userId,
    email: user.email,
    displayName: user.display_name,
    locale: user.locale,
    timezone: user.timezone,
    weekStart: user.week_start,
    groupLabel: user.group_label,
    accountId: user.accountId,
    role: user.role,
    enabledModules: JSON.parse((user.enabled_modules as string) || '[]')
  });
});

meRouter.patch('/', async (c) => {
  const identity = c.get('identity');
  const repo = c.get('identityRepo');
  
  let body;
  try {
    body = await c.req.json();
  } catch {
    throw validationFailed('Invalid JSON');
  }
  
  const parsed = UpdateMeSchema.safeParse(body);
  if (!parsed.success) {
    throw validationFailed(parsed.error.errors);
  }
  
  await repo.updateMe(identity.userId, parsed.data);
  
  return c.json({ ok: true });
});

export { meRouter };
