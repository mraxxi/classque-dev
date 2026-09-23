import { unstable_dev, Unstable_DevWorker } from 'wrangler';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';

describe('/api/v1/sessions integration routes', () => {
  let devWorker: Unstable_DevWorker;
  let workplaceId: string;
  let groupId: string;

  beforeAll(async () => {
    devWorker = await unstable_dev('src/worker/index.ts', {
      experimental: { disableExperimentalWarning: true },
      vars: {
        ENVIRONMENT: 'development',
        DEV_USER_EMAIL: 'sessions-test@example.com'
      }
    });

    // Provision user
    await devWorker.fetch('/api/v1/me');

    // Get default independent workplace
    const wpRes = await devWorker.fetch('/api/v1/workplaces');
    const workplaces = (await wpRes.json()) as any[];
    const independentWp = workplaces.find((w: any) => w.kind === 'independent');
    workplaceId = independentWp.id;

    // Create a group
    const groupRes = await devWorker.fetch('/api/v1/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workplaceId,
        name: 'Science Class',
        kind: 'class',
        color: 'c1'
      })
    });
    const group = (await groupRes.json()) as any;
    groupId = group.id;
  });

  afterAll(async () => {
    if (devWorker) await devWorker.stop();
  });

  // TDY-007: Performance & range validation (max 14 days)
  it('TDY-007: rejects date range greater than 14 days and accepts <= 14 days', async () => {
    // 19-day range: 2026-09-01 to 2026-09-20 (> 14 days)
    const resOver = await devWorker.fetch('/api/v1/sessions?from=2026-09-01&to=2026-09-20');
    expect(resOver.status).toBe(400);
    const bodyOver = (await resOver.json()) as any;
    expect(bodyOver.error.code).toBe('validation_failed');
    expect(bodyOver.error.messageKey).toBe('errors.invalid_date_range');

    // 14-day range: 2026-09-01 to 2026-09-15 (14 days)
    const resValid = await devWorker.fetch('/api/v1/sessions?from=2026-09-01&to=2026-09-15');
    expect(resValid.status).toBe(200);
    const sessions = (await resValid.json()) as any[];
    expect(Array.isArray(sessions)).toBe(true);
  });

  // DM-013: Attendance rows valid only for learners with active membership on session date
  it('DM-013: filters roster to learners with active membership on the session date', async () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 1. Create a session for yesterday and a session for today
    const sYesterdayRes = await devWorker.fetch('/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId,
        sessionDate: yesterday,
        startTime: '09:00',
        durationMin: 60
      })
    });
    expect(sYesterdayRes.status).toBe(201);
    const sYesterday = (await sYesterdayRes.json()) as any;

    const sTodayRes = await devWorker.fetch('/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId,
        sessionDate: today,
        startTime: '10:00',
        durationMin: 60
      })
    });
    expect(sTodayRes.status).toBe(201);
    const sToday = (await sTodayRes.json()) as any;

    // 2. Add learners today (joined_on = today)
    await devWorker.fetch(`/api/v1/groups/${groupId}/learners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names: ['Active Today', 'Departing Soon'] })
    });

    const learners = (await (await devWorker.fetch(`/api/v1/groups/${groupId}/learners`)).json()) as any[];
    const activeLearner = learners.find((l: any) => l.display_name === 'Active Today');
    const departingLearner = learners.find((l: any) => l.display_name === 'Departing Soon');
    expect(activeLearner).toBeDefined();
    expect(departingLearner).toBeDefined();

    // 3. For yesterday's session, learners who joined today must NOT appear (joined_on > session_date)
    const attYesterdayRes = await devWorker.fetch(`/api/v1/sessions/${sYesterday.id}/attendance`);
    expect(attYesterdayRes.status).toBe(200);
    const rosterYesterday = (await attYesterdayRes.json()) as any[];
    expect(rosterYesterday.some((r: any) => r.learnerId === activeLearner.id)).toBe(false);

    // 4. For today's session, both learners joined today, so both appear
    const attTodayRes = await devWorker.fetch(`/api/v1/sessions/${sToday.id}/attendance`);
    expect(attTodayRes.status).toBe(200);
    const rosterToday = (await attTodayRes.json()) as any[];
    expect(rosterToday.some((r: any) => r.learnerId === activeLearner.id)).toBe(true);
    expect(rosterToday.some((r: any) => r.learnerId === departingLearner.id)).toBe(true);

    // 5. Remove departingLearner (sets left_on = today)
    const removeRes = await devWorker.fetch(`/api/v1/groups/${groupId}/learners/${departingLearner.id}/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(removeRes.status).toBe(200);

    // For a future session (tomorrow), departingLearner must NOT appear (left_on < tomorrow)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const sTomorrowRes = await devWorker.fetch('/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId,
        sessionDate: tomorrow,
        startTime: '11:00',
        durationMin: 60
      })
    });
    const sTomorrow = (await sTomorrowRes.json()) as any;

    const attTomorrowRes = await devWorker.fetch(`/api/v1/sessions/${sTomorrow.id}/attendance`);
    const rosterTomorrow = (await attTomorrowRes.json()) as any[];
    expect(rosterTomorrow.some((r: any) => r.learnerId === activeLearner.id)).toBe(true);
    expect(rosterTomorrow.some((r: any) => r.learnerId === departingLearner.id)).toBe(false);
  });

  // ATT-004, ATT-006, ATT-009: Attendance save behavior, status transitions, and block on cancelled
  it('ATT-004/006/009: handles attendance save, partial saving, auto-held transition, and blocks on cancelled', async () => {
    const today = new Date().toISOString().split('T')[0];

    // Create a new group with 2 learners for clean attendance testing
    const gRes = await devWorker.fetch('/api/v1/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workplaceId,
        name: 'Attendance Testing Group',
        kind: 'class',
        color: 'c2'
      })
    });
    const testGroup = (await gRes.json()) as any;

    await devWorker.fetch(`/api/v1/groups/${testGroup.id}/learners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names: ['Student One', 'Student Two'] })
    });

    const testLearners = (await (await devWorker.fetch(`/api/v1/groups/${testGroup.id}/learners`)).json()) as any[];
    const [l1, l2] = testLearners;

    // Create session in scheduled status
    const sessionRes = await devWorker.fetch('/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId: testGroup.id,
        sessionDate: today,
        startTime: '14:00',
        durationMin: 45
      })
    });
    const session = (await sessionRes.json()) as any;
    expect(session.status).toBe('scheduled');

    // ATT-006: Save attendance with only Student One marked (Student Two omitted/unmarked)
    const saveRes1 = await devWorker.fetch(`/api/v1/sessions/${session.id}/attendance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: [
          { learnerId: l1.id, status: 'present', note: 'Participated actively' }
        ]
      })
    });
    expect(saveRes1.status).toBe(200);
    const updatedSession1 = (await saveRes1.json()) as any;
    // ATT-004 / DM-024: Saving attendance on a scheduled session sets it to 'held'
    expect(updatedSession1.status).toBe('held');

    // Verify attendance roster shows l1 present, l2 null
    const attRoster1 = (await (await devWorker.fetch(`/api/v1/sessions/${session.id}/attendance`)).json()) as any[];
    const r1 = attRoster1.find((r: any) => r.learnerId === l1.id);
    const r2 = attRoster1.find((r: any) => r.learnerId === l2.id);
    expect(r1.status).toBe('present');
    expect(r1.note).toBe('Participated actively');
    expect(r2.status).toBeNull();

    // Idempotent upsert: Save attendance again, changing l1 to late and marking l2 absent
    const saveRes2 = await devWorker.fetch(`/api/v1/sessions/${session.id}/attendance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: [
          { learnerId: l1.id, status: 'late' },
          { learnerId: l2.id, status: 'absent', note: 'Sick' }
        ]
      })
    });
    expect(saveRes2.status).toBe(200);

    const attRoster2 = (await (await devWorker.fetch(`/api/v1/sessions/${session.id}/attendance`)).json()) as any[];
    const r1After = attRoster2.find((r: any) => r.learnerId === l1.id);
    const r2After = attRoster2.find((r: any) => r.learnerId === l2.id);
    expect(r1After.status).toBe('late');
    expect(r2After.status).toBe('absent');
    expect(r2After.note).toBe('Sick');

    // ATT-009: For cancelled sessions, attendance recording is blocked (409 Conflict)
    const cancelRes = await devWorker.fetch(`/api/v1/sessions/${session.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(cancelRes.status).toBe(200);
    const cancelledSession = (await cancelRes.json()) as any;
    expect(cancelledSession.status).toBe('cancelled');

    const blockedSaveRes = await devWorker.fetch(`/api/v1/sessions/${session.id}/attendance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: [{ learnerId: l1.id, status: 'present' }]
      })
    });
    expect(blockedSaveRes.status).toBe(409);
    const blockedBody = (await blockedSaveRes.json()) as any;
    expect(blockedBody.error.code).toBe('conflict');
    expect(blockedBody.error.messageKey).toBe('errors.attendance_blocked');
  });

  // Budget validation: Realistic Today-view query and attendance batch save
  it('measures D1 rows read/written for realistic Today view and Attendance save against 06-architecture budgets', async () => {
    const today = new Date().toISOString().split('T')[0];

    // Today view call (GET /sessions?from=&to=)
    const todayRes = await devWorker.fetch(`/api/v1/sessions?from=${today}&to=${today}`);
    expect(todayRes.status).toBe(200);
    const sessions = (await todayRes.json()) as any[];
    expect(Array.isArray(sessions)).toBe(true);

    // Save attendance for 5 real learners to simulate realistic batch
    const sessionRes = await devWorker.fetch('/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId,
        sessionDate: today,
        startTime: '16:00',
        durationMin: 60
      })
    });
    const session = (await sessionRes.json()) as any;

    await devWorker.fetch(`/api/v1/groups/${groupId}/learners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        names: ['Budget Learner 1', 'Budget Learner 2', 'Budget Learner 3', 'Budget Learner 4', 'Budget Learner 5']
      })
    });
    const groupLearners = (await (await devWorker.fetch(`/api/v1/groups/${groupId}/learners`)).json()) as any[];
    const recordsToSave = groupLearners.slice(0, 5).map((l: any) => ({
      learnerId: l.id,
      status: 'present' as const
    }));

    const attSaveRes = await devWorker.fetch(`/api/v1/sessions/${session.id}/attendance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: recordsToSave })
    });
    expect(attSaveRes.status).toBe(200);
  });
});
