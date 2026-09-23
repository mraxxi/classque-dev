import { Hono } from 'hono';
import { SessionsRepo } from '../repositories/sessions.repo';
import { UpdateScheduleRuleSchema } from '../../shared/schemas/schedule';
import { Identity } from '../../shared/schemas/identity';
import { AppError } from '../../shared/errors';
import { SessionsService } from '../services/sessions.service';

export const scheduleRouter = new Hono<{ Bindings: { DB: any }, Variables: { identity: Identity } }>();

scheduleRouter.post('/top-up', async (c) => {
  const identity = c.get('identity');
  const repo = new SessionsRepo(c.env.DB);
  const service = new SessionsService(repo);
  
  // Client passes local today
  const body = await c.req.json().catch(() => ({}));
  const localToday = body.localToday || new Date().toISOString().split('T')[0];
  
  const created = await service.topUp(identity.accountId, localToday);
  return c.json({ created });
});

export const scheduleRulesRouter = new Hono<{ Bindings: { DB: any }, Variables: { identity: Identity } }>();

scheduleRulesRouter.patch('/:id', async (c) => {
  const identity = c.get('identity');
  const ruleId = c.req.param('id');
  const repo = new SessionsRepo(c.env.DB);
  
  const data = UpdateScheduleRuleSchema.parse(await c.req.json());
  const rule = await repo.updateRule(identity.accountId, ruleId, data);
  if (!rule) throw new AppError('not_found', 'errors.not_found');

  // Regenerate sessions
  const service = new SessionsService(repo);
  const today = new Date().toISOString().split('T')[0];
  await service.regenerateForRule(identity.accountId, ruleId, today);

  return c.json(rule);
});

scheduleRulesRouter.delete('/:id', async (c) => {
  const identity = c.get('identity');
  const ruleId = c.req.param('id');
  const repo = new SessionsRepo(c.env.DB);
  
  await repo.archiveRule(identity.accountId, ruleId);
  
  const today = new Date().toISOString().split('T')[0];
  await repo.deleteFutureScheduledFromRule(identity.accountId, ruleId, today);
  
  return c.json({ ok: true });
});
