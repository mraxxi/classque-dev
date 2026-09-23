import { generateId } from '../../shared/id';
import type { CreateNoteInput, QueryNotesInput } from '../../shared/schemas/notes';

export interface NoteRow {
  id: string;
  account_id: string;
  session_id: string | null;
  group_id: string | null;
  learner_id: string | null;
  body: string;
  visibility: string;
  created_at: string;
  updated_at: string;
  group_name?: string | null;
  learner_name?: string | null;
  session_date?: string | null;
  start_time?: string | null;
}

export class NotesRepo {
  constructor(private db: any) {}

  async listNotes(accountId: string, options: QueryNotesInput): Promise<NoteRow[]> {
    const conditions: string[] = ['n.account_id = ?'];
    const params: any[] = [accountId];

    if (options.learnerId) {
      conditions.push('n.learner_id = ?');
      params.push(options.learnerId);
    }

    if (options.groupId) {
      conditions.push('n.group_id = ?');
      params.push(options.groupId);
    }

    if (options.sessionId) {
      conditions.push('n.session_id = ?');
      params.push(options.sessionId);
    }

    if (options.cursor) {
      const [cursorCreated, cursorId] = options.cursor.split('_');
      if (cursorCreated && cursorId) {
        conditions.push('(n.created_at < ? OR (n.created_at = ? AND n.id < ?))');
        params.push(cursorCreated, cursorCreated, cursorId);
      }
    }

    const limit = options.limit || 50;
    params.push(limit);

    const sql = `
      SELECT n.*,
             g.name AS group_name,
             l.display_name AS learner_name,
             s.session_date,
             s.start_time
      FROM notes n
      LEFT JOIN groups g ON g.id = n.group_id AND g.account_id = n.account_id
      LEFT JOIN learners l ON l.id = n.learner_id AND l.account_id = n.account_id
      LEFT JOIN sessions s ON s.id = n.session_id AND s.account_id = n.account_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY n.created_at DESC, n.id DESC
      LIMIT ?
    `;

    const { results } = await this.db.prepare(sql).bind(...params).all();
    return results || [];
  }

  async getNote(accountId: string, id: string): Promise<NoteRow | null> {
    const sql = `
      SELECT n.*,
             g.name AS group_name,
             l.display_name AS learner_name,
             s.session_date,
             s.start_time
      FROM notes n
      LEFT JOIN groups g ON g.id = n.group_id AND g.account_id = n.account_id
      LEFT JOIN learners l ON l.id = n.learner_id AND l.account_id = n.account_id
      LEFT JOIN sessions s ON s.id = n.session_id AND s.account_id = n.account_id
      WHERE n.account_id = ? AND n.id = ?
    `;
    const note = await this.db.prepare(sql).bind(accountId, id).first();
    return note || null;
  }

  async createNote(accountId: string, data: CreateNoteInput): Promise<NoteRow> {
    const id = generateId();
    const now = new Date().toISOString();

    let groupId = data.groupId || null;
    const sessionId = data.sessionId || null;
    const learnerId = data.learnerId || null;

    const statements: any[] = [];

    // NOT-002: Adding from a Session sets session_id and that Session's group_id
    // NOT-005 / DM-023: Adding a Note to a Session sets that Session is_exception = 1
    if (sessionId) {
      const session = await this.db.prepare(
        'SELECT group_id FROM sessions WHERE account_id = ? AND id = ?'
      ).bind(accountId, sessionId).first();

      if (session && !groupId) {
        groupId = session.group_id;
      }

      // Mark session exception
      statements.push(
        this.db.prepare('UPDATE sessions SET is_exception = 1, updated_at = ? WHERE account_id = ? AND id = ?')
          .bind(now, accountId, sessionId)
      );
    }

    // Insert statement
    statements.push(
      this.db.prepare(`
        INSERT INTO notes (id, account_id, session_id, group_id, learner_id, body, visibility, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'private', ?, ?)
      `).bind(
        id,
        accountId,
        sessionId,
        groupId,
        learnerId,
        data.body,
        now,
        now
      )
    );

    if (statements.length > 1) {
      await this.db.batch(statements);
    } else {
      await statements[0].run();
    }

    return (await this.getNote(accountId, id))!;
  }

  async updateNote(accountId: string, id: string, body: string): Promise<NoteRow | null> {
    const now = new Date().toISOString();
    await this.db.prepare(`
      UPDATE notes SET body = ?, updated_at = ? WHERE account_id = ? AND id = ?
    `).bind(body, now, accountId, id).run();

    return await this.getNote(accountId, id);
  }

  async deleteNote(accountId: string, id: string): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM notes WHERE account_id = ? AND id = ?
    `).bind(accountId, id).run();

    return (result.meta?.changes ?? 0) > 0;
  }
}
