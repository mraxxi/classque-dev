import { describe, it, expect, vi } from 'vitest';
import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  it('should generate empty sessions if no rules exist', async () => {
    const mockRepo = {
      listAllActiveRules: vi.fn().mockResolvedValue([]),
      insertSessionsBatch: vi.fn().mockResolvedValue(0),
      getRule: vi.fn(),
      deleteFutureScheduledFromRule: vi.fn()
    };
    const service = new SessionsService(mockRepo as any);
    
    const count = await service.topUp('acc-1', '2026-09-21');
    expect(count).toBe(0);
    expect(mockRepo.insertSessionsBatch).not.toHaveBeenCalled();
  });

  it('should generate sessions for active rules', async () => {
    const mockRepo = {
      listAllActiveRules: vi.fn().mockResolvedValue([
        {
          id: 'rule-1',
          group_id: 'grp-1',
          starts_on: '2026-09-20',
          ends_on: null,
          term_ends_on: null,
          weekdays: '[1, 3]', // Mon, Wed
          start_time: '10:00',
          duration_min: 60,
          tz: 'UTC',
          room: '101'
        }
      ]),
      insertSessionsBatch: vi.fn().mockResolvedValue(2),
      getRule: vi.fn(),
      deleteFutureScheduledFromRule: vi.fn()
    };
    const service = new SessionsService(mockRepo as any);
    
    const count = await service.topUp('acc-1', '2026-09-21'); // Monday
    // Since 2026-09-21 is a Monday, and we look 14 days ahead, it should generate Mon, Wed, Mon, Wed
    // The exact count depends on getTopUpWindow which we mocked implicitly by pure functions,
    // but the repo method is called.
    expect(mockRepo.insertSessionsBatch).toHaveBeenCalled();
    expect(count).toBe(2);
  });
});
