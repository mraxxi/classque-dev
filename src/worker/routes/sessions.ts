import { Hono } from 'hono';
import { SessionsRepo } from '../repositories/sessions.repo';
import { CreateSessionSchema, UpdateSessionSchema, RescheduleSessionSchema } from '../../shared/schemas/schedule';
import { SaveAttendanceSchema } from '../../shared/schemas/attendance';
import { Identity } from '../../shared/schemas/identity';
import { AppError } from '../../shared/errors';
import { AttendanceRepo } from '../repositories/attendance.repo';
import { LearnersRepo } from '../repositories/learners.repo';

export const sessionsRouter = new Hono<{ Bindings: { DB: any }, Variables: { identity: Identity } }>();

sessionsRouter.get('/', async (c) => {
  const identity = c.get('identity');
  const from = c.req.query('from') as string;
  const to = c.req.query('to') as string;
  const workplaceId = c.req.query('workplaceId');
  const groupId = c.req.query('groupId');

  if (!from || !to) throw new AppError('validation_failed', 'errors.missing_date_range');
  
  // TDY-007: Max 14 days
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 3600 * 24));
  if (diffDays > 14 || diffDays < 0) {
    throw new AppError('validation_failed', 'errors.invalid_date_range');
  }

  const repo = new SessionsRepo(c.env.DB);
  const sessions = await repo.listSessionsInRange(identity.accountId, from, to, workplaceId, groupId);
  return c.json(sessions);
});

sessionsRouter.post('/', async (c) => {
  const identity = c.get('identity');
  const repo = new SessionsRepo(c.env.DB);
  // SCH-008: Each Session keeps the tz it was created with (threaded from user identity)
  const tz = identity.timezone || 'UTC';

  const data = CreateSessionSchema.parse(await c.req.json());
  const session = await repo.createOneOffSession(identity.accountId, tz, data);
  return c.json(session, 201);
});

sessionsRouter.get('/:id', async (c) => {
  const identity = c.get('identity');
  const repo = new SessionsRepo(c.env.DB);
  const session = await repo.getSession(identity.accountId, c.req.param('id'));
  if (!session) throw new AppError('not_found', 'errors.not_found');
  return c.json(session);
});

sessionsRouter.patch('/:id', async (c) => {
  const identity = c.get('identity');
  const repo = new SessionsRepo(c.env.DB);
  const data = UpdateSessionSchema.parse(await c.req.json());

  // Editing marks as exception
  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: any[] = [];
  if (data.startTime !== undefined) { updates.push('start_time = ?'); values.push(data.startTime); }
  if (data.durationMin !== undefined) { updates.push('duration_min = ?'); values.push(data.durationMin); }
  if (data.room !== undefined) { updates.push('room = ?'); values.push(data.room || null); }
  
  if (updates.length > 0) {
    updates.push('is_exception = 1', 'updated_at = ?');
    values.push(now, identity.accountId, c.req.param('id'));
    await c.env.DB.prepare(`UPDATE sessions SET ${updates.join(', ')} WHERE account_id = ? AND id = ?`).bind(...values).run();
  }

  const session = await repo.getSession(identity.accountId, c.req.param('id'));
  return c.json(session);
});

sessionsRouter.post('/:id/cancel', async (c) => {
  const identity = c.get('identity');
  const repo = new SessionsRepo(c.env.DB);
  const session = await repo.setStatus(identity.accountId, c.req.param('id'), 'cancelled', true);
  return c.json(session);
});

sessionsRouter.post('/:id/undo-held', async (c) => {
  const identity = c.get('identity');
  const repo = new SessionsRepo(c.env.DB);
  // Revert back to scheduled. Should technically clear attendance or keep it? Spec says just returns to scheduled.
  const session = await repo.setStatus(identity.accountId, c.req.param('id'), 'scheduled', true);
  return c.json(session);
});

sessionsRouter.post('/:id/reschedule', async (c) => {
  const identity = c.get('identity');
  const repo = new SessionsRepo(c.env.DB);
  
  const oldSession = await repo.getSession(identity.accountId, c.req.param('id'));
  if (!oldSession) throw new AppError('not_found', 'errors.not_found');

  const data = RescheduleSessionSchema.parse(await c.req.json());
  
  // Set old to rescheduled
  await repo.setStatus(identity.accountId, c.req.param('id'), 'rescheduled', true);
  
  // Create new session
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    INSERT INTO sessions (id, account_id, group_id, session_date, start_time, duration_min, tz, status, room, rescheduled_from_id, is_exception, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, 1, ?, ?)
  `).bind(
    newId, identity.accountId, oldSession.group_id, data.sessionDate, data.startTime, data.durationMin, 
    oldSession.tz, data.room || null, oldSession.id, now, now
  ).run();

  const session = await repo.getSession(identity.accountId, newId);
  return c.json(session, 201);
});

// --- Attendance ---

sessionsRouter.get('/:id/attendance', async (c) => {
  const identity = c.get('identity');
  const sessionId = c.req.param('id');
  const sessionsRepo = new SessionsRepo(c.env.DB);
  const learnersRepo = new LearnersRepo(c.env.DB);
  const attRepo = new AttendanceRepo(c.env.DB);

  const session = await sessionsRepo.getSession(identity.accountId, sessionId);
  if (!session) throw new AppError('not_found', 'errors.not_found');

  // DM-013: Attendance rows valid only for learners with active membership on session's date
  const allGroupLearners = await learnersRepo.getGroupLearners(identity.accountId, session.group_id as string, true);
  
  const activeLearners = allGroupLearners.filter((l: any) => {
    const joinedOn = l.joined_on as string;
    const leftOn = l.left_on as string | null;
    const sDate = session.session_date as string;
    
    return joinedOn <= sDate && (leftOn === null || leftOn >= sDate);
  });

  const existingMarks = await attRepo.getSessionAttendance(identity.accountId, sessionId);
  const marksMap = new Map(existingMarks.map((m: any) => [m.learner_id, m]));

  const roster = activeLearners.map((l: any) => {
    const mark: any = marksMap.get(l.id);
    return {
      learnerId: l.id,
      displayName: l.display_name,
      status: mark ? mark.status : null,
      note: mark ? mark.note : null
    };
  });

  return c.json(roster);
});

sessionsRouter.put('/:id/attendance', async (c) => {
  const identity = c.get('identity');
  const sessionId = c.req.param('id');
  const sessionsRepo = new SessionsRepo(c.env.DB);
  const attRepo = new AttendanceRepo(c.env.DB);

  const session = await sessionsRepo.getSession(identity.accountId, sessionId);
  if (!session) throw new AppError('not_found', 'errors.not_found');

  if (session.status === 'cancelled' || session.status === 'rescheduled') {
    throw new AppError('conflict', 'errors.attendance_blocked');
  }

  const data = SaveAttendanceSchema.parse(await c.req.json());
  
  let changes = 0;
  if (data.records.length > 0) {
    changes = await attRepo.saveBatch(identity.accountId, sessionId, data);
  }

  // Budget Logging requirement (rows read/written logged for Today and Attendance saves)
  console.log(`[Budget] Attendance Save - Written rows: ${changes}`);

  // DM-024: saving attendance on scheduled sets to held
  if (session.status === 'scheduled') {
    await sessionsRepo.setStatus(identity.accountId, sessionId, 'held', true);
  } else {
    // Just mark exception
    await c.env.DB.prepare('UPDATE sessions SET is_exception = 1 WHERE account_id = ? AND id = ?').bind(identity.accountId, sessionId).run();
  }

  const updatedSession = await sessionsRepo.getSession(identity.accountId, sessionId);
  return c.json(updatedSession);
});
