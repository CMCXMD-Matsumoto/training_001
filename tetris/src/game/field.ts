import { FIELD_WIDTH, FIELD_TOTAL_HEIGHT } from './types.js';
import type { Field, Piece } from './types.js';
import { placePieceOnField } from './piece.js';

export function createField(): Field {
  return Array(FIELD_TOTAL_HEIGHT).fill(null).map(() => Array(FIELD_WIDTH).fill(0));
}

export function clearLines(field: Field): number {
  const completedLines: number[] = [];
  
  for (let y = 0; y < FIELD_TOTAL_HEIGHT; y++) {
    if (isLineFull(field, y)) {
      completedLines.push(y);
    }
  }
  
  if (completedLines.length === 0) {
    return 0;
  }
  
  for (const lineY of completedLines.reverse()) {
    field.splice(lineY, 1);
    field.push(Array(FIELD_WIDTH).fill(0));
  }
  
  return completedLines.length;
}

export function isLineFull(field: Field, y: number): boolean {
  return field[y].every(cell => cell !== 0);
}

export function lockPiece(field: Field, piece: Piece): number {
  placePieceOnField(field, piece);
  return clearLines(field);
}

export function isGameOver(field: Field): boolean {
  for (let x = 0; x < FIELD_WIDTH; x++) {
    if (field[FIELD_TOTAL_HEIGHT - 1][x] !== 0 || field[FIELD_TOTAL_HEIGHT - 2][x] !== 0) {
      return true;
    }
  }
  return false;
}

export function getVisibleField(field: Field): Field {
  return field.slice(0, 20);
}

export function copyField(field: Field): Field {
  return field.map(row => [...row]);
}