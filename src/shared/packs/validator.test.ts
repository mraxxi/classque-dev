import { describe, it, expect } from 'vitest';
import { getAllPacks } from './registry';

describe('Subject Packs', () => {
  it('All registered packs have unique keys within their sections', () => {
    const packs = getAllPacks();
    
    for (const pack of packs) {
      const planKeys = pack.planTemplate.map(p => p.key);
      const uniquePlanKeys = new Set(planKeys);
      expect(planKeys.length).toBe(uniquePlanKeys.size);

      const assessmentKeys = pack.assessmentTypes.map(a => a.key);
      const uniqueAssessmentKeys = new Set(assessmentKeys);
      expect(assessmentKeys.length).toBe(uniqueAssessmentKeys.size);

      const skillKeys = pack.skills.map(s => s.key);
      const uniqueSkillKeys = new Set(skillKeys);
      expect(skillKeys.length).toBe(uniqueSkillKeys.size);
    }
  });

  it('Generic pack has no skills and null progressScale', () => {
    const packs = getAllPacks();
    const generic = packs.find(p => p.id === 'generic');
    expect(generic).toBeDefined();
    expect(generic?.skills.length).toBe(0);
    expect(generic?.progressScale).toBeNull();
  });
});
