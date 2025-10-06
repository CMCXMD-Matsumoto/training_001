import { PIECE_COLORS, FIELD_HEIGHT } from '../game/types.js';
import type { Field, Piece, PieceKind } from '../game/types.js';
import { getPieceShape } from '../game/piece.js';
import { calculateLayout } from './layout.js';
import type { Layout } from './layout.js';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private layout: Layout;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.layout = calculateLayout(canvas);
    
    this.setupCanvas();
    window.addEventListener('resize', () => this.handleResize());
  }

  private setupCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    this.layout = calculateLayout(this.canvas);
  }

  private handleResize(): void {
    this.setupCanvas();
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#000011';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderField(field: Field, showGrid: boolean = true): void {
    const { fieldX, fieldY, cellSize } = this.layout;
    
    this.ctx.save();
    this.ctx.translate(fieldX, fieldY);
    
    if (showGrid) {
      this.renderGrid();
    }
    
    for (let y = 0; y < FIELD_HEIGHT; y++) {
      for (let x = 0; x < 10; x++) {
        const cell = field[y][x];
        if (cell !== 0) {
          this.renderCell(x, FIELD_HEIGHT - 1 - y, this.getCellColor(cell), cellSize);
        }
      }
    }
    
    this.ctx.restore();
  }

  renderPiece(piece: Piece, alpha: number = 1): void {
    if (!piece) return;
    
    const { fieldX, fieldY, cellSize } = this.layout;
    const shape = getPieceShape(piece);
    const color = PIECE_COLORS[piece.kind];
    
    this.ctx.save();
    this.ctx.translate(fieldX, fieldY);
    this.ctx.globalAlpha = alpha;
    
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if (shape[y][x]) {
          const fieldX = piece.x + x;
          const fieldY = FIELD_HEIGHT - 1 - (piece.y + y);
          
          if (fieldX >= 0 && fieldX < 10 && fieldY >= 0 && fieldY < FIELD_HEIGHT) {
            this.renderCell(fieldX, fieldY, color, cellSize);
          }
        }
      }
    }
    
    this.ctx.restore();
  }

  renderNextQueue(queue: PieceKind[], count: number = 5): void {
    const { nextX, nextY, cellSize } = this.layout;
    const previewSize = cellSize * 0.6;
    
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('NEXT', nextX, nextY - 10);
    
    for (let i = 0; i < Math.min(count, queue.length); i++) {
      const y = nextY + i * (previewSize * 4 + 10);
      this.renderPreviewPiece(queue[i], nextX, y, previewSize);
    }
    
    this.ctx.restore();
  }

  renderHold(holdPiece: PieceKind | null): void {
    const { holdX, holdY, cellSize } = this.layout;
    const previewSize = cellSize * 0.6;
    
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('HOLD', holdX, holdY - 10);
    
    if (holdPiece) {
      this.renderPreviewPiece(holdPiece, holdX, holdY, previewSize);
    }
    
    this.ctx.restore();
  }

  renderHUD(score: number, level: number, lines: number): void {
    const { hudX, hudY } = this.layout;
    
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '18px Arial';
    
    const texts = [
      `Score: ${score.toLocaleString()}`,
      `Level: ${level}`,
      `Lines: ${lines}`
    ];
    
    texts.forEach((text, i) => {
      this.ctx.fillText(text, hudX, hudY + i * 30);
    });
    
    this.ctx.restore();
  }

  renderPauseOverlay(): void {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    
    this.ctx.font = '24px Arial';
    this.ctx.fillText('Press ESC to resume', this.canvas.width / 2, this.canvas.height / 2 + 60);
    
    this.ctx.restore();
  }

  renderGameOver(score: number): void {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ff4444';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 60);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Final Score: ${score.toLocaleString()}`, this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 60);
    
    this.ctx.restore();
  }

  private renderGrid(): void {
    const { cellSize } = this.layout;
    
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 1;
    
    for (let x = 0; x <= 10; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * cellSize, 0);
      this.ctx.lineTo(x * cellSize, FIELD_HEIGHT * cellSize);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= FIELD_HEIGHT; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * cellSize);
      this.ctx.lineTo(10 * cellSize, y * cellSize);
      this.ctx.stroke();
    }
  }

  private renderCell(x: number, y: number, color: string, size: number): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x * size + 1, y * size + 1, size - 2, size - 2);
  }

  private renderPreviewPiece(kind: PieceKind, x: number, y: number, cellSize: number): void {
    const shapes = {
      I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
      O: [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      T: [[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
      S: [[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],
      Z: [[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      J: [[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
      L: [[0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]]
    };
    
    const shape = shapes[kind];
    const color = PIECE_COLORS[kind];
    
    this.ctx.save();
    this.ctx.fillStyle = color;
    
    for (let py = 0; py < 4; py++) {
      for (let px = 0; px < 4; px++) {
        if (shape[py][px]) {
          this.ctx.fillRect(
            x + px * cellSize,
            y + py * cellSize,
            cellSize - 1,
            cellSize - 1
          );
        }
      }
    }
    
    this.ctx.restore();
  }

  private getCellColor(colorId: number): string {
    const colors = ['', '#00FFFF', '#FFD500', '#AA00FF', '#00FF66', '#FF3355', '#3355FF', '#FF9900'];
    return colors[colorId] || '#ffffff';
  }
}