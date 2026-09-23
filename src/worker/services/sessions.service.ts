import { SessionsRepo } from '../repositories/sessions.repo';
import { generateSessionDates, getTopUpWindow } from '../../shared/scheduling/index';

export class SessionsService {
  constructor(
    private sessionsRepo: SessionsRepo
  ) {}

  /**
   * Generates missing sessions for all active rules within the rolling window.
   * Designed to be idempotent and called at most once per day per client.
   * @param accountId 
   * @param localToday YYYY-MM-DD representing "today" in the user's timezone
   * @returns number of sessions created
   */
  async topUp(accountId: string, localToday: string): Promise<number> {
    const rules = await this.sessionsRepo.listAllActiveRules(accountId);
    if (rules.length === 0) return 0;

    const sessionsToCreate: any[] = [];
    const now = new Date().toISOString();

    for (const rule of rules) {
      const window = getTopUpWindow(
        localToday,
        rule.starts_on as string,
        rule.ends_on as string | undefined,
        rule.term_ends_on as string | undefined
      );

      const weekdays = JSON.parse(rule.weekdays as string);
      const dates = generateSessionDates(weekdays, window.start, window.end);

      for (const date of dates) {
        sessionsToCreate.push({
          accountId,
          groupId: rule.group_id,
          ruleId: rule.id,
          sessionDate: date,
          startTime: rule.start_time,
          durationMin: rule.duration_min,
          tz: rule.tz,
          room: rule.room,
          now
        });
      }
    }

    // D1 db.batch accepts an array of statements, max 100 per batch.
    let totalInserted = 0;
    const batchSize = 100;
    
    for (let i = 0; i < sessionsToCreate.length; i += batchSize) {
      const chunk = sessionsToCreate.slice(i, i + batchSize);
      totalInserted += await this.sessionsRepo.insertSessionsBatch(chunk);
    }

    return totalInserted;
  }

  /**
   * Re-generates future sessions for a single rule after it has been edited.
   * Deletes non-exception scheduled sessions from `fromDate` onward, then generates new ones.
   */
  async regenerateForRule(accountId: string, ruleId: string, localToday: string): Promise<number> {
    const rule = await this.sessionsRepo.getRule(accountId, ruleId);
    if (!rule || rule.archived_at) return 0;

    // Delete future non-exception scheduled sessions
    await this.sessionsRepo.deleteFutureScheduledFromRule(accountId, ruleId, localToday);

    // We only regenerate this rule. We could just run topUp for all, but for efficiency:
    // We need the term_ends_on if this group has a term. 
    // Instead of duplicating logic, let's just trigger a full topUp. 
    // The spec says "client calls top-up... after rule changes".
    // Wait, the client calls it, so we can just let the client do it, 
    // but doing it synchronously ensures consistency before the client fetches Today.
    // Let's just do a full topUp here. It's idempotent and fast.
    return this.topUp(accountId, localToday);
  }
}
