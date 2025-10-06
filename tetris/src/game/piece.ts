import { FIELD_WIDTH, FIELD_TOTAL_HEIGHT } from './types.js';
import type { PieceKind, Piece, KickTable, Field } from './types.js';

export const PIECE_SHAPES: Record<PieceKind, number[][][]> = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]
  ],
  O: [
    [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]]
  ],
  T: [
    [[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
    [[0,0,0,0],[1,1,1,0],[0,1,0,0],[0,0,0,0]],
    [[0,1,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]]
  ],
  S: [
    [[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,1,0],[0,0,1,0],[0,0,0,0]],
    [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],
    [[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]]
  ],
  Z: [
    [[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
    [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],
    [[0,1,0,0],[1,1,0,0],[1,0,0,0],[0,0,0,0]]
  ],
  J: [
    [[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,1,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
    [[0,0,0,0],[1,1,1,0],[0,0,1,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[1,1,0,0],[0,0,0,0]]
  ],
  L: [
    [[0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,1,0],[0,0,0,0]],
    [[0,0,0,0],[1,1,1,0],[1,0,0,0],[0,0,0,0]],
    [[1,1,0,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]]
  ]
};

export const SRS_KICK_TABLE: KickTable = {
  'JLTSZ_R': [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
  'JLTSZ_L': [[0,0], [1,0], [1,1], [0,-2], [1,-2]],
  'I_R': [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],
  'I_L': [[0,0], [2,0], [-1,0], [2,1], [-1,-2]]
};

export function createPiece(kind: PieceKind, x: number = 4, y: number = 20): Piece {
  return {
    kind,
    rot: 0,
    x,
    y
  };
}

export function getPieceShape(piece: Piece): number[][] {
  return PIECE_SHAPES[piece.kind][piece.rot];
}

export function isValidPosition(field: Field, piece: Piece, dx: number = 0, dy: number = 0): boolean {
  const shape = getPieceShape(piece);
  const newX = piece.x + dx;
  const newY = piece.y + dy;
  
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if (shape[y][x]) {
        const fieldX = newX + x;
        const fieldY = newY + y;
        
        if (fieldX < 0 || fieldX >= FIELD_WIDTH || fieldY < 0) {
          return false;
        }
        
        if (fieldY < FIELD_TOTAL_HEIGHT && field[fieldY][fieldX] !== 0) {
          return false;
        }
      }
    }
  }
  
  return true;
}

export function tryRotate(field: Field, piece: Piece, direction: 1 | -1): Piece | null {
  const newRot = ((piece.rot + direction) + 4) % 4 as 0 | 1 | 2 | 3;
  const newPiece = { ...piece, rot: newRot };
  
  if (piece.kind === 'O') {
    return isValidPosition(field, newPiece) ? newPiece : null;
  }
  
  const kickTableKey = piece.kind === 'I' 
    ? `I_${direction === 1 ? 'R' : 'L'}`
    : `JLTSZ_${direction === 1 ? 'R' : 'L'}`;
  
  const kicks = SRS_KICK_TABLE[kickTableKey];
  
  for (const [dx, dy] of kicks) {
    const testPiece = { ...newPiece, x: newPiece.x + dx, y: newPiece.y + dy };
    if (isValidPosition(field, testPiece)) {
      return testPiece;
    }
  }
  
  return null;
}

export function getGhostPosition(field: Field, piece: Piece): Piece {
  const ghost = { ...piece };
  
  while (isValidPosition(field, ghost, 0, -1)) {
    ghost.y--;
  }
  
  return ghost;
}

export function placePieceOnField(field: Field, piece: Piece): void {
  const shape = getPieceShape(piece);
  const colorId = getPieceColorId(piece.kind);
  
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if (shape[y][x]) {
        const fieldX = piece.x + x;
        const fieldY = piece.y + y;
        
        if (fieldY >= 0 && fieldY < FIELD_TOTAL_HEIGHT && 
            fieldX >= 0 && fieldX < FIELD_WIDTH) {
          field[fieldY][fieldX] = colorId;
        }
      }
    }
  }
}

function getPieceColorId(kind: PieceKind): number {
  const colorMap: Record<PieceKind, number> = {
    I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7
  };
  return colorMap[kind];
}