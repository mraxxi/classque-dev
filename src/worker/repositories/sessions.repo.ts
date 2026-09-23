import { D1Database } from '@cloudflare/workers-types';
import { generateId } from '../../shared/id';
import { CreateScheduleRuleSchema, UpdateScheduleRuleSchema, CreateSessionSchema } from '../../shared/schemas/schedule';
import { z } from 'zod';

export class SessionsRepo {
  constructor(private db: D1Database) {}

  // --- Schedule Rules ---

  async listRules(accountId: string, groupId: string) {
    const { results } = await this.db.prepare(
      'SELECT * FROM schedule_rules WHERE account_id = ? AND group_id = ? AND archived_at IS NULL'
    ).bind(accountId, groupId).all();
    return results;
  }

  async listAllActiveRules(accountId: string) {
    // Joins groups to ensure the group is active, and terms to get the term end date if applicable
    const { results } = await this.db.prepare(`
      SELECT r.*, t.ends_on as term_ends_on
      FROM schedule_rules r
      JOIN groups g ON r.group_id = g.id
      LEFT JOIN terms t ON g.term_id = t.id
      WHERE r.account_id = ? AND r.archived_at IS NULL AND g.archived_at IS NULL
    `).bind(accountId).all();
    return results;
  }

  async getRule(accountId: string, ruleId: string) {
    return this.db.prepare(
      'SELECT * FROM schedule_rules WHERE account_id = ? AND id = ?'
    ).bind(accountId, ruleId).first();
  }

  async createRule(accountId: string, groupId: string, tz: string, data: z.infer<typeof CreateScheduleRuleSchema>) {
    const id = generateId();
    const now = new Date().toISOString();
    await this.db.prepare(
      `INSERT INTO schedule_rules (
        id, account_id, group_id, weekdays, start_time, duration_min, room, tz, starts_on, ends_on, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, accountId, groupId, JSON.stringify(data.weekdays), data.startTime, data.durationMin, 
      data.room || null, tz, data.startsOn, data.endsOn || null, now, now
    ).run();
    return this.getRule(accountId, id);
  }

  async updateRule(accountId: string, ruleId: string, data: z.infer<typeof UpdateScheduleRuleSchema>) {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.weekdays !== undefined) {
      updates.push('weekdays = ?');
      values.push(JSON.stringify(data.weekdays));
    }
    if (data.startTime !== undefined) {
      updates.push('start_time = ?');
      values.push(data.startTime);
    }
    if (data.durationMin !== undefined) {
      updates.push('duration_min = ?');
      values.push(data.durationMin);
    }
    if (data.room !== undefined) {
      updates.push('room = ?');
      values.push(data.room || null);
    }
    if (data.startsOn !== undefined) {
      updates.push('starts_on = ?');
      values.push(data.startsOn);
    }
    if (data.endsOn !== undefined) {
      updates.push('ends_on = ?');
      // If we pass null, it removes the end boundary
      values.push(data.endsOn === null ? null : data.endsOn);
    }

    if (updates.length === 0) return this.getRule(accountId, ruleId);

    updates.push('updated_at = ?');
    values.push(now);

    const query = `UPDATE schedule_rules SET ${updates.join(', ')} WHERE account_id = ? AND id = ?`;
    await this.db.prepare(query).bind(...values, accountId, ruleId).run();
    
    return this.getRule(accountId, ruleId);
  }

  async archiveRule(accountId: string, ruleId: string) {
    const now = new Date().toISOString();
    await this.db.prepare(
      'UPDATE schedule_rules SET archived_at = ?, updated_at = ? WHERE account_id = ? AND id = ?'
    ).bind(now, now, accountId, ruleId).run();
  }

  // --- Sessions ---

  async getSession(accountId: string, sessionId: string) {
    return this.db.prepare(
      'SELECT * FROM sessions WHERE account_id = ? AND id = ?'
    ).bind(accountId, sessionId).first();
  }

  async listSessionsInRange(accountId: string, fromDate: string, toDate: string, workplaceId?: string, groupId?: string) {
    // Limits the date range logic up to the service layer (max 14 days)
    // We join groups to allow optional filtering by workplaceId or groupId
    // Relies on index: idx_sessions_range (account_id, session_date)
    let query = `
      SELECT s.*, g.name as group_name, g.color as group_color, g.workplace_id,
             (SELECT count(*) FROM attendance a WHERE a.session_id = s.id AND a.status = 'present') as present_count,
             (SELECT count(*) FROM attendance a WHERE a.session_id = s.id) as marked_count
      FROM sessions s
      JOIN groups g ON s.group_id = g.id
      WHERE s.account_id = ? AND s.session_date >= ? AND s.session_date <= ?
    `;
    const params: any[] = [accountId, fromDate, toDate];

    if (workplaceId) {
      query += ' AND g.workplace_id = ?';
      params.push(workplaceId);
    }
    if (groupId) {
      query += ' AND s.group_id = ?';
      params.push(groupId);
    }

    query += ' ORDER BY s.session_date ASC, s.start_time ASC';

    const res = await this.db.prepare(query).bind(...params).all();
    console.log(`[Budget] GET /sessions (Today view) - rows_read: ${res.meta?.rows_read ?? 0}, rows_written: ${res.meta?.rows_written ?? 0}`);
    return res.results;
  }

  // For batch inserts during top-up
  async insertSessionsBatch(sessionsData: any[]) {
    if (sessionsData.length === 0) return 0;
    
    const stmts = sessionsData.map(s => {
      // Create session using INSERT OR IGNORE to maintain idempotency via uq_sessions_rule_slot
      return this.db.prepare(`
        INSERT OR IGNORE INTO sessions (
          id, account_id, group_id, rule_id, session_date, start_time, duration_min, tz, status, room, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?)
      `).bind(
        generateId(), s.accountId, s.groupId, s.ruleId, s.sessionDate, s.startTime, s.durationMin, s.tz, s.room || null, s.now, s.now
      );
    });

    const results = await this.db.batch(stmts);
    // Count how many were actually inserted (changes > 0)
    return results.reduce((sum: number, r: any) => sum + (r.meta.changes || 0), 0);
  }

  async deleteFutureScheduledFromRule(accountId: string, ruleId: string, fromDate: string) {
    // Delete non-exception scheduled sessions from a certain date (for rule edits/deletion)
    const { meta } = await this.db.prepare(
      `DELETE FROM sessions 
       WHERE account_id = ? AND rule_id = ? AND session_date >= ? AND status = 'scheduled' AND is_exception = 0`
    ).bind(accountId, ruleId, fromDate).run();
    return meta.changes;
  }
  
  async createOneOffSession(accountId: string, tz: string, data: z.infer<typeof CreateSessionSchema>) {
    const id = generateId();
    const now = new Date().toISOString();
    await this.db.prepare(
      `INSERT INTO sessions (
        id, account_id, group_id, session_date, start_time, duration_min, tz, status, room, is_exception, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, 1, ?, ?)`
    ).bind(
      id, accountId, data.groupId, data.sessionDate, data.startTime, data.durationMin, tz, data.room || null, now, now
    ).run();
    return this.getSession(accountId, id);
  }

  async setStatus(accountId: string, sessionId: string, status: string, isException = true) {
    const now = new Date().toISOString();
    await this.db.prepare(
      'UPDATE sessions SET status = ?, is_exception = ?, updated_at = ? WHERE account_id = ? AND id = ?'
    ).bind(status, isException ? 1 : 0, now, accountId, sessionId).run();
    return this.getSession(accountId, sessionId);
  }
}
