import { unstable_dev, Unstable_DevWorker } from 'wrangler';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';

describe('/api/v1/plans integration routes', () => {
  let devWorker: Unstable_DevWorker;
  let devWorkerForeign: Unstable_DevWorker;
  let workplaceId: string;
  let groupId: string;
  const sessionIds: string[] = [];

  beforeAll(async () => {
    devWorker = await unstable_dev('src/worker/index.ts', {
      experimental: { disableExperimentalWarning: true },
      vars: {
        ENVIRONMENT: 'development',
        DEV_USER_EMAIL: 'plans-test@example.com'
      }
    });

    devWorkerForeign = await unstable_dev('src/worker/index.ts', {
      experimental: { disableExperimentalWarning: true },
      vars: {
        ENVIRONMENT: 'development',
        DEV_USER_EMAIL: 'plans-foreign@example.com'
      }
    });

    // Provision users
    await devWorker.fetch('/api/v1/me');
    await devWorkerForeign.fetch('/api/v1/me');

    // Get workplace
    const wpRes = await devWorker.fetch('/api/v1/workplaces');
    const workplaces = (await wpRes.json()) as any[];
    workplaceId = workplaces[0].id;

    // Create group
    const groupRes = await devWorker.fetch('/api/v1/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workplaceId,
        name: 'English Class A',
        kind: 'class',
        color: 'c2'
      })
    });
    const group = (await groupRes.json()) as any;
    groupId = group.id;

    // Create 3 sessions for multi-session attachment testing (PLN-005)
    for (let i = 1; i <= 3; i++) {
      const sRes = await devWorker.fetch('/api/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          sessionDate: `2026-10-0${i}`,
          startTime: '10:00',
          durationMin: 60
        })
      });
      const s = (await sRes.json()) as any;
      sessionIds.push(s.id);
    }
  }, 30000);

  afterAll(async () => {
    if (devWorker) await devWorker.stop();
    if (devWorkerForeign) await devWorkerForeign.stop();
  });

  it('PLN-002: creates a generic plan and validates pack-driven content', async () => {
    const res = await devWorker.fetch('/api/v1/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Fractions Introduction',
        packId: 'generic',
        content: {
          objectives: ['Understand numerator and denominator'],
          activities: 'Direct instruction with paper folding',
          materials: ['Colored paper', 'Scissors'],
          notes: 'Prepare paper before class'
        }
      })
    });

    expect(res.status).toBe(201);
    const plan = (await res.json()) as any;
    expect(plan.id).toBeDefined();
    expect(plan.title).toBe('Fractions Introduction');
    expect(plan.pack_id).toBe('generic');
    expect(plan.visibility).toBe('private'); // PLN-007
    expect(plan.used_count).toBe(0);

    const content = JSON.parse(plan.content);
    expect(content.objectives).toEqual(['Understand numerator and denominator']);
  });

  it('PLN-002: creates an english plan with vocabulary pairs', async () => {
    const res = await devWorker.fetch('/api/v1/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Travel Vocabulary',
        packId: 'english',
        content: {
          objectives: ['Learn 5 airport terms'],
          vocabulary: [
            { term: 'boarding pass', definition: 'Document giving permission to board' },
            { term: 'gate', definition: 'Departure area' }
          ]
        }
      })
    });

    expect(res.status).toBe(201);
    const plan = (await res.json()) as any;
    expect(plan.pack_id).toBe('english');
    const content = JSON.parse(plan.content);
    expect(content.vocabulary).toHaveLength(2);
  });

  it('PLN-002: rejects invalid plan content for missing required sections', async () => {
    const res = await devWorker.fetch('/api/v1/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Invalid Plan',
        packId: 'generic',
        content: {
          activities: 'Activities without objectives'
        }
      })
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe('validation_failed');
  });

  it('PLN-001: lists plans with query, pack filter, and search', async () => {
    const res = await devWorker.fetch('/api/v1/plans?q=Fractions&packId=generic');
    expect(res.status).toBe(200);
    const plans = (await res.json()) as any[];
    expect(plans.length).toBeGreaterThan(0);
    expect(plans[0].title).toBe('Fractions Introduction');
  });

  it('PLN-004: duplicates a plan with {title} (copy) and sets source_plan_id', async () => {
    // First create a plan to duplicate
    const createRes = await devWorker.fetch('/api/v1/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Original Lesson',
        packId: 'generic',
        content: { objectives: ['Original objective'] }
      })
    });
    const original = (await createRes.json()) as any;

    const dupRes = await devWorker.fetch(`/api/v1/plans/${original.id}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(dupRes.status).toBe(201);
    const copy = (await dupRes.json()) as any;
    expect(copy.id).not.toBe(original.id);
    expect(copy.title).toBe('Original Lesson (copy)');
    expect(copy.source_plan_id).toBe(original.id);
    expect(copy.used_count).toBe(0);
  });

  it('PLN-006: archives and restores a plan', async () => {
    const createRes = await devWorker.fetch('/api/v1/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Plan to Archive',
        packId: 'generic',
        content: { objectives: ['Objective'] }
      })
    });
    const plan = (await createRes.json()) as any;

    // Archive
    const archRes = await devWorker.fetch(`/api/v1/plans/${plan.id}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(archRes.status).toBe(200);
    const archived = (await archRes.json()) as any;
    expect(archived.archived_at).not.toBeNull();

    // Default list hides archived
    const listRes = await devWorker.fetch('/api/v1/plans');
    const list = (await listRes.json()) as any[];
    expect(list.find((p: any) => p.id === plan.id)).toBeUndefined();

    // With includeArchived=true it appears
    const listArchRes = await devWorker.fetch('/api/v1/plans?includeArchived=true');
    const listArch = (await listArchRes.json()) as any[];
    expect(listArch.find((p: any) => p.id === plan.id)).toBeDefined();

    // Restore
    const restRes = await devWorker.fetch(`/api/v1/plans/${plan.id}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(restRes.status).toBe(200);
    const restored = (await restRes.json()) as any;
    expect(restored.archived_at).toBeNull();
  });

  it('PLN-003 & PLN-005: attaches plan to 3 sessions, sets is_exception=1, and tracks used_count=3', async () => {
    const createRes = await devWorker.fetch('/api/v1/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Multi-Session Plan',
        packId: 'generic',
        content: { objectives: ['Shared across 3 sessions'] }
      })
    });
    const plan = (await createRes.json()) as any;

    // Attach to session 1, 2, 3
    for (const sId of sessionIds) {
      const attachRes = await devWorker.fetch(`/api/v1/sessions/${sId}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id })
      });
      expect(attachRes.status).toBe(200);
      const updatedSession = (await attachRes.json()) as any;
      expect(updatedSession.plan_id).toBe(plan.id);
      expect(updatedSession.is_exception).toBe(1); // PLN-003 & DM-023
    }

    // Check plan used_count via GET /plans/:id
    const getRes = await devWorker.fetch(`/api/v1/plans/${plan.id}`);
    expect(getRes.status).toBe(200);
    const planDetail = (await getRes.json()) as any;
    expect(planDetail.used_count).toBe(3); // PLN-005 verification with 3+ sessions!

    // Detach from session 1
    const detachRes = await devWorker.fetch(`/api/v1/sessions/${sessionIds[0]}/plan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: null })
    });
    expect(detachRes.status).toBe(200);
    const detachedSession = (await detachRes.json()) as any;
    expect(detachedSession.plan_id).toBeNull();
    expect(detachedSession.is_exception).toBe(1);

    // After detach, used_count should be 2
    const getRes2 = await devWorker.fetch(`/api/v1/plans/${plan.id}`);
    const planDetail2 = (await getRes2.json()) as any;
    expect(planDetail2.used_count).toBe(2);
  });

  it('DM-001 tenant safety: foreign user cannot access or attach another account plan', async () => {
    // Create plan in user 1 account
    const createRes = await devWorker.fetch('/api/v1/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Private Teacher Plan',
        packId: 'generic',
        content: { objectives: ['Confidential'] }
      })
    });
    const plan = (await createRes.json()) as any;

    // Foreign user attempt to GET
    const foreignGet = await devWorkerForeign.fetch(`/api/v1/plans/${plan.id}`);
    expect(foreignGet.status).toBe(404);

    // Foreign user attempt to PATCH
    const foreignPatch = await devWorkerForeign.fetch(`/api/v1/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Hacked Title' })
    });
    expect(foreignPatch.status).toBe(404);
  });
});
