import { 
  GameState, 
  PlayState, 
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS
} from './types.js';
import type { 
  Field, 
  Piece, 
  Hold, 
  Queue, 
  ScoreState, 
  Settings
} from './types.js';
import { createField, lockPiece, isGameOver } from './field.js';
import { createPiece, isValidPosition, tryRotate, getGhostPosition } from './piece.js';
import { SevenBagRandomizer, getNextPiece, fillQueue } from './bag.js';
import type { InputState } from './input.js';
import { InputHandler } from './input.js';
import { createScoreState, updateScore, getGravityDelay } from './score.js';
import { SoundManager } from './sound.js';

export class TetrisEngine {
  private gameState: GameState = GameState.TITLE;
  private playState: PlayState = PlayState.SPAWN;
  
  private field: Field;
  private activePiece: Piece | null = null;
  private ghostPiece: Piece | null = null;
  private hold: Hold = { piece: null, usedThisTurn: false };
  private queue: Queue = { pieces: [], bagIndex: 0 };
  private randomizer: SevenBagRandomizer;
  
  private scoreState: ScoreState;
  private settings: Settings;
  
  private inputHandler: InputHandler;
  private soundManager: SoundManager;
  
  private gravityAccumulator: number = 0;
  private lockAccumulator: number = 0;
  private lockResets: number = 0;
  private lineClearDelay: number = 0;
  
  private lastTime: number = 0;
  private isPaused: boolean = false;
  
  constructor(settings: Settings) {
    this.settings = settings;
    this.field = createField();
    this.scoreState = createScoreState();
    this.randomizer = new SevenBagRandomizer();
    this.inputHandler = new InputHandler(settings);
    this.soundManager = new SoundManager();
    
    fillQueue(this.queue, this.randomizer, 5);
  }

  async initialize(): Promise<void> {
    await this.soundManager.initialize();
    this.soundManager.setVolume(this.settings.volume.bgm, this.settings.volume.se);
  }

  update(currentTime: number): void {
    if (this.gameState !== GameState.PLAYING || this.isPaused) return;
    
    const deltaTime = Math.min(currentTime - this.lastTime, 100);
    this.lastTime = currentTime;
    
    if (this.lineClearDelay > 0) {
      this.lineClearDelay -= deltaTime;
      if (this.lineClearDelay <= 0) {
        this.playState = PlayState.SPAWN;
      }
      return;
    }
    
    const input = this.inputHandler.update(deltaTime);
    this.handleInput(input);
    this.updateGravity(deltaTime);
    this.updateLockDelay(deltaTime);
  }

  private handleInput(input: InputState): void {
    if (input.pause) {
      this.togglePause();
      return;
    }
    
    if (!this.activePiece) return;
    
    if (input.hold && !this.hold.usedThisTurn) {
      this.holdPiece();
      return;
    }
    
    if (input.hardDrop) {
      this.hardDrop();
      return;
    }
    
    let moved = false;
    
    if (input.left && isValidPosition(this.field, this.activePiece, -1, 0)) {
      this.activePiece.x--;
      moved = true;
      this.soundManager.play('move');
    }
    
    if (input.right && isValidPosition(this.field, this.activePiece, 1, 0)) {
      this.activePiece.x++;
      moved = true;
      this.soundManager.play('move');
    }
    
    if (input.rotateCW) {
      const rotated = tryRotate(this.field, this.activePiece, 1);
      if (rotated) {
        this.activePiece = rotated;
        moved = true;
        this.soundManager.play('rotate');
      }
    }
    
    if (input.rotateCCW) {
      const rotated = tryRotate(this.field, this.activePiece, -1);
      if (rotated) {
        this.activePiece = rotated;
        moved = true;
        this.soundManager.play('rotate');
      }
    }
    
    if (input.down) {
      this.softDrop();
    }
    
    if (moved) {
      this.resetLockDelay();
      this.updateGhost();
    }
  }

  private updateGravity(deltaTime: number): void {
    if (!this.activePiece || this.playState !== PlayState.FALL) return;
    
    const gravityDelay = getGravityDelay(this.scoreState.level);
    this.gravityAccumulator += deltaTime;
    
    if (this.gravityAccumulator >= gravityDelay) {
      this.gravityAccumulator = 0;
      
      if (isValidPosition(this.field, this.activePiece, 0, -1)) {
        this.activePiece.y--;
      } else {
        this.playState = PlayState.LOCK;
        this.lockAccumulator = 0;
      }
    }
  }

  private updateLockDelay(deltaTime: number): void {
    if (!this.activePiece || this.playState !== PlayState.LOCK) return;
    
    this.lockAccumulator += deltaTime;
    
    if (this.lockAccumulator >= LOCK_DELAY_MS) {
      this.lockCurrentPiece();
    }
  }

  private resetLockDelay(): void {
    if (this.lockResets < MAX_LOCK_RESETS && this.activePiece) {
      if (!isValidPosition(this.field, this.activePiece, 0, -1)) {
        this.lockResets++;
        this.lockAccumulator = 0;
      } else {
        this.playState = PlayState.FALL;
        this.lockResets = 0;
      }
    }
  }

  private softDrop(): void {
    if (!this.activePiece) return;
    
    if (isValidPosition(this.field, this.activePiece, 0, -1)) {
      this.activePiece.y--;
      updateScore(this.scoreState, 0, 1, 0);
    }
  }

  private hardDrop(): void {
    if (!this.activePiece) return;
    
    let cellsDropped = 0;
    while (isValidPosition(this.field, this.activePiece, 0, -1)) {
      this.activePiece.y--;
      cellsDropped++;
    }
    
    updateScore(this.scoreState, 0, 0, cellsDropped);
    this.soundManager.play('harddrop');
    this.lockCurrentPiece();
  }

  private lockCurrentPiece(): void {
    if (!this.activePiece) return;
    
    const linesCleared = lockPiece(this.field, this.activePiece);
    this.soundManager.play('lock');
    
    if (linesCleared > 0) {
      const oldLevel = this.scoreState.level;
      updateScore(this.scoreState, linesCleared);
      
      if (this.scoreState.level > oldLevel) {
        this.soundManager.play('levelup');
      }
      
      this.soundManager.play('lineclear');
      this.lineClearDelay = 150;
      this.playState = PlayState.LINECLEAR;
    } else {
      this.playState = PlayState.SPAWN;
    }
    
    this.activePiece = null;
    this.ghostPiece = null;
    this.hold.usedThisTurn = false;
    this.lockResets = 0;
    this.lockAccumulator = 0;
    
    if (isGameOver(this.field)) {
      this.gameState = GameState.GAMEOVER;
    }
  }

  private holdPiece(): void {
    if (!this.activePiece || this.hold.usedThisTurn) return;
    
    const currentKind = this.activePiece.kind;
    
    if (this.hold.piece) {
      this.activePiece = createPiece(this.hold.piece);
    } else {
      this.spawnNextPiece();
    }
    
    this.hold.piece = currentKind;
    this.hold.usedThisTurn = true;
    this.updateGhost();
  }

  private spawnNextPiece(): void {
    const nextKind = getNextPiece(this.queue, this.randomizer);
    fillQueue(this.queue, this.randomizer, 5);
    
    this.activePiece = createPiece(nextKind);
    this.playState = PlayState.FALL;
    this.gravityAccumulator = 0;
    this.updateGhost();
    
    if (!isValidPosition(this.field, this.activePiece)) {
      this.gameState = GameState.GAMEOVER;
    }
  }

  private updateGhost(): void {
    if (this.activePiece) {
      this.ghostPiece = getGhostPosition(this.field, this.activePiece);
    }
  }

  startGame(): void {
    this.gameState = GameState.PLAYING;
    this.playState = PlayState.SPAWN;
    this.field = createField();
    this.scoreState = createScoreState();
    this.hold = { piece: null, usedThisTurn: false };
    this.randomizer = new SevenBagRandomizer();
    fillQueue(this.queue, this.randomizer, 5);
    this.spawnNextPiece();
    this.lastTime = performance.now();
  }

  togglePause(): void {
    if (this.gameState === GameState.PLAYING) {
      this.isPaused = !this.isPaused;
    }
  }

  restart(): void {
    this.startGame();
  }

  updateSettings(settings: Settings): void {
    this.settings = settings;
    this.inputHandler.updateSettings(settings);
    this.soundManager.setVolume(settings.volume.bgm, settings.volume.se);
  }

  getField(): Field { return this.field; }
  getActivePiece(): Piece | null { return this.activePiece; }
  getGhostPiece(): Piece | null { return this.ghostPiece; }
  getHold(): Hold { return this.hold; }
  getQueue(): Queue { return this.queue; }
  getScoreState(): ScoreState { return this.scoreState; }
  getGameState(): GameState { return this.gameState; }
  getPlayState(): PlayState { return this.playState; }
  isPausedState(): boolean { return this.isPaused; }
}