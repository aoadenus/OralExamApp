export type RelationshipType = 'one-to-one' | 'one-to-many' | 'many-to-many';

export interface SqlNote {
  type: 'concept' | 'tip' | 'warn';
  title: string;
  text: string;
}

export type SqlScriptSource = 'group_script' | 'teammate_html' | 'manual';
export type SqlRequirementStatus = 'study-ready' | 'draft' | 'risky';
export type SqlAnswerMode = 'typed' | 'out-loud';

export interface SqlClauseBreakdown {
  clause: string;
  why: string;
}

export interface SqlRequirement {
  id: string;
  title: string;
  desc: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sql: string;
  tables: string[];
  concepts: string[];
  notes: SqlNote[];
  checklist: string[];
  businessMeaning?: string;
  officialTask?: string;
  currentScriptSource?: SqlScriptSource;
  currentMeaning?: string;
  expectedResultDescription?: string;
  easyQuestion?: string;
  hardQuestion?: string;
  easyChecklist?: string[];
  hardChecklist?: string[];
  keyClauses?: string[];
  knownRiskNotes?: string[];
  status?: SqlRequirementStatus;
  expectedResultShape?: string[];
  oralQuestions?: string[];
  clauseBreakdown?: SqlClauseBreakdown[];
}

export type Cardinality = '1:1' | '1:M' | 'M:N';
export type MasteryResult = 'correct' | 'partial' | 'incorrect';

export interface Domain {
  id: string;
  name: string;
  description: string;
  entityIds: string[];
  relationshipIds: string[];
}

export interface Entity {
  id: string;
  name: string;
  domainId: string;
  description: string;
  primaryKey: string[];
  foreignKeys: string[];
  attributes: string[];
  subtypeOf: string | null;
  isAssociative: boolean;
}

export interface Relationship {
  id: string;
  entityA: string;
  entityB: string;
  type: RelationshipType;
  cardinality: Cardinality;
  optionalityA?: 'mandatory' | 'optional';
  optionalityB?: 'mandatory' | 'optional';
  ruleForward: string;
  ruleReverse: string;
  fkTable: string | null;
  fkField: string | null;
  requiresAssociativeEntity: boolean;
  associativeEntityId: string | null;
  domainId: string;
  oralCue: string;
}

export interface AssociativeEntity {
  id: string;
  name: string;
  resolves: string[];
  compositePrimaryKey: string[];
  attributes: string[];
  description: string;
}

export interface SubtypeRelationship {
  id: string;
  subtypeId: string;
  supertypeId: string;
  description: string;
  primaryKey: string[];
}

export interface ErdHotspot {
  entityId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hint: string;
}

export interface OralQuestion {
  id: string;
  type: 'entity' | 'relationship';
  prompt: string;
  entityId?: string;
  relationshipId?: string;
  entityIds?: string[];
  modelAnswer?: string;
  expectedChecklist: string[];
  domainId?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ItemProgress {
  attempts: number;
  correct: number;
  incorrect: number;
  streak: number;
  confidenceAvg: number;
  lastResult?: MasteryResult;
  lastSeenAt?: string;
  mastery: number;
}

export interface OralAnswer {
  questionId: string;
  questionType: 'entity' | 'relationship';
  userAnswer: string;
  expectedChecklist: string[];
  checklistMatches: string[];
  result: MasteryResult;
  score: number;
  maxScore: number;
}

export interface MockOralHistoryItem {
  id: string;
  startedAt: string;
  entityQuestionId: string;
  relationshipQuestionId: string;
  score: number;
  maxScore: number;
  entityAnswer?: OralAnswer;
  relationshipAnswer?: OralAnswer;
  durationSeconds?: number;
}

export interface WeakSpot {
  id: string;
  category: 'entity' | 'relationship' | 'fk-logic' | 'cardinality' | 'associative' | 'subtype';
  itemId?: string;
  itemName: string;
  errorCount: number;
  correctCount: number;
  lastErrorAt: string;
}

export interface StudySession {
  id: string;
  startedAt: string;
  endedAt?: string;
  durationMs: number;
  itemsAttempted: number;
  itemsCorrect: number;
}

export type ErrorCategory = 'entity' | 'relationship' | 'fk-logic' | 'cardinality' | 'associative' | 'subtype';

export interface SqlOralSession {
  id: string;
  startedAt: string;
  requirementId: string;
  executionScore: number;
  easyScore: number;
  hardScore: number;
  deliveryScore: number;
  total: number;
  easyAnswerMode: SqlAnswerMode;
  hardAnswerMode: SqlAnswerMode;
  easyAnswer: string;
  hardAnswer: string;
  easyMatched: string[];
  easyMissed: string[];
  hardMatched: string[];
  hardMissed: string[];
  verdict: 'strong' | 'shaky' | 'needs-work';
  coachNote: string;
  durationSeconds?: number;
}

export interface SettingsState {
  soundEnabled: boolean;
  timerWarningsEnabled: boolean;
  reducedMotion: boolean;
  fontScale: 'sm' | 'md' | 'lg';
  theme: 'light' | 'dark' | 'system';
  examDate?: string;
  dailyGoalMinutes?: number;
  awsHost?: string;
  awsUser?: string;
  awsDatabase?: string;
}

export interface ProgressState {
  version: number;
  userId: string;
  initializedAt: string;
  overallReadiness: number;
  itemProgress: Record<string, ItemProgress>;
  mockOrals: MockOralHistoryItem[];
  streak: number;
  settings: SettingsState;
  studySessions: StudySession[];
  weakSpots: Record<string, WeakSpot>;
  totalStudyTimeMs: number;
  lastStudySessionAt?: string;
  favoriteItemIds?: string[];
  acknowledgedMilestones?: number[];
  sqlOralSessions?: SqlOralSession[];
}
