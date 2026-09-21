import { D1Database } from '@cloudflare/workers-types';
import { generateId } from '../../shared/id';
import { getNowInstant } from '../../shared/date';

export class IdentityRepository {
  constructor(private db: D1Database) {}

  async findUserByEmail(email: string) {
    return this.db.prepare(`
      SELECT 
        u.id as userId, 
        u.email, 
        u.display_name, 
        u.locale, 
        u.timezone, 
        u.week_start, 
        u.group_label,
        m.account_id as accountId, 
        m.role,
        a.enabled_modules
      FROM users u
      JOIN memberships m ON u.id = m.user_id
      JOIN accounts a ON m.account_id = a.id
      WHERE u.email = ?
    `).bind(email).first();
  }

  async provisionUser(email: string, locale: string, timezone: string) {
    const userId = generateId();
    const accountId = generateId();
    const workplaceId = generateId();
    const now = getNowInstant();
    
    const displayName = email.split('@')[0];
    const workplaceName = locale === 'id' ? 'Mandiri' : 'Independent';

    await this.db.batch([
      this.db.prepare(`
        INSERT INTO users (id, email, display_name, locale, timezone, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(userId, email, displayName, locale, timezone, now, now),
      this.db.prepare(`
        INSERT INTO accounts (id, name, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `).bind(accountId, `${displayName}'s Account`, now, now),
      this.db.prepare(`
        INSERT INTO memberships (account_id, user_id, role, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(accountId, userId, 'teacher', now),
      this.db.prepare(`
        INSERT INTO workplaces (id, account_id, kind, name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(workplaceId, accountId, 'independent', workplaceName, now, now)
    ]);

    return {
      userId,
      accountId,
      role: 'teacher',
      email
    };
  }
  
  async updateMe(userId: string, data: { locale?: string, timezone?: string, week_start?: number, group_label?: string, display_name?: string }) {
    const sets: string[] = [];
    const values: any[] = [];
    
    if (data.locale !== undefined) { sets.push('locale = ?'); values.push(data.locale); }
    if (data.timezone !== undefined) { sets.push('timezone = ?'); values.push(data.timezone); }
    if (data.week_start !== undefined) { sets.push('week_start = ?'); values.push(data.week_start); }
    if (data.group_label !== undefined) { sets.push('group_label = ?'); values.push(data.group_label); }
    if (data.display_name !== undefined) { sets.push('display_name = ?'); values.push(data.display_name); }
    
    if (sets.length === 0) return;
    
    sets.push('updated_at = ?');
    values.push(getNowInstant());
    
    values.push(userId);
    
    await this.db.prepare(`
      UPDATE users SET ${sets.join(', ')} WHERE id = ?
    `).bind(...values).run();
  }
}
