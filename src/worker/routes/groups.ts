import { Hono } from 'hono';
import { GroupsRepo } from '../repositories/groups.repo';
import { LearnersRepo } from '../repositories/learners.repo';
import { WorkplacesRepo } from '../repositories/workplaces.repo';
import { SessionsRepo } from '../repositories/sessions.repo';
import { CreateGroupSchema, UpdateGroupSchema } from '../../shared/schemas/groups';
import { BulkAddLearnersSchema } from '../../shared/schemas/learners';
import { CreateScheduleRuleSchema } from '../../shared/schemas/schedule';
import { Identity } from '../../shared/schemas/identity';
import { AppError } from '../../shared/errors';
import { SessionsService } from '../services/sessions.service';
import { AttendanceRepo } from '../repositories/attendance.repo';

export const groupsRouter = new Hono<{ Bindings: { DB: any }, Variables: { identity: Identity } }>();

groupsRouter.get('/', async (c) => {
  const identity = c.get('identity');
  const workplaceId = c.req.query('workplaceId');
  const includeArchived = c.req.query('includeArchived') === 'true';
  const limit = parseInt(c.req.query('limit') || '50', 10);
  
  const repo = new GroupsRepo(c.env.DB);
  const groups = await repo.list(identity.accountId, workplaceId, includeArchived, limit);
  return c.json(groups);
});

groupsRouter.post('/', async (c) => {
  const identity = c.get('identity');
  const groupsRepo = new GroupsRepo(c.env.DB);
  const workplacesRepo = new WorkplacesRepo(c.env.DB);
  const learnersRepo = new LearnersRepo(c.env.DB);
  
  const data = CreateGroupSchema.parse(await c.req.json());
  
  // DM-011: term_id allowed only if workplace kind = 'institution'
  if (data.termId) {
    const wp = await workplacesRepo.get(identity.accountId, data.workplaceId);
    if (!wp || wp.kind !== 'institution') {
      throw new AppError('validation_failed', 'errors.term_not_allowed');
    }
  }

  const group = await groupsRepo.create(identity.accountId, data);
  if (!group) throw new AppError('internal_error', 'errors.internal_error');

  // GRP-002: individual groups create Learner and Membership in one batch
  if (data.kind === 'individual' && data.learnerName) {
    const learner = await learnersRepo.create(identity.accountId, data.workplaceId, { displayName: data.learnerName });
    if (learner) {
      const today = new Date().toISOString().split('T')[0];
      await learnersRepo.addLearnerToGroup(identity.accountId, group.id as string, learner.id as string, today);
    }
  }

  return c.json(group, 201);
});

groupsRouter.get('/:id', async (c) => {
  const identity = c.get('identity');
  const repo = new GroupsRepo(c.env.DB);
  const group = await repo.get(identity.accountId, c.req.param('id'));
  if (!group) throw new AppError('not_found', 'errors.not_found');
  return c.json(group);
});

groupsRouter.patch('/:id', async (c) => {
  const identity = c.get('identity');
  const repo = new GroupsRepo(c.env.DB);
  const data = UpdateGroupSchema.parse(await c.req.json());
  const group = await repo.update(identity.accountId, c.req.param('id'), data);
  if (!group) throw new AppError('not_found', 'errors.not_found');
  return c.json(group);
});

groupsRouter.post('/:id/archive', async (c) => {
  const identity = c.get('identity');
  // GRP-004: Archive group archives rules and deletes future scheduled non-exception sessions
  // Wait, I need a service or just do it sequentially.
  // We'll just archive the group for now. The spec says "archives its Schedule rules and deletes its future scheduled non-exception Sessions in one batch".
  // Since we use D1, doing this in one batch requires custom SQL. Let's do it in a service or right here.
  const groupId = c.req.param('id');
  const now = new Date().toISOString();
  
  const stmt1 = c.env.DB.prepare('UPDATE groups SET archived_at = ?, updated_at = ? WHERE account_id = ? AND id = ?').bind(now, now, identity.accountId, groupId);
  const stmt2 = c.env.DB.prepare('UPDATE schedule_rules SET archived_at = ?, updated_at = ? WHERE account_id = ? AND group_id = ?').bind(now, now, identity.accountId, groupId);
  const stmt3 = c.env.DB.prepare(`DELETE FROM sessions WHERE account_id = ? AND group_id = ? AND session_date >= ? AND status = 'scheduled' AND is_exception = 0`).bind(identity.accountId, groupId, now.split('T')[0]);
  
  await c.env.DB.batch([stmt1, stmt2, stmt3]);
  return c.json({ ok: true });
});

groupsRouter.post('/:id/restore', async (c) => {
  const identity = c.get('identity');
  const groupId = c.req.param('id');
  // Restore group and rules
  const now = new Date().toISOString();
  const stmt1 = c.env.DB.prepare('UPDATE groups SET archived_at = NULL, updated_at = ? WHERE account_id = ? AND id = ?').bind(now, identity.accountId, groupId);
  const stmt2 = c.env.DB.prepare('UPDATE schedule_rules SET archived_at = NULL, updated_at = ? WHERE account_id = ? AND group_id = ?').bind(now, identity.accountId, groupId);
  
  await c.env.DB.batch([stmt1, stmt2]);
  
  // Top-up regenerating sessions
  const sessionsService = new SessionsService(new SessionsRepo(c.env.DB));
  await sessionsService.topUp(identity.accountId, now.split('T')[0]);
  
  return c.json({ ok: true });
});

// --- Group Learners ---

groupsRouter.get('/:id/learners', async (c) => {
  const identity = c.get('identity');
  const includeLeft = c.req.query('includeLeft') === 'true';
  const repo = new LearnersRepo(c.env.DB);
  const learners = await repo.getGroupLearners(identity.accountId, c.req.param('id'), includeLeft);
  return c.json(learners);
});

groupsRouter.post('/:id/learners', async (c) => {
  const identity = c.get('identity');
  const groupId = c.req.param('id');
  const groupsRepo = new GroupsRepo(c.env.DB);
  const learnersRepo = new LearnersRepo(c.env.DB);
  
  const group = await groupsRepo.get(identity.accountId, groupId);
  if (!group) throw new AppError('not_found', 'errors.not_found');

  const data = BulkAddLearnersSchema.parse(await c.req.json());
  const today = new Date().toISOString().split('T')[0];
  
  const newLearnerCount = data.names?.length || 0;
  const existingLearnerCount = data.learnerIds?.length || 0;

  // DM-012: Individual groups only allow 1 active membership
  if (group.kind === 'individual') {
    const currentActive = await learnersRepo.countActiveGroupLearners(identity.accountId, groupId);
    if (currentActive + newLearnerCount + existingLearnerCount > 1) {
      throw new AppError('conflict', 'errors.individual_group_limit');
    }
  }

  // LRN-008: Group holds at most 100 active learners
  const currentActive = await learnersRepo.countActiveGroupLearners(identity.accountId, groupId);
  if (currentActive + newLearnerCount + existingLearnerCount > 100) {
    throw new AppError('conflict', 'errors.group_learner_limit');
  }

  // De-duplicate names case-insensitively within paste
  const uniqueNames = new Set<string>();
  if (data.names) {
    for (const name of data.names) {
      const trimmed = name.trim();
      if (trimmed) {
        uniqueNames.add(trimmed.toLowerCase());
      }
    }
  }

  const currentRoster = await learnersRepo.getGroupLearners(identity.accountId, groupId, true);
  const currentRosterLower = currentRoster.map(l => (l.display_name as string).toLowerCase());
  
  // De-duplicate against current roster
  const finalNamesToAdd: string[] = [];
  for (const lowerName of uniqueNames) {
    if (!currentRosterLower.includes(lowerName)) {
      // Find original cased name (basic approach, grab first matching from input)
      const original = data.names?.find(n => n.trim().toLowerCase() === lowerName)?.trim();
      if (original) finalNamesToAdd.push(original);
    }
  }

  // Generate DB batch
  const stmts: any[] = [];
  const now = new Date().toISOString();

  for (const name of finalNamesToAdd) {
    const id = crypto.randomUUID(); // generateId() replacement for brevity inside loop
    stmts.push(c.env.DB.prepare('INSERT INTO learners (id, account_id, workplace_id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, identity.accountId, group.workplace_id, name, now, now));
    stmts.push(c.env.DB.prepare('INSERT INTO group_learners (group_id, learner_id, account_id, joined_on) VALUES (?, ?, ?, ?) ON CONFLICT(group_id, learner_id) DO UPDATE SET left_on = NULL, joined_on = excluded.joined_on').bind(groupId, id, identity.accountId, today));
  }

  if (data.learnerIds) {
    for (const lId of data.learnerIds) {
      // DM-010 validation: Learner must belong to the same workplace
      const learner = await learnersRepo.get(identity.accountId, lId);
      if (learner && learner.workplace_id === group.workplace_id) {
         stmts.push(c.env.DB.prepare('INSERT INTO group_learners (group_id, learner_id, account_id, joined_on) VALUES (?, ?, ?, ?) ON CONFLICT(group_id, learner_id) DO UPDATE SET left_on = NULL, joined_on = excluded.joined_on').bind(groupId, lId, identity.accountId, today));
      } else {
        throw new AppError('validation_failed', 'errors.cross_workplace_learner');
      }
    }
  }

  if (stmts.length > 0) {
    await c.env.DB.batch(stmts);
  }

  return c.json({ added: finalNamesToAdd.length + (data.learnerIds?.length || 0) });
});

groupsRouter.post('/:id/learners/:learnerId/remove', async (c) => {
  const identity = c.get('identity');
  const repo = new LearnersRepo(c.env.DB);
  const today = new Date().toISOString().split('T')[0];
  
  await repo.removeLearnerFromGroup(identity.accountId, c.req.param('id'), c.req.param('learnerId'), today);
  return c.json({ ok: true });
});

// --- Schedule Rules ---
groupsRouter.get('/:id/schedule-rules', async (c) => {
  const identity = c.get('identity');
  const repo = new SessionsRepo(c.env.DB);
  const rules = await repo.listRules(identity.accountId, c.req.param('id'));
  return c.json(rules);
});

groupsRouter.post('/:id/schedule-rules', async (c) => {
  const identity = c.get('identity');
  const groupId = c.req.param('id');
  const repo = new SessionsRepo(c.env.DB);
  
  // SCH-008: Each Session keeps the tz it was created with (threaded from user identity)
  const tz = identity.timezone || 'UTC';

  const data = CreateScheduleRuleSchema.parse(await c.req.json());
  const rule = await repo.createRule(identity.accountId, groupId, tz, data);
  
  // Generate sessions
  const sessionsService = new SessionsService(repo);
  const today = new Date().toISOString().split('T')[0];
  await sessionsService.topUp(identity.accountId, today);

  return c.json(rule, 201);
});

// --- Attendance Summary ---
groupsRouter.get('/:id/attendance-summary', async (c) => {
  const identity = c.get('identity');
  const repo = new AttendanceRepo(c.env.DB);
  const from = c.req.query('from') as string;
  const to = c.req.query('to') as string;
  
  const summary = await repo.getSummary(identity.accountId, c.req.param('id'), from, to);
  return c.json(summary);
});
