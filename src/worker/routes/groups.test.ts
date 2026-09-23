import { unstable_dev, Unstable_DevWorker } from 'wrangler';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';

describe('/api/v1/groups integration routes', () => {
  let devWorker: Unstable_DevWorker;
  let defaultWorkplaceId: string;
  let institutionWorkplaceId: string;
  let institutionTermId: string;

  beforeAll(async () => {
    devWorker = await unstable_dev('src/worker/index.ts', {
      experimental: { disableExperimentalWarning: true },
      vars: {
        ENVIRONMENT: 'development',
        DEV_USER_EMAIL: 'groups-test@example.com'
      }
    });

    // Provision user & default independent workplace
    const meRes = await devWorker.fetch('/api/v1/me');
    expect(meRes.status).toBe(200);

    // Get workplaces to find the default independent workplace
    const wpRes = await devWorker.fetch('/api/v1/workplaces');
    const workplaces = (await wpRes.json()) as any[];
    const independentWp = workplaces.find((w: any) => w.kind === 'independent');
    expect(independentWp).toBeDefined();
    defaultWorkplaceId = independentWp.id;

    // Create an institution workplace and a term under it
    const createWpRes = await devWorker.fetch('/api/v1/workplaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'institution',
        name: 'Springfield Academy'
      })
    });
    const instWp = (await createWpRes.json()) as any;
    institutionWorkplaceId = instWp.id;

    const createTermRes = await devWorker.fetch(`/api/v1/workplaces/${institutionWorkplaceId}/terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Fall Term 2026',
        startsOn: '2026-09-01',
        endsOn: '2026-12-20'
      })
    });
    expect(createTermRes.status).toBe(201);
    const term = (await createTermRes.json()) as any;
    institutionTermId = term.id;
    expect(institutionTermId).toBeDefined();
  });

  afterAll(async () => {
    if (devWorker) await devWorker.stop();
  });

  // DM-011: term_id on a Group is allowed only when Workplace kind = 'institution'
  it('DM-011: rejects term on an independent-workplace Group', async () => {
    const res = await devWorker.fetch('/api/v1/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workplaceId: defaultWorkplaceId,
        name: 'Independent Piano Class',
        kind: 'class',
        color: 'c1',
        termId: institutionTermId
      })
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe('validation_failed');
    expect(body.error.messageKey).toBe('errors.term_not_allowed');
  });

  // DM-012: Individual groups only allow 1 active membership
  it('DM-012: rejects second Learner on an individual Group', async () => {
    // 1. Create individual group with initial learner
    const createGroupRes = await devWorker.fetch('/api/v1/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workplaceId: defaultWorkplaceId,
        name: 'Solo Flute',
        kind: 'individual',
        color: 'c1',
        learnerName: 'Alice Walker'
      })
    });
    expect(createGroupRes.status).toBe(201);
    const group = (await createGroupRes.json()) as any;

    // 2. Attempt to add a second learner
    const addLearnerRes = await devWorker.fetch(`/api/v1/groups/${group.id}/learners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        names: ['Bob Runner']
      })
    });

    expect(addLearnerRes.status).toBe(409);
    const body = (await addLearnerRes.json()) as any;
    expect(body.error.code).toBe('conflict');
    expect(body.error.messageKey).toBe('errors.individual_group_limit');
  });

  // LRN-008: A Group holds at most 100 active learners
  it('LRN-008: rejects adding learners exceeding the 100-active cap', async () => {
    const createGroupRes = await devWorker.fetch('/api/v1/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workplaceId: defaultWorkplaceId,
        name: 'Large Chorus',
        kind: 'class',
        color: 'c2'
      })
    });
    expect(createGroupRes.status).toBe(201);
    const group = (await createGroupRes.json()) as any;

    // Create array with 101 distinct learner names
    const names = Array.from({ length: 101 }, (_, i) => `Student ${i + 1}`);

    const addRes = await devWorker.fetch(`/api/v1/groups/${group.id}/learners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names })
    });

    expect(addRes.status).toBe(409);
    const body = (await addRes.json()) as any;
    expect(body.error.code).toBe('conflict');
    expect(body.error.messageKey).toBe('errors.group_learner_limit');
  });

  // LRN-002: Bulk add deduplication with duplicate-laden input
  it('LRN-002: deduplicates case-insensitively within paste and against existing roster', async () => {
    const createGroupRes = await devWorker.fetch('/api/v1/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workplaceId: defaultWorkplaceId,
        name: 'Math 101',
        kind: 'class',
        color: 'c3'
      })
    });
    expect(createGroupRes.status).toBe(201);
    const group = (await createGroupRes.json()) as any;

    // 1. Paste with leading/trailing whitespace, case variations, duplicates
    const duplicateLadenInput = [
      '  Emma Watson  ',
      'emma watson',
      'EMMA WATSON',
      'John Doe',
      ' john doe ',
      'JOHN DOE',
      'Sara Lee'
    ];

    const addRes = await devWorker.fetch(`/api/v1/groups/${group.id}/learners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names: duplicateLadenInput })
    });

    expect(addRes.status).toBe(200);
    const addBody = (await addRes.json()) as any;
    expect(addBody.added).toBe(3); // Only Emma Watson, John Doe, Sara Lee

    // Verify roster has exactly 3 learners
    const rosterRes = await devWorker.fetch(`/api/v1/groups/${group.id}/learners`);
    const roster = (await rosterRes.json()) as any[];
    expect(roster.length).toBe(3);
    const namesInRoster = roster.map((l: any) => l.display_name.toLowerCase());
    expect(namesInRoster).toContain('emma watson');
    expect(namesInRoster).toContain('john doe');
    expect(namesInRoster).toContain('sara lee');

    // 2. Second paste with duplicate against existing roster
    const secondPaste = ['EMMA WATSON', 'Alex Smith'];
    const addRes2 = await devWorker.fetch(`/api/v1/groups/${group.id}/learners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names: secondPaste })
    });

    expect(addRes2.status).toBe(200);
    const addBody2 = (await addRes2.json()) as any;
    expect(addBody2.added).toBe(1); // Only Alex Smith added

    const rosterRes2 = await devWorker.fetch(`/api/v1/groups/${group.id}/learners`);
    const roster2 = (await rosterRes2.json()) as any[];
    expect(roster2.length).toBe(4);
  });

  // DM-010: Cross-workplace learner addition rejected
  it('DM-010: rejects cross-workplace learner addition to group', async () => {
    // 1. Group in defaultWorkplaceId (Independent) with a learner
    const g1Res = await devWorker.fetch('/api/v1/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workplaceId: defaultWorkplaceId,
        name: 'Indy Group',
        kind: 'class',
        color: 'c4'
      })
    });
    const g1 = (await g1Res.json()) as any;

    await devWorker.fetch(`/api/v1/groups/${g1.id}/learners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names: ['Indy Student'] })
    });

    const g1Learners = (await (await devWorker.fetch(`/api/v1/groups/${g1.id}/learners`)).json()) as any[];
    expect(g1Learners.length).toBe(1);
    const indyLearnerId = g1Learners[0].id;

    // 2. Group in institutionWorkplaceId
    const g2Res = await devWorker.fetch('/api/v1/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workplaceId: institutionWorkplaceId,
        name: 'Academy Class',
        kind: 'class',
        color: 'c5'
      })
    });
    const g2 = (await g2Res.json()) as any;

    // 3. Attempt to add indyLearnerId (from defaultWorkplaceId) to g2 (in institutionWorkplaceId)
    const crossAddRes = await devWorker.fetch(`/api/v1/groups/${g2.id}/learners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learnerIds: [indyLearnerId] })
    });

    expect(crossAddRes.status).toBe(400);
    const crossBody = (await crossAddRes.json()) as any;
    expect(crossBody.error.code).toBe('validation_failed');
    expect(crossBody.error.messageKey).toBe('errors.cross_workplace_learner');
  });
});
