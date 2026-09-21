import { D1Database } from '@cloudflare/workers-types';
import { SaveAttendanceSchema } from '../../shared/schemas/attendance';
import { z } from 'zod';

export class AttendanceRepo {
  constructor(private db: D1Database) {}

  async getSessionAttendance(accountId: string, sessionId: string) {
    const { results } = await this.db.prepare(
      'SELECT * FROM attendance WHERE account_id = ? AND session_id = ?'
    ).bind(accountId, sessionId).all();
    return results;
  }

  async saveBatch(accountId: string, sessionId: string, data: z.infer<typeof SaveAttendanceSchema>) {
    const now = new Date().toISOString();
    if (data.records.length === 0) return 0;

    const stmts = data.records.map(r => {
      return this.db.prepare(`
        INSERT INTO attendance (session_id, learner_id, account_id, status, note, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id, learner_id) DO UPDATE SET 
          status = excluded.status, 
          note = excluded.note, 
          updated_at = excluded.updated_at
      `).bind(sessionId, r.learnerId, accountId, r.status, r.note || null, now);
    });

    const results = await this.db.batch(stmts);
    return results.reduce((sum: number, r: any) => sum + (r.meta.changes || 0), 0);
  }

  async getSummary(accountId: string, groupId: string, fromDate: string, toDate: string) {
    // ATT-007 summary query. Joins sessions to limit by date.
    // Returns counts per learner.
    const query = `
      SELECT a.learner_id,
             SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
             SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late,
             SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent,
             SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused
      FROM attendance a
      JOIN sessions s ON a.session_id = s.id
      WHERE a.account_id = ? AND s.group_id = ? AND s.session_date >= ? AND s.session_date <= ?
      GROUP BY a.learner_id
    `;
    const { results } = await this.db.prepare(query).bind(accountId, groupId, fromDate, toDate).all();
    return results;
  }
}
