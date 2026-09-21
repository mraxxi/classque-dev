import { D1Database } from '@cloudflare/workers-types';
import { generateId } from '../../shared/id';
import { CreateGroupSchema, UpdateGroupSchema } from '../../shared/schemas/groups';
import { z } from 'zod';

export class GroupsRepo {
  constructor(private db: D1Database) {}

  async list(accountId: string, workplaceId?: string, includeArchived = false, limit = 50) {
    let query = 'SELECT * FROM groups WHERE account_id = ?';
    const params: any[] = [accountId];

    if (workplaceId) {
      query += ' AND workplace_id = ?';
      params.push(workplaceId);
    }
    if (!includeArchived) {
      query += ' AND archived_at IS NULL';
    }
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(Math.min(limit, 200));
    
    const { results } = await this.db.prepare(query).bind(...params).all();
    return results;
  }

  async get(accountId: string, groupId: string) {
    return this.db.prepare(
      'SELECT * FROM groups WHERE account_id = ? AND id = ?'
    ).bind(accountId, groupId).first();
  }

  async create(accountId: string, data: z.infer<typeof CreateGroupSchema>) {
    const id = generateId();
    const now = new Date().toISOString();
    await this.db.prepare(
      `INSERT INTO groups (
        id, account_id, workplace_id, term_id, kind, name, pack_id, pack_version, room, color, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, accountId, data.workplaceId, data.termId || null, data.kind, data.name,
      data.packId || 'generic', 1, data.room || null, data.color, now, now
    ).run();
    return this.get(accountId, id);
  }

  async update(accountId: string, groupId: string, data: z.infer<typeof UpdateGroupSchema>) {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.room !== undefined) {
      updates.push('room = ?');
      values.push(data.room || null);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      values.push(data.color);
    }
    if (data.termId !== undefined) {
      updates.push('term_id = ?');
      values.push(data.termId || null);
    }

    if (updates.length === 0) return this.get(accountId, groupId);

    updates.push('updated_at = ?');
    values.push(now);

    const query = `UPDATE groups SET ${updates.join(', ')} WHERE account_id = ? AND id = ?`;
    await this.db.prepare(query).bind(...values, accountId, groupId).run();
    
    return this.get(accountId, groupId);
  }

  async archive(accountId: string, groupId: string) {
    const now = new Date().toISOString();
    // This is part of the GRP-004 batched operation, but we'll expose a standalone for simplicity if needed,
    // though the service layer will likely construct a batch with schedule_rules and sessions.
    await this.db.prepare(
      'UPDATE groups SET archived_at = ?, updated_at = ? WHERE account_id = ? AND id = ?'
    ).bind(now, now, accountId, groupId).run();
  }

  async restore(accountId: string, groupId: string) {
    const now = new Date().toISOString();
    await this.db.prepare(
      'UPDATE groups SET archived_at = NULL, updated_at = ? WHERE account_id = ? AND id = ?'
    ).bind(now, accountId, groupId).run();
  }
}
