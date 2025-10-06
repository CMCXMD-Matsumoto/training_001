import { GRAVITY_TABLE } from './types.js';
import type { ScoreState } from './types.js';

export function createScoreState(level: number = 1): ScoreState {
  return {
    score: 0,
    lines: 0,
    level
  };
}

export function calculateLineScore(linesCleared: number, level: number): number {
  const baseScores = [0, 100, 300, 500, 800];
  return baseScores[linesCleared] * level;
}

export function calculateDropScore(cellsDropped: number, isHard: boolean): number {
  return cellsDropped * (isHard ? 2 : 1);
}

export function updateScore(
  scoreState: ScoreState, 
  linesCleared: number, 
  softDropCells: number = 0,
  hardDropCells: number = 0
): void {
  scoreState.score += calculateLineScore(linesCleared, scoreState.level);
  scoreState.score += calculateDropScore(softDropCells, false);
  scoreState.score += calculateDropScore(hardDropCells, true);
  
  scoreState.lines += linesCleared;
  
  const newLevel = Math.floor(scoreState.lines / 10) + 1;
  if (newLevel > scoreState.level) {
    scoreState.level = newLevel;
  }
}

export function getGravityDelay(level: number): number {
  if (level >= 10) {
    return GRAVITY_TABLE[10];
  }
  return GRAVITY_TABLE[level] || GRAVITY_TABLE[1];
}