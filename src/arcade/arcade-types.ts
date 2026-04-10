export type ArcadeZone =
  | 'lobby'
  | 'mission-terminal'
  | 'clause-blaster'
  | 'join-juggernaut'
  | 'time-window-rush'
  | 'aggregation-forge'
  | 'boss-rush'
  | 'data-vault'
  | 'scoreboard';

export interface GameScore {
  gameId: string;
  score: number;
  maxCombo: number;
  accuracy: number;
  completedAt: string;
  requirementId?: string;
}

export interface ArcadeProgress {
  xp: number;
  totalGamesPlayed: number;
  highScores: Record<string, number>;
  gameHistory: GameScore[];
  currentStreak: number;
  bestStreak: number;
  medals: string[];
}

export interface ClauseEnemy {
  id: string;
  prompt: string;
  correctClause: string;
  explanation: string;
  requirementId: string;
  speed: number;
}

export interface JoinPuzzle {
  requirementId: string;
  title: string;
  tables: string[];
  requiredJoins: Array<{ from: string; to: string; type: 'INNER JOIN' | 'LEFT JOIN' | 'RIGHT JOIN' }>;
  resultColumns: string[];
}

export interface BossPhase {
  type: 'execute' | 'explain' | 'defend';
  prompt: string;
  checklist: string[];
  timeLimit: number;
}

export interface TimeWindowPrompt {
  id: string;
  prompt: string;
  correctLane: string;
  explanation: string;
  requirementId: string;
}

export interface ForgeRecipe {
  id: string;
  prompt: string;
  requiredMachines: string[];
  explanation: string;
  requirementId: string;
}
