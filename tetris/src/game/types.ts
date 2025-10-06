export type PieceKind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Piece {
  kind: PieceKind;
  rot: 0 | 1 | 2 | 3;
  x: number;
  y: number;
}

export type Field = number[][];

export interface Queue {
  pieces: PieceKind[];
  bagIndex: number;
}

export interface Hold {
  piece: PieceKind | null;
  usedThisTurn: boolean;
}

export interface ScoreState {
  score: number;
  lines: number;
  level: number;
}

export interface Settings {
  volume: {
    bgm: number;
    se: number;
  };
  das: number;
  arr: number;
  sd: number;
  ghost: boolean;
  grid: boolean;
  theme: 'default' | 'high';
  keybinds: Record<string, string>;
}

export const GameState = {
  TITLE: 'TITLE',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER'
} as const;

export type GameState = typeof GameState[keyof typeof GameState];

export const PlayState = {
  SPAWN: 'SPAWN',
  FALL: 'FALL',
  LOCK: 'LOCK',
  LINECLEAR: 'LINECLEAR'
} as const;

export type PlayState = typeof PlayState[keyof typeof PlayState];

export interface GameStats {
  totalTime: number;
  piecesPlaced: number;
  totalLines: number;
  tetrises: number;
}

export interface KickTable {
  [key: string]: [number, number][];
}

export const PIECE_COLORS: Record<PieceKind, string> = {
  I: '#00FFFF',
  O: '#FFD500',
  T: '#AA00FF',
  S: '#00FF66',
  Z: '#FF3355',
  J: '#3355FF',
  L: '#FF9900'
};

export const FIELD_WIDTH = 10;
export const FIELD_HEIGHT = 20;
export const FIELD_HIDDEN = 2;
export const FIELD_TOTAL_HEIGHT = FIELD_HEIGHT + FIELD_HIDDEN;

export const GRAVITY_TABLE: Record<number, number> = {
  1: 1000,
  2: 793,
  3: 618,
  4: 473,
  5: 355,
  6: 262,
  7: 190,
  8: 135,
  9: 94,
  10: 64
};

export const DEFAULT_SETTINGS: Settings = {
  volume: {
    bgm: 60,
    se: 60
  },
  das: 150,
  arr: 20,
  sd: 20,
  ghost: true,
  grid: true,
  theme: 'default',
  keybinds: {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    down: 'ArrowDown',
    hardDrop: 'Space',
    rotateCW: 'KeyX',
    rotateCCW: 'KeyZ',
    hold: 'KeyC',
    pause: 'Escape'
  }
};

export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;