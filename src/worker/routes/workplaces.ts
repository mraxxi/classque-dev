import { Hono } from 'hono';
import { WorkplacesRepo, TermsRepo } from '../repositories/workplaces.repo';
import { CreateWorkplaceSchema, UpdateWorkplaceSchema, CreateTermSchema, UpdateTermSchema } from '../../shared/schemas/workplaces';
import { Identity } from '../../shared/schemas/identity';
import { AppError } from '../../shared/errors';

export const workplacesRouter = new Hono<{ Bindings: { DB: any }, Variables: { identity: Identity } }>();

workplacesRouter.get('/', async (c) => {
  const identity = c.get('identity');
  const includeArchived = c.req.query('includeArchived') === 'true';
  const repo = new WorkplacesRepo(c.env.DB);
  const workplaces = await repo.list(identity.accountId, includeArchived);
  return c.json(workplaces);
});

workplacesRouter.post('/', async (c) => {
  const identity = c.get('identity');
  const repo = new WorkplacesRepo(c.env.DB);
  
  const count = await repo.countActive(identity.accountId);
  if (count >= 10) {
    throw new AppError('conflict', 'errors.max_workplaces_reached');
  }

  const data = CreateWorkplaceSchema.parse(await c.req.json());
  const wp = await repo.create(identity.accountId, data);
  return c.json(wp, 201);
});

workplacesRouter.patch('/:id', async (c) => {
  const identity = c.get('identity');
  const wpId = c.req.param('id');
  const repo = new WorkplacesRepo(c.env.DB);
  
  const data = UpdateWorkplaceSchema.parse(await c.req.json());
  const wp = await repo.update(identity.accountId, wpId, data);
  if (!wp) throw new AppError('not_found', 'errors.not_found');
  return c.json(wp);
});

workplacesRouter.post('/:id/archive', async (c) => {
  const identity = c.get('identity');
  const wpId = c.req.param('id');
  const repo = new WorkplacesRepo(c.env.DB);

  const activeGroups = await repo.countActiveGroups(identity.accountId, wpId);
  if (activeGroups > 0) {
    throw new AppError('conflict', 'workplaces.archive_blocked');
  }

  await repo.archive(identity.accountId, wpId);
  return c.json({ ok: true });
});

workplacesRouter.post('/:id/restore', async (c) => {
  const identity = c.get('identity');
  const wpId = c.req.param('id');
  const repo = new WorkplacesRepo(c.env.DB);

  await repo.restore(identity.accountId, wpId);
  return c.json({ ok: true });
});

// --- Terms ---

workplacesRouter.get('/:id/terms', async (c) => {
  const identity = c.get('identity');
  const wpId = c.req.param('id');
  const includeArchived = c.req.query('includeArchived') === 'true';
  const repo = new TermsRepo(c.env.DB);
  
  const terms = await repo.list(identity.accountId, wpId, includeArchived);
  return c.json(terms);
});

workplacesRouter.post('/:id/terms', async (c) => {
  const identity = c.get('identity');
  const wpId = c.req.param('id');
  const repo = new TermsRepo(c.env.DB);
  
  const data = CreateTermSchema.parse(await c.req.json());
  const term = await repo.create(identity.accountId, wpId, data);
  return c.json(term, 201);
});

export const termsRouter = new Hono<{ Bindings: { DB: any }, Variables: { identity: Identity } }>();

termsRouter.patch('/:id', async (c) => {
  const identity = c.get('identity');
  const termId = c.req.param('id');
  const repo = new TermsRepo(c.env.DB);
  
  const data = UpdateTermSchema.parse(await c.req.json());
  const term = await repo.update(identity.accountId, termId, data);
  if (!term) throw new AppError('not_found', 'errors.not_found');
  return c.json(term);
});

termsRouter.post('/:id/archive', async (c) => {
  const identity = c.get('identity');
  const termId = c.req.param('id');
  const repo = new TermsRepo(c.env.DB);
  
  await repo.archive(identity.accountId, termId);
  return c.json({ ok: true });
});

termsRouter.post('/:id/restore', async (c) => {
  const identity = c.get('identity');
  const termId = c.req.param('id');
  const repo = new TermsRepo(c.env.DB);
  
  await repo.restore(identity.accountId, termId);
  return c.json({ ok: true });
});
