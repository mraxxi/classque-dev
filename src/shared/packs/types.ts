export type PlanSectionKind = 'text' | 'list' | 'pairs'; // pairs = term/definition rows

export interface PlanSection {
  key: string;            // stable, snake_case
  labelKey: string;       // pack.<id>.plan.<key>
  kind: PlanSectionKind;
  required?: boolean;     // default false
}

export interface AssessmentType {
  key: string;
  labelKey: string;       // pack.<id>.assessment.<key>
  defaultScale: 'numeric' | 'cefr';
  defaultMax?: number;    // numeric only, default 100
  skillKey?: string;      // optional suggested skill
}

export interface Skill { 
  key: string; 
  labelKey: string;       // pack.<id>.skill.<key>
} 

export interface SubjectPack {
  id: string;
  version: number;
  labelKey: string;       // pack.<id>.name
  planTemplate: PlanSection[];
  assessmentTypes: AssessmentType[];
  skills: Skill[];
  progressScale: 'cefr' | null;
}
