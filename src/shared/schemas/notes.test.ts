import { describe, it, expect } from 'vitest';
import { CreateNoteSchema, UpdateNoteSchema } from './notes';

describe('Notes Schemas', () => {
  describe('CreateNoteSchema (NOT-002 target constraint & body)', () => {
    it('rejects when none of sessionId, groupId, learnerId is set', () => {
      const invalidNoTarget = {
        body: 'Learner was very enthusiastic today.'
      };
      expect(() => CreateNoteSchema.parse(invalidNoTarget)).toThrow();

      const invalidNullTargets = {
        body: 'Observation',
        sessionId: null,
        groupId: null,
        learnerId: null
      };
      expect(() => CreateNoteSchema.parse(invalidNullTargets)).toThrow();
    });

    it('accepts when only sessionId is set', () => {
      const valid = {
        body: 'Covered unit 4 exercises.',
        sessionId: 'session_01'
      };
      const parsed = CreateNoteSchema.parse(valid);
      expect(parsed.sessionId).toBe('session_01');
    });

    it('accepts when only groupId is set', () => {
      const valid = {
        body: 'Group struggling with pronunciation.',
        groupId: 'group_01'
      };
      const parsed = CreateNoteSchema.parse(valid);
      expect(parsed.groupId).toBe('group_01');
    });

    it('accepts when only learnerId is set', () => {
      const valid = {
        body: 'Learner needs extra support on reading.',
        learnerId: 'learner_01'
      };
      const parsed = CreateNoteSchema.parse(valid);
      expect(parsed.learnerId).toBe('learner_01');
    });

    it('accepts combinations of targets (e.g. session + group + learner)', () => {
      const valid = {
        body: 'Completed speaking test early.',
        sessionId: 'session_01',
        groupId: 'group_01',
        learnerId: 'learner_01'
      };
      const parsed = CreateNoteSchema.parse(valid);
      expect(parsed.sessionId).toBe('session_01');
      expect(parsed.groupId).toBe('group_01');
      expect(parsed.learnerId).toBe('learner_01');
    });

    it('rejects empty or whitespace-only body', () => {
      const empty = {
        body: '   ',
        sessionId: 'session_01'
      };
      expect(() => CreateNoteSchema.parse(empty)).toThrow();
    });

    it('rejects body longer than 2000 characters', () => {
      const tooLong = {
        body: 'a'.repeat(2001),
        sessionId: 'session_01'
      };
      expect(() => CreateNoteSchema.parse(tooLong)).toThrow();
    });

    it('accepts body with exactly 2000 characters', () => {
      const maxValid = {
        body: 'a'.repeat(2000),
        sessionId: 'session_01'
      };
      const parsed = CreateNoteSchema.parse(maxValid);
      expect(parsed.body.length).toBe(2000);
    });
  });

  describe('UpdateNoteSchema', () => {
    it('validates updating note body', () => {
      const valid = { body: 'Updated observation.' };
      const parsed = UpdateNoteSchema.parse(valid);
      expect(parsed.body).toBe('Updated observation.');
    });

    it('rejects empty body update', () => {
      expect(() => UpdateNoteSchema.parse({ body: '' })).toThrow();
    });
  });
});
