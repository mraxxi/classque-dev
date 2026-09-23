import { generateId } from '../../shared/id';
import type { CreatePlanInput, UpdatePlanInput, QueryPlansInput } from '../../shared/schemas/plans';

export interface PlanRow {
  id: string;
  account_id: string;
  pack_id: string;
  pack_version: number;
  title: string;
  content: string; // JSON
  visibility: string;
  source_plan_id: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  used_count: number;
}

export class PlansRepo {
  constructor(private db: any) {}

  async listPlans(accountId: string, options: QueryPlansInput): Promise<PlanRow[]> {
    const conditions: string[] = ['p.account_id = ?'];
    const params: any[] = [accountId];

    if (!options.includeArchived) {
      conditions.push('p.archived_at IS NULL');
    }

    if (options.packId) {
      conditions.push('p.pack_id = ?');
      params.push(options.packId);
    }

    if (options.q) {
      conditions.push('p.title LIKE ?');
      params.push(`%${options.q.trim()}%`);
    }

    if (options.cursor) {
      // Cursor format: ISOString_id
      const [cursorUpdated, cursorId] = options.cursor.split('_');
      if (cursorUpdated && cursorId) {
        conditions.push('(p.updated_at < ? OR (p.updated_at = ? AND p.id < ?))');
        params.push(cursorUpdated, cursorUpdated, cursorId);
      }
    }

    const limit = options.limit || 50;
    params.push(limit);

    // Single query with correlated subquery relying on idx_sessions_plan(account_id, plan_id)
    const sql = `
      SELECT p.*,
        (SELECT COUNT(*) FROM sessions s WHERE s.account_id = p.account_id AND s.plan_id = p.id) AS used_count
      FROM plans p
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.updated_at DESC, p.id DESC
      LIMIT ?
    `;

    const { results } = await this.db.prepare(sql).bind(...params).all();
    return results || [];
  }

  async getPlan(accountId: string, id: string): Promise<PlanRow | null> {
    const sql = `
      SELECT p.*,
        (SELECT COUNT(*) FROM sessions s WHERE s.account_id = p.account_id AND s.plan_id = p.id) AS used_count
      FROM plans p
      WHERE p.account_id = ? AND p.id = ?
    `;
    const plan = await this.db.prepare(sql).bind(accountId, id).first();
    return plan || null;
  }

  async createPlan(accountId: string, data: CreatePlanInput, packVersion: number): Promise<PlanRow> {
    const id = generateId();
    const now = new Date().toISOString();
    const contentJson = typeof data.content === 'string' ? data.content : JSON.stringify(data.content || {});

    await this.db.prepare(`
      INSERT INTO plans (id, account_id, pack_id, pack_version, title, content, visibility, source_plan_id, archived_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'private', NULL, NULL, ?, ?)
    `).bind(
      id,
      accountId,
      data.packId,
      packVersion,
      data.title,
      contentJson,
      now,
      now
    ).run();

    return (await this.getPlan(accountId, id))!;
  }

  async updatePlan(accountId: string, id: string, data: UpdatePlanInput): Promise<PlanRow | null> {
    const existing = await this.getPlan(accountId, id);
    if (!existing) return null;

    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [new Date().toISOString()];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }

    if (data.content !== undefined) {
      updates.push('content = ?');
      params.push(typeof data.content === 'string' ? data.content : JSON.stringify(data.content));
    }

    params.push(accountId, id);

    await this.db.prepare(`
      UPDATE plans SET ${updates.join(', ')} WHERE account_id = ? AND id = ?
    `).bind(...params).run();

    return await this.getPlan(accountId, id);
  }

  async duplicatePlan(accountId: string, id: string, titleSuffix: string): Promise<PlanRow | null> {
    const original = await this.getPlan(accountId, id);
    if (!original) return null;

    const newId = generateId();
    const now = new Date().toISOString();
    // PLN-004: title suffix "{title} (copy)"
    const newTitle = titleSuffix.includes('{{title}}')
      ? titleSuffix.replace('{{title}}', original.title)
      : `${original.title} (copy)`;

    await this.db.prepare(`
      INSERT INTO plans (id, account_id, pack_id, pack_version, title, content, visibility, source_plan_id, archived_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'private', ?, NULL, ?, ?)
    `).bind(
      newId,
      accountId,
      original.pack_id,
      original.pack_version,
      newTitle,
      original.content,
      original.id,
      now,
      now
    ).run();

    return (await this.getPlan(accountId, newId))!;
  }

  async archivePlan(accountId: string, id: string): Promise<PlanRow | null> {
    const now = new Date().toISOString();
    await this.db.prepare(`
      UPDATE plans SET archived_at = ?, updated_at = ? WHERE account_id = ? AND id = ?
    `).bind(now, now, accountId, id).run();

    return await this.getPlan(accountId, id);
  }

  async restorePlan(accountId: string, id: string): Promise<PlanRow | null> {
    const now = new Date().toISOString();
    await this.db.prepare(`
      UPDATE plans SET archived_at = NULL, updated_at = ? WHERE account_id = ? AND id = ?
    `).bind(now, accountId, id).run();

    return await this.getPlan(accountId, id);
  }
}
