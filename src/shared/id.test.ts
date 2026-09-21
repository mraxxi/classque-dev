import { describe, it, expect } from 'vitest';
import { generateId } from './id';

describe('generateId', () => {
  it('generates a 26-character string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(26);
  });

  it('generates unique ids', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});
