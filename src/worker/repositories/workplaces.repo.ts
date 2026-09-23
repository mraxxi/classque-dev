import { D1Database } from '@cloudflare/workers-types';
import { generateId } from '../../shared/id';
import { CreateWorkplaceSchema, UpdateWorkplaceSchema, CreateTermSchema, UpdateTermSchema } from '../../shared/schemas/workplaces';
import { z } from 'zod';

export class WorkplacesRepo {
  constructor(private db: D1Database) {}

  async list(accountId: string, includeArchived = false) {
    let query = 'SELECT * FROM workplaces WHERE account_id = ?';
    if (!includeArchived) {
      query += ' AND archived_at IS NULL';
    }
    query += ' ORDER BY created_at ASC';
    
    const { results } = await this.db.prepare(query).bind(accountId).all();
    return results;
  }

  async get(accountId: string, workplaceId: string) {
    return this.db.prepare(
      'SELECT * FROM workplaces WHERE account_id = ? AND id = ?'
    ).bind(accountId, workplaceId).first();
  }

  async countActive(accountId: string): Promise<number> {
    const row = await this.db.prepare(
      'SELECT count(*) as count FROM workplaces WHERE account_id = ? AND archived_at IS NULL'
    ).bind(accountId).first();
    return (row?.count as number) || 0;
  }

  async create(accountId: string, data: z.infer<typeof CreateWorkplaceSchema>) {
    const id = generateId();
    const now = new Date().toISOString();
    await this.db.prepare(
      'INSERT INTO workplaces (id, account_id, kind, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, accountId, data.kind, data.name, now, now).run();
    return this.get(accountId, id);
  }

  async update(accountId: string, workplaceId: string, data: z.infer<typeof UpdateWorkplaceSchema>) {
    const now = new Date().toISOString();
    await this.db.prepare(
      'UPDATE workplaces SET name = ?, updated_at = ? WHERE account_id = ? AND id = ?'
    ).bind(data.name, now, accountId, workplaceId).run();
    return this.get(accountId, workplaceId);
  }

  async countActiveGroups(accountId: string, workplaceId: string): Promise<number> {
    const row = await this.db.prepare(
      'SELECT count(*) as count FROM groups WHERE account_id = ? AND workplace_id = ? AND archived_at IS NULL'
    ).bind(accountId, workplaceId).first();
    return (row?.count as number) || 0;
  }

  async archive(accountId: string, workplaceId: string) {
    const now = new Date().toISOString();
    await this.db.prepare(
      'UPDATE workplaces SET archived_at = ?, updated_at = ? WHERE account_id = ? AND id = ?'
    ).bind(now, now, accountId, workplaceId).run();
  }

  async restore(accountId: string, workplaceId: string) {
    const now = new Date().toISOString();
    await this.db.prepare(
      'UPDATE workplaces SET archived_at = NULL, updated_at = ? WHERE account_id = ? AND id = ?'
    ).bind(now, accountId, workplaceId).run();
  }
}

export class TermsRepo {
  constructor(private db: D1Database) {}

  async list(accountId: string, workplaceId: string, includeArchived = false) {
    let query = 'SELECT * FROM terms WHERE account_id = ? AND workplace_id = ?';
    if (!includeArchived) {
      query += ' AND archived_at IS NULL';
    }
    query += ' ORDER BY starts_on ASC';
    
    const { results } = await this.db.prepare(query).bind(accountId, workplaceId).all();
    return results;
  }

  async get(accountId: string, termId: string) {
    return this.db.prepare(
      'SELECT * FROM terms WHERE account_id = ? AND id = ?'
    ).bind(accountId, termId).first();
  }

  async create(accountId: string, workplaceId: string, data: z.infer<typeof CreateTermSchema>) {
    const id = generateId();
    const now = new Date().toISOString();
    await this.db.prepare(
      'INSERT INTO terms (id, account_id, workplace_id, name, starts_on, ends_on, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, accountId, workplaceId, data.name, data.startsOn, data.endsOn, now, now).run();
    return this.get(accountId, id);
  }

  async update(accountId: string, termId: string, data: z.infer<typeof UpdateTermSchema>) {
    const now = new Date().toISOString();
    
    // Dynamically build the update query based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.startsOn !== undefined) {
      updates.push('starts_on = ?');
      values.push(data.startsOn);
    }
    if (data.endsOn !== undefined) {
      updates.push('ends_on = ?');
      values.push(data.endsOn);
    }
    
    if (updates.length === 0) return this.get(accountId, termId);

    updates.push('updated_at = ?');
    values.push(now);

    const query = `UPDATE terms SET ${updates.join(', ')} WHERE account_id = ? AND id = ?`;
    await this.db.prepare(query).bind(...values, accountId, termId).run();
    
    return this.get(accountId, termId);
  }

  async archive(accountId: string, termId: string) {
    const now = new Date().toISOString();
    await this.db.prepare(
      'UPDATE terms SET archived_at = ?, updated_at = ? WHERE account_id = ? AND id = ?'
    ).bind(now, now, accountId, termId).run();
  }

  async restore(accountId: string, termId: string) {
    const now = new Date().toISOString();
    await this.db.prepare(
      'UPDATE terms SET archived_at = NULL, updated_at = ? WHERE account_id = ? AND id = ?'
    ).bind(now, accountId, termId).run();
  }
}
