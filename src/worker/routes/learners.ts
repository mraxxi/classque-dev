import { Hono } from 'hono';
import { LearnersRepo } from '../repositories/learners.repo';
import { UpdateLearnerSchema } from '../../shared/schemas/learners';
import { Identity } from '../../shared/schemas/identity';
import { AppError } from '../../shared/errors';

export const learnersRouter = new Hono<{ Bindings: { DB: any }, Variables: { identity: Identity } }>();

learnersRouter.get('/:id', async (c) => {
  const identity = c.get('identity');
  const repo = new LearnersRepo(c.env.DB);
  const learner = await repo.get(identity.accountId, c.req.param('id'));
  if (!learner) throw new AppError('not_found', 'errors.not_found');
  return c.json(learner);
});

learnersRouter.patch('/:id', async (c) => {
  const identity = c.get('identity');
  const repo = new LearnersRepo(c.env.DB);
  const data = UpdateLearnerSchema.parse(await c.req.json());
  const learner = await repo.update(identity.accountId, c.req.param('id'), data);
  if (!learner) throw new AppError('not_found', 'errors.not_found');
  return c.json(learner);
});

learnersRouter.post('/:id/archive', async (c) => {
  const identity = c.get('identity');
  const repo = new LearnersRepo(c.env.DB);
  await repo.archive(identity.accountId, c.req.param('id'));
  return c.json({ ok: true });
});

// LRN-006: Attendance summary for a learner
// Spec: GET /api/v1/learners/:id/attendance-summary?from=&to=
learnersRouter.get('/:id/attendance-summary', async (c) => {
  const identity = c.get('identity');
  const from = c.req.query('from') as string;
  const to = c.req.query('to') as string;
  // Needs to be added to AttendanceRepo: getLearnerSummary(accountId, learnerId, from, to)
  const query = `
      SELECT s.group_id,
             SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
             SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late,
             SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent,
             SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused
      FROM attendance a
      JOIN sessions s ON a.session_id = s.id
      WHERE a.account_id = ? AND a.learner_id = ? AND s.session_date >= ? AND s.session_date <= ?
      GROUP BY s.group_id
  `;
  const { results } = await c.env.DB.prepare(query).bind(identity.accountId, c.req.param('id'), from, to).all();
  return c.json(results);
});
