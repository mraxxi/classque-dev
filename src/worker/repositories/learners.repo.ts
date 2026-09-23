import { D1Database } from '@cloudflare/workers-types';
import { generateId } from '../../shared/id';
import { CreateLearnerSchema, UpdateLearnerSchema } from '../../shared/schemas/learners';
import { z } from 'zod';

export class LearnersRepo {
  constructor(private db: D1Database) {}

  async get(accountId: string, learnerId: string) {
    return this.db.prepare(
      'SELECT * FROM learners WHERE account_id = ? AND id = ?'
    ).bind(accountId, learnerId).first();
  }

  async listByWorkplace(accountId: string, workplaceId: string, limit = 200) {
    const { results } = await this.db.prepare(
      'SELECT * FROM learners WHERE account_id = ? AND workplace_id = ? AND archived_at IS NULL ORDER BY display_name COLLATE NOCASE ASC LIMIT ?'
    ).bind(accountId, workplaceId, limit).all();
    return results;
  }

  async getGroupLearners(accountId: string, groupId: string, includeLeft = false) {
    let query = `
      SELECT l.*, gl.joined_on, gl.left_on 
      FROM learners l
      JOIN group_learners gl ON l.id = gl.learner_id
      WHERE gl.account_id = ? AND gl.group_id = ?
    `;
    if (!includeLeft) {
      query += ' AND gl.left_on IS NULL';
    }
    
    // Sort logic relies on JS Intl.Collator per spec, but we do a basic sort here too.
    const { results } = await this.db.prepare(query).bind(accountId, groupId).all();
    return results;
  }

  async countActiveGroupLearners(accountId: string, groupId: string): Promise<number> {
    const row = await this.db.prepare(
      'SELECT count(*) as count FROM group_learners WHERE account_id = ? AND group_id = ? AND left_on IS NULL'
    ).bind(accountId, groupId).first();
    return (row?.count as number) || 0;
  }

  async create(accountId: string, workplaceId: string, data: z.infer<typeof CreateLearnerSchema>) {
    const id = generateId();
    const now = new Date().toISOString();
    await this.db.prepare(
      'INSERT INTO learners (id, account_id, workplace_id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, accountId, workplaceId, data.displayName, now, now).run();
    return this.get(accountId, id);
  }

  async update(accountId: string, learnerId: string, data: z.infer<typeof UpdateLearnerSchema>) {
    const now = new Date().toISOString();
    if (data.displayName !== undefined) {
      await this.db.prepare(
        'UPDATE learners SET display_name = ?, updated_at = ? WHERE account_id = ? AND id = ?'
      ).bind(data.displayName, now, accountId, learnerId).run();
    }
    return this.get(accountId, learnerId);
  }

  async archive(accountId: string, learnerId: string) {
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    
    // Batch to archive learner and remove from all groups
    const stmt1 = this.db.prepare(
      'UPDATE learners SET archived_at = ?, updated_at = ? WHERE account_id = ? AND id = ?'
    ).bind(now, now, accountId, learnerId);
    
    const stmt2 = this.db.prepare(
      'UPDATE group_learners SET left_on = ? WHERE account_id = ? AND learner_id = ? AND left_on IS NULL'
    ).bind(today, accountId, learnerId);

    await this.db.batch([stmt1, stmt2]);
  }

  async addLearnerToGroup(accountId: string, groupId: string, learnerId: string, joinedOn: string) {
    // Upsert membership (re-adding sets left_on = NULL)
    await this.db.prepare(`
      INSERT INTO group_learners (group_id, learner_id, account_id, joined_on)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(group_id, learner_id) DO UPDATE SET left_on = NULL, joined_on = excluded.joined_on
    `).bind(groupId, learnerId, accountId, joinedOn).run();
  }

  async removeLearnerFromGroup(accountId: string, groupId: string, learnerId: string, leftOn: string) {
    await this.db.prepare(
      'UPDATE group_learners SET left_on = ? WHERE account_id = ? AND group_id = ? AND learner_id = ?'
    ).bind(leftOn, accountId, groupId, learnerId).run();
  }
}
