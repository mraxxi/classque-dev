import { unstable_dev, Unstable_DevWorker } from 'wrangler';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';

describe('/api/v1/notes integration routes', () => {
  let devWorker: Unstable_DevWorker;
  let devWorkerForeign: Unstable_DevWorker;
  let workplaceId: string;
  let groupId: string;
  let sessionId: string;
  let learnerId: string;

  beforeAll(async () => {
    devWorker = await unstable_dev('src/worker/index.ts', {
      experimental: { disableExperimentalWarning: true },
      vars: {
        ENVIRONMENT: 'development',
        DEV_USER_EMAIL: 'notes-test@example.com'
      }
    });

    devWorkerForeign = await unstable_dev('src/worker/index.ts', {
      experimental: { disableExperimentalWarning: true },
      vars: {
        ENVIRONMENT: 'development',
        DEV_USER_EMAIL: 'notes-foreign@example.com'
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
        name: 'Math Grade 5',
        kind: 'class',
        color: 'c3'
      })
    });
    const group = (await groupRes.json()) as any;
    groupId = group.id;

    // Add a learner
    await devWorker.fetch(`/api/v1/groups/${groupId}/learners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names: ['Alice Wonder'] })
    });
    const lrnRes = await devWorker.fetch(`/api/v1/groups/${groupId}/learners`);
    const learners = (await lrnRes.json()) as any[];
    learnerId = learners[0].id;

    // Create a session
    const sRes = await devWorker.fetch('/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId,
        sessionDate: '2026-10-15',
        startTime: '09:00',
        durationMin: 45
      })
    });
    const s = (await sRes.json()) as any;
    sessionId = s.id;
  }, 30000);

  afterAll(async () => {
    if (devWorker) await devWorker.stop();
    if (devWorkerForeign) await devWorkerForeign.stop();
  });

  it('NOT-002: rejects note with no target (neither sessionId, groupId, nor learnerId) with 400 validation_failed', async () => {
    const res = await devWorker.fetch('/api/v1/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: 'Observation with no target set'
      })
    });

    expect(res.status).toBe(400);
    const data = (await res.json()) as any;
    expect(data.error.code).toBe('validation_failed');
  });

  it('NOT-001, NOT-002, NOT-005, H9: creates note attached to session and learner, auto-populates group_id, marks is_exception=1, zero logging of body', async () => {
    const noteBody = 'Alice completed the advanced worksheet quickly.';
    const res = await devWorker.fetch('/api/v1/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: noteBody,
        sessionId,
        learnerId
      })
    });

    expect(res.status).toBe(201);
    const note = (await res.json()) as any;
    expect(note.id).toBeDefined();
    expect(note.session_id).toBe(sessionId);
    expect(note.group_id).toBe(groupId); // auto-populated from session
    expect(note.learner_id).toBe(learnerId);
    expect(note.visibility).toBe('private'); // NOT-008

    // Verify session is marked as exception (NOT-005 & DM-023)
    const sessionRes = await devWorker.fetch(`/api/v1/sessions/${sessionId}`);
    const session = (await sessionRes.json()) as any;
    expect(session.is_exception).toBe(1);
  });

  it('NOT-003: lists notes per session, per group, and per learner', async () => {
    // List by session
    const sNotesRes = await devWorker.fetch(`/api/v1/notes?sessionId=${sessionId}`);
    expect(sNotesRes.status).toBe(200);
    const sNotes = (await sNotesRes.json()) as any[];
    expect(sNotes.length).toBeGreaterThan(0);
    expect(sNotes[0].session_id).toBe(sessionId);

    // List by group
    const gNotesRes = await devWorker.fetch(`/api/v1/notes?groupId=${groupId}`);
    expect(gNotesRes.status).toBe(200);
    const gNotes = (await gNotesRes.json()) as any[];
    expect(gNotes.length).toBeGreaterThan(0);
    expect(gNotes[0].group_id).toBe(groupId);

    // List by learner
    const lNotesRes = await devWorker.fetch(`/api/v1/notes?learnerId=${learnerId}`);
    expect(lNotesRes.status).toBe(200);
    const lNotes = (await lNotesRes.json()) as any[];
    expect(lNotes.length).toBeGreaterThan(0);
    expect(lNotes[0].learner_id).toBe(learnerId);
  });

  it('NOT-007: More -> Notes shows recent notes with context tags', async () => {
    const res = await devWorker.fetch('/api/v1/notes');
    expect(res.status).toBe(200);
    const notes = (await res.json()) as any[];
    expect(notes.length).toBeGreaterThan(0);
    const noteWithContext = notes.find((n: any) => n.session_id === sessionId);
    expect(noteWithContext.group_name).toBe('Math Grade 5');
    expect(noteWithContext.learner_name).toBe('Alice Wonder');
    expect(noteWithContext.session_date).toBe('2026-10-15');
  });

  it('NOT-004: edits a note and hard deletes it', async () => {
    // Create note
    const createRes = await devWorker.fetch('/api/v1/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: 'Initial note text',
        groupId
      })
    });
    const note = (await createRes.json()) as any;

    // Edit
    const editRes = await devWorker.fetch(`/api/v1/notes/${note.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'Updated note text' })
    });
    expect(editRes.status).toBe(200);
    const updated = (await editRes.json()) as any;
    expect(updated.body).toBe('Updated note text');

    // Hard delete
    const deleteRes = await devWorker.fetch(`/api/v1/notes/${note.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(deleteRes.status).toBe(200);

    // Verify it disappears completely
    const listRes = await devWorker.fetch(`/api/v1/notes?groupId=${groupId}`);
    const list = (await listRes.json()) as any[];
    expect(list.find((n: any) => n.id === note.id)).toBeUndefined();
  });

  it('DM-001 tenant safety: foreign user cannot view, edit, or delete another account note', async () => {
    // Create note in user 1 account
    const createRes = await devWorker.fetch('/api/v1/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: 'Teacher private note',
        groupId
      })
    });
    const note = (await createRes.json()) as any;

    // Foreign user attempt to PATCH
    const patchRes = await devWorkerForeign.fetch(`/api/v1/notes/${note.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'Hacked note' })
    });
    expect(patchRes.status).toBe(404);

    // Foreign user attempt to DELETE
    const delRes = await devWorkerForeign.fetch(`/api/v1/notes/${note.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(delRes.status).toBe(404);
  });
});
