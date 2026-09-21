import type { SubjectPack } from './types';

export const genericPack: SubjectPack = {
  id: 'generic',
  version: 1,
  labelKey: 'pack.generic.name',
  planTemplate: [
    { key: 'objectives', labelKey: 'pack.generic.plan.objectives', kind: 'list', required: true },
    { key: 'activities', labelKey: 'pack.generic.plan.activities', kind: 'text' },
    { key: 'materials', labelKey: 'pack.generic.plan.materials', kind: 'list' },
    { key: 'notes', labelKey: 'pack.generic.plan.notes', kind: 'text' }
  ],
  assessmentTypes: [
    { key: 'quiz', labelKey: 'pack.generic.assessment.quiz', defaultScale: 'numeric', defaultMax: 100 },
    { key: 'test', labelKey: 'pack.generic.assessment.test', defaultScale: 'numeric', defaultMax: 100 },
    { key: 'assignment', labelKey: 'pack.generic.assessment.assignment', defaultScale: 'numeric', defaultMax: 100 },
    { key: 'project', labelKey: 'pack.generic.assessment.project', defaultScale: 'numeric', defaultMax: 100 }
  ],
  skills: [],
  progressScale: null
};
