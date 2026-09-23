import type { SubjectPack } from './types';

export const englishPack: SubjectPack = {
  id: 'english',
  version: 1,
  labelKey: 'pack.english.name',
  planTemplate: [
    { key: 'objectives', labelKey: 'pack.english.plan.objectives', kind: 'list', required: true },
    { key: 'warm_up', labelKey: 'pack.english.plan.warm_up', kind: 'text' },
    { key: 'presentation', labelKey: 'pack.english.plan.presentation', kind: 'text' },
    { key: 'practice', labelKey: 'pack.english.plan.practice', kind: 'text' },
    { key: 'production', labelKey: 'pack.english.plan.production', kind: 'text' },
    { key: 'wrap_up', labelKey: 'pack.english.plan.wrap_up', kind: 'text' },
    { key: 'vocabulary', labelKey: 'pack.english.plan.vocabulary', kind: 'pairs' },
    { key: 'grammar_focus', labelKey: 'pack.english.plan.grammar_focus', kind: 'text' },
    { key: 'materials', labelKey: 'pack.english.plan.materials', kind: 'list' },
    { key: 'homework', labelKey: 'pack.english.plan.homework', kind: 'text' }
  ],
  assessmentTypes: [
    { key: 'quiz', labelKey: 'pack.english.assessment.quiz', defaultScale: 'numeric', defaultMax: 100 },
    { key: 'test', labelKey: 'pack.english.assessment.test', defaultScale: 'numeric', defaultMax: 100 },
    { key: 'homework', labelKey: 'pack.english.assessment.homework', defaultScale: 'numeric', defaultMax: 100 },
    { key: 'speaking', labelKey: 'pack.english.assessment.speaking', defaultScale: 'numeric', defaultMax: 100, skillKey: 'speaking' },
    { key: 'writing', labelKey: 'pack.english.assessment.writing', defaultScale: 'numeric', defaultMax: 100, skillKey: 'writing' },
    { key: 'listening', labelKey: 'pack.english.assessment.listening', defaultScale: 'numeric', defaultMax: 100, skillKey: 'listening' },
    { key: 'reading', labelKey: 'pack.english.assessment.reading', defaultScale: 'numeric', defaultMax: 100, skillKey: 'reading' }
  ],
  skills: [
    { key: 'reading', labelKey: 'pack.english.skill.reading' },
    { key: 'writing', labelKey: 'pack.english.skill.writing' },
    { key: 'listening', labelKey: 'pack.english.skill.listening' },
    { key: 'speaking', labelKey: 'pack.english.skill.speaking' },
    { key: 'vocabulary', labelKey: 'pack.english.skill.vocabulary' },
    { key: 'grammar', labelKey: 'pack.english.skill.grammar' }
  ],
  progressScale: 'cefr'
};
