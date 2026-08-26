export type PlayerColor = 'white' | 'black';

export interface Point {
  index: number; // 1 to 24
  count: number;
  color: PlayerColor | null;
}

export interface BoardState {
  points: Point[]; // 24 points, indices 1..24
  bar: {
    white: number;
    black: number;
  };
  off: {
    white: number;
    black: number;
  };
}

export interface DiceState {
  currentDice: number[]; // e.g. [3, 5]
  remainingDice: number[]; // moves remaining, e.g. [3, 5] or [4, 4, 4, 4] for doubles
  hasRolled: boolean;
  isRolling: boolean;
}

export interface SingleStepMove {
  from: number | 'bar';
  to: number | 'off';
  dieUsed: number;
  isHit?: boolean;
}

export interface MoveStep {
  from: number | 'bar';
  to: number | 'off';
  dieUsed: number;
  hitOpponentBlot: boolean;
}

export interface TurnHistoryItem {
  player: PlayerColor;
  dice: number[];
  steps: MoveStep[];
  timestamp: number;
  pipBefore: { white: number; black: number };
  pipAfter: { white: number; black: number };
  analysis?: {
    quality: 'best' | 'great' | 'good' | 'inaccurate' | 'blunder';
    summary: string;
    blotRiskIncrease?: number;
    aiAdvice?: string;
  };
}

export type GameMode = 'free_play' | 'lessons' | 'puzzles' | 'probabilities' | 'rules';

export type AIDifficulty = 'beginner' | 'intermediate' | 'master';

export type CoachingMode = 'adaptive' | 'full' | 'minimal';

export type CoachMasteryLevel = 'beginner' | 'tactician' | 'master';

export interface AvailableMoveOption {
  from: number | 'bar';
  to: number | 'off';
  dieUsed: number;
  diceUsed?: number[];
  isHit: boolean;
  isCombined?: boolean;
  steps?: SingleStepMove[];
}

export interface BoardAnnotation {
  pointIndex: number;
  label: string;
  type: 'anchor' | 'golden' | 'prime' | 'blot' | 'target' | 'bar_point' | 'home';
  description?: string;
}

export interface LessonStep {
  id: string;
  title: string;
  instruction: string;
  theory: string;
  boardSetup: BoardState;
  dice: number[];
  playerTurn: PlayerColor;
  targetMove?: { from: number | 'bar'; to: number | 'off'; dieUsed: number }[];
  explanationOnSuccess: string;
  hint: string;
  keyRule: string;
  customAnnotations?: BoardAnnotation[];
}

export interface Lesson {
  id: string;
  level: number;
  title: string;
  category: string;
  description: string;
  iconName: string;
  steps: LessonStep[];
}

export interface Puzzle {
  id: string;
  title: string;
  difficulty: 'Легкий' | 'Середній' | 'Складний' | 'Гросмейстер';
  category: 'Дебют' | 'Праймінг' | 'Бліц' | 'Анкери' | 'Ендшпіль / Bear-off';
  scenario: string;
  boardSetup: BoardState;
  dice: number[];
  playerTurn: PlayerColor;
  bestMoves: SingleStepMove[];
  acceptableMoves?: SingleStepMove[][];
  explanationBest: string;
  explanationAlternative?: string;
  blunderExplanation: string;
  strategicConcept: string;
}

export interface HitProbabilityData {
  distance: number;
  combinationsCount: number;
  probabilityPercent: number;
  exactRolls: string[];
  isDirect: boolean;
  tacticalNote: string;
}

export interface BlotRiskInfo {
  pointIndex: number;
  color: PlayerColor;
  riskPercent: number;
  hitRollCount: number;
  threateningOpponents: number[]; // point indices of attackers
}
