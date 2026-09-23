import { Hono } from 'hono';
import { PlansRepo } from '../repositories/plans.repo';
import { 
  CreatePlanSchema, 
  UpdatePlanSchema, 
  QueryPlansSchema,
  createPlanContentSchema 
} from '../../shared/schemas/plans';
import { getSubjectPack } from '../../shared/packs/registry';
import { Identity } from '../../shared/schemas/identity';
import { AppError } from '../../shared/errors';

export const plansRouter = new Hono<{ Bindings: { DB: any }, Variables: { identity: Identity } }>();

plansRouter.get('/', async (c) => {
  const identity = c.get('identity');
  const query = QueryPlansSchema.parse(c.req.query());
  const repo = new PlansRepo(c.env.DB);
  const plans = await repo.listPlans(identity.accountId, query);
  return c.json(plans);
});

plansRouter.post('/', async (c) => {
  const identity = c.get('identity');
  const rawBody = await c.req.json();
  const data = CreatePlanSchema.parse(rawBody);

  // PLN-002: Dynamic pack-driven validation
  const pack = getSubjectPack(data.packId);
  const contentValidator = createPlanContentSchema(pack);
  data.content = contentValidator.parse(data.content);

  const repo = new PlansRepo(c.env.DB);
  const plan = await repo.createPlan(identity.accountId, data, pack.version);
  return c.json(plan, 201);
});

plansRouter.get('/:id', async (c) => {
  const identity = c.get('identity');
  const repo = new PlansRepo(c.env.DB);
  const plan = await repo.getPlan(identity.accountId, c.req.param('id'));
  if (!plan) {
    throw new AppError('not_found', 'errors.not_found');
  }
  return c.json(plan);
});

plansRouter.patch('/:id', async (c) => {
  const identity = c.get('identity');
  const repo = new PlansRepo(c.env.DB);
  const existing = await repo.getPlan(identity.accountId, c.req.param('id'));
  if (!existing) {
    throw new AppError('not_found', 'errors.not_found');
  }

  const rawBody = await c.req.json();
  const data = UpdatePlanSchema.parse(rawBody);

  if (data.content !== undefined) {
    const pack = getSubjectPack(existing.pack_id);
    const contentValidator = createPlanContentSchema(pack);
    data.content = contentValidator.parse(data.content);
  }

  const updated = await repo.updatePlan(identity.accountId, c.req.param('id'), data);
  return c.json(updated);
});

plansRouter.post('/:id/duplicate', async (c) => {
  const identity = c.get('identity');
  const repo = new PlansRepo(c.env.DB);
  const duplicate = await repo.duplicatePlan(identity.accountId, c.req.param('id'), '{{title}} (copy)');
  if (!duplicate) {
    throw new AppError('not_found', 'errors.not_found');
  }
  return c.json(duplicate, 201);
});

plansRouter.post('/:id/archive', async (c) => {
  const identity = c.get('identity');
  const repo = new PlansRepo(c.env.DB);
  const archived = await repo.archivePlan(identity.accountId, c.req.param('id'));
  if (!archived) {
    throw new AppError('not_found', 'errors.not_found');
  }
  return c.json(archived);
});

plansRouter.post('/:id/restore', async (c) => {
  const identity = c.get('identity');
  const repo = new PlansRepo(c.env.DB);
  const restored = await repo.restorePlan(identity.accountId, c.req.param('id'));
  if (!restored) {
    throw new AppError('not_found', 'errors.not_found');
  }
  return c.json(restored);
});
