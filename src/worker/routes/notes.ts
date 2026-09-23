import { Hono } from 'hono';
import { NotesRepo } from '../repositories/notes.repo';
import { 
  CreateNoteSchema, 
  UpdateNoteSchema, 
  QueryNotesSchema 
} from '../../shared/schemas/notes';
import { Identity } from '../../shared/schemas/identity';
import { AppError } from '../../shared/errors';

export const notesRouter = new Hono<{ Bindings: { DB: any }, Variables: { identity: Identity } }>();

notesRouter.get('/', async (c) => {
  const identity = c.get('identity');
  const query = QueryNotesSchema.parse(c.req.query());
  const repo = new NotesRepo(c.env.DB);
  const notes = await repo.listNotes(identity.accountId, query);
  return c.json(notes);
});

notesRouter.post('/', async (c) => {
  const identity = c.get('identity');
  const rawBody = await c.req.json();
  const data = CreateNoteSchema.parse(rawBody);

  // Validate target existence and account ownership
  if (data.sessionId) {
    const session = await c.env.DB.prepare(
      'SELECT id, group_id FROM sessions WHERE account_id = ? AND id = ?'
    ).bind(identity.accountId, data.sessionId).first();
    if (!session) throw new AppError('not_found', 'errors.not_found');
  }

  if (data.groupId) {
    const group = await c.env.DB.prepare(
      'SELECT id FROM groups WHERE account_id = ? AND id = ?'
    ).bind(identity.accountId, data.groupId).first();
    if (!group) throw new AppError('not_found', 'errors.not_found');
  }

  if (data.learnerId) {
    const learner = await c.env.DB.prepare(
      'SELECT id FROM learners WHERE account_id = ? AND id = ?'
    ).bind(identity.accountId, data.learnerId).first();
    if (!learner) throw new AppError('not_found', 'errors.not_found');
  }

  const repo = new NotesRepo(c.env.DB);
  const note = await repo.createNote(identity.accountId, data);
  // Note: H9 privacy rule explicitly forbids logging note body content or learner names
  return c.json(note, 201);
});

notesRouter.patch('/:id', async (c) => {
  const identity = c.get('identity');
  const repo = new NotesRepo(c.env.DB);
  const existing = await repo.getNote(identity.accountId, c.req.param('id'));
  if (!existing) {
    throw new AppError('not_found', 'errors.not_found');
  }

  const rawBody = await c.req.json();
  const data = UpdateNoteSchema.parse(rawBody);

  const updated = await repo.updateNote(identity.accountId, c.req.param('id'), data.body);
  return c.json(updated);
});

notesRouter.delete('/:id', async (c) => {
  const identity = c.get('identity');
  const repo = new NotesRepo(c.env.DB);
  const deleted = await repo.deleteNote(identity.accountId, c.req.param('id'));
  if (!deleted) {
    throw new AppError('not_found', 'errors.not_found');
  }
  return c.json({ ok: true });
});
