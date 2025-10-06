import { TetrisEngine } from './game/engine.js';
import { Renderer } from './ui/renderer.js';
import { GameStorage } from './game/storage.js';
import { Settings, GameState, DEFAULT_SETTINGS } from './game/types.js';

class TetrisGame {
  private engine: TetrisEngine;
  private renderer: Renderer;
  private canvas: HTMLCanvasElement;
  private settings: Settings;
  private isRunning = false;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.settings = GameStorage.loadSettings();
    this.engine = new TetrisEngine(this.settings);
    this.renderer = new Renderer(this.canvas);
    
    this.setupCanvas();
    this.setupEventListeners();
    this.setupUI();
  }

  private setupCanvas(): void {
    const resizeCanvas = () => {
      const container = this.canvas.parentElement!;
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyR' && this.engine.getGameState() === GameState.GAMEOVER) {
        this.restart();
      }
    });
  }

  private setupUI(): void {
    const startBtn = document.getElementById('start-btn')!;
    const pauseBtn = document.getElementById('pause-btn')!;
    const restartBtn = document.getElementById('restart-btn')!;
    const settingsBtn = document.getElementById('settings-btn')!;
    const helpBtn = document.getElementById('help-btn')!;
    
    startBtn.addEventListener('click', () => this.start());
    pauseBtn.addEventListener('click', () => this.engine.togglePause());
    restartBtn.addEventListener('click', () => this.restart());
    settingsBtn.addEventListener('click', () => this.showSettings());
    helpBtn.addEventListener('click', () => this.showHelp());
    
    this.setupSettingsModal();
  }

  private setupSettingsModal(): void {
    const modal = document.getElementById('settings-modal')!;
    const closeBtn = document.getElementById('modal-close')!;
    const applyBtn = document.getElementById('settings-apply')!;
    const cancelBtn = document.getElementById('settings-cancel')!;
    const resetBtn = document.getElementById('settings-reset')!;
    
    closeBtn.addEventListener('click', () => this.hideSettings());
    cancelBtn.addEventListener('click', () => this.hideSettings());
    applyBtn.addEventListener('click', () => this.applySettings());
    resetBtn.addEventListener('click', () => this.resetSettings());
    
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tabName = target.dataset.tab!;
        this.switchTab(tabName);
      });
    });
    
    // Slider updates
    this.setupSliders();
    
    // Load current settings
    this.loadSettingsToUI();
  }

  private setupSliders(): void {
    const sliders = [
      { id: 'das-slider', valueId: 'das-value', suffix: '' },
      { id: 'arr-slider', valueId: 'arr-value', suffix: '' },
      { id: 'sd-slider', valueId: 'sd-value', suffix: '' },
      { id: 'bgm-slider', valueId: 'bgm-value', suffix: '%' },
      { id: 'se-slider', valueId: 'se-value', suffix: '%' }
    ];
    
    sliders.forEach(({ id, valueId, suffix }) => {
      const slider = document.getElementById(id) as HTMLInputElement;
      const valueEl = document.getElementById(valueId)!;
      
      slider.addEventListener('input', () => {
        valueEl.textContent = slider.value + suffix;
      });
    });
  }

  private switchTab(tabName: string): void {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    document.getElementById(`${tabName}-tab`)?.classList.add('active');
  }

  private loadSettingsToUI(): void {
    (document.getElementById('das-slider') as HTMLInputElement).value = this.settings.das.toString();
    (document.getElementById('arr-slider') as HTMLInputElement).value = this.settings.arr.toString();
    (document.getElementById('sd-slider') as HTMLInputElement).value = this.settings.sd.toString();
    (document.getElementById('bgm-slider') as HTMLInputElement).value = this.settings.volume.bgm.toString();
    (document.getElementById('se-slider') as HTMLInputElement).value = this.settings.volume.se.toString();
    
    (document.getElementById('ghost-toggle') as HTMLInputElement).checked = this.settings.ghost;
    (document.getElementById('grid-toggle') as HTMLInputElement).checked = this.settings.grid;
    (document.getElementById('theme-select') as HTMLSelectElement).value = this.settings.theme;
    
    // Update value displays
    document.getElementById('das-value')!.textContent = this.settings.das.toString();
    document.getElementById('arr-value')!.textContent = this.settings.arr.toString();
    document.getElementById('sd-value')!.textContent = this.settings.sd.toString();
    document.getElementById('bgm-value')!.textContent = this.settings.volume.bgm.toString();
    document.getElementById('se-value')!.textContent = this.settings.volume.se.toString();
  }

  private showSettings(): void {
    document.getElementById('settings-modal')!.style.display = 'flex';
    this.loadSettingsToUI();
  }

  private hideSettings(): void {
    document.getElementById('settings-modal')!.style.display = 'none';
  }

  private applySettings(): void {
    const newSettings: Settings = {
      das: parseInt((document.getElementById('das-slider') as HTMLInputElement).value),
      arr: parseInt((document.getElementById('arr-slider') as HTMLInputElement).value),
      sd: parseInt((document.getElementById('sd-slider') as HTMLInputElement).value),
      volume: {
        bgm: parseInt((document.getElementById('bgm-slider') as HTMLInputElement).value),
        se: parseInt((document.getElementById('se-slider') as HTMLInputElement).value)
      },
      ghost: (document.getElementById('ghost-toggle') as HTMLInputElement).checked,
      grid: (document.getElementById('grid-toggle') as HTMLInputElement).checked,
      theme: (document.getElementById('theme-select') as HTMLSelectElement).value as 'default' | 'high',
      keybinds: this.settings.keybinds
    };
    
    this.settings = newSettings;
    this.engine.updateSettings(newSettings);
    GameStorage.saveSettings(newSettings);
    
    // Apply theme
    document.body.className = newSettings.theme === 'high' ? 'theme-high' : '';
    
    this.showToast('設定を保存しました');
    this.hideSettings();
  }

  private resetSettings(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.loadSettingsToUI();
    this.showToast('設定をデフォルトに戻しました');
  }

  private showHelp(): void {
    document.getElementById('help-modal')!.style.display = 'flex';
  }

  private showToast(message: string): void {
    const toast = document.getElementById('toast')!;
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  async start(): Promise<void> {
    await this.engine.initialize();
    this.engine.startGame();
    
    document.getElementById('start-screen')!.style.display = 'none';
    document.getElementById('game-controls')!.style.display = 'block';
    
    this.isRunning = true;
    this.gameLoop();
  }

  restart(): void {
    this.engine.restart();
    document.getElementById('start-screen')!.style.display = 'none';
    document.getElementById('game-controls')!.style.display = 'block';
    
    if (!this.isRunning) {
      this.isRunning = true;
      this.gameLoop();
    }
  }

  private gameLoop(): void {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    this.engine.update(currentTime);
    this.render();
    
    requestAnimationFrame(() => this.gameLoop());
  }

  private render(): void {
    this.renderer.clear();
    
    const field = this.engine.getField();
    const activePiece = this.engine.getActivePiece();
    const ghostPiece = this.engine.getGhostPiece();
    const hold = this.engine.getHold();
    const queue = this.engine.getQueue();
    const scoreState = this.engine.getScoreState();
    const gameState = this.engine.getGameState();
    
    this.renderer.renderField(field, this.settings.grid);
    
    if (ghostPiece && this.settings.ghost) {
      this.renderer.renderPiece(ghostPiece, 0.3);
    }
    
    if (activePiece) {
      this.renderer.renderPiece(activePiece);
    }
    
    this.renderer.renderNextQueue(queue.pieces, 5);
    this.renderer.renderHold(hold.piece);
    this.renderer.renderHUD(scoreState.score, scoreState.level, scoreState.lines);
    
    if (this.engine.isPausedState()) {
      this.renderer.renderPauseOverlay();
    }
    
    if (gameState === GameState.GAMEOVER) {
      this.renderer.renderGameOver(scoreState.score);
      GameStorage.saveBestScore(scoreState.score);
      
      document.getElementById('game-controls')!.style.display = 'none';
      this.isRunning = false;
    }
  }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TetrisGame();
});