import { describe, it, expect } from 'vitest';
import { createPlanContentSchema } from './plans';
import { genericPack } from '../packs/generic';
import { englishPack } from '../packs/english';

describe('createPlanContentSchema', () => {
  describe('Generic Pack (PLN-002)', () => {
    const schema = createPlanContentSchema(genericPack);

    it('validates a complete generic plan content', () => {
      const valid = {
        objectives: ['Understand fraction addition'],
        activities: '1. Introduction with visual aids\n2. Group practice',
        materials: ['Fraction tiles', 'Worksheet A'],
        notes: 'Review homework next time'
      };
      const parsed = schema.parse(valid);
      expect(parsed).toEqual(valid);
    });

    it('rejects if required objectives list is empty or missing', () => {
      const missing = {
        activities: 'Some activities'
      };
      expect(() => schema.parse(missing)).toThrow();

      const empty = {
        objectives: []
      };
      expect(() => schema.parse(empty)).toThrow();
    });

    it('rejects text sections longer than 4000 characters', () => {
      const invalid = {
        objectives: ['Objective 1'],
        activities: 'a'.repeat(4001)
      };
      expect(() => schema.parse(invalid)).toThrow();
    });

    it('rejects list items longer than 200 characters or more than 30 items', () => {
      const tooLongItem = {
        objectives: ['a'.repeat(201)]
      };
      expect(() => schema.parse(tooLongItem)).toThrow();

      const tooManyItems = {
        objectives: Array.from({ length: 31 }, (_, i) => `Item ${i}`)
      };
      expect(() => schema.parse(tooManyItems)).toThrow();
    });

    it('preserves unknown or legacy keys per PK-003 (.passthrough)', () => {
      const withExtra = {
        objectives: ['Objective 1'],
        legacy_custom_section: 'Should be kept'
      };
      const parsed = schema.parse(withExtra);
      expect((parsed as any).legacy_custom_section).toBe('Should be kept');
    });
  });

  describe('English Pack (PLN-002)', () => {
    const schema = createPlanContentSchema(englishPack);

    it('validates a complete english plan content including vocabulary pairs', () => {
      const valid = {
        objectives: ['Use present perfect for experience'],
        warm_up: 'Have you ever question game',
        presentation: 'Explain form have/has + past participle',
        practice: 'Controlled gap fill worksheet',
        production: 'Pair interview about travel',
        wrap_up: 'Error correction on board',
        vocabulary: [
          { term: 'itinerary', definition: 'A planned route or journey' },
          { term: 'destination', definition: 'The place to which someone is going' }
        ],
        grammar_focus: 'Present perfect vs past simple',
        materials: ['Interview prompts cards'],
        homework: 'Write 5 sentences about your holidays'
      };
      const parsed = schema.parse(valid);
      expect(parsed).toEqual(valid);
    });

    it('rejects vocabulary pairs exceeding 60 pairs', () => {
      const tooManyPairs = {
        objectives: ['English objective'],
        vocabulary: Array.from({ length: 61 }, (_, i) => ({
          term: `word_${i}`,
          definition: `def_${i}`
        }))
      };
      expect(() => schema.parse(tooManyPairs)).toThrow();
    });

    it('rejects invalid vocabulary pair shape', () => {
      const invalidPair = {
        objectives: ['English objective'],
        vocabulary: [
          { term: 'only term without definition' }
        ]
      };
      expect(() => schema.parse(invalidPair)).toThrow();
    });
  });
});
