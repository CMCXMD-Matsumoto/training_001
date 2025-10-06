import { Settings } from './types.js';

export interface InputState {
  left: boolean;
  right: boolean;
  down: boolean;
  hardDrop: boolean;
  rotateCW: boolean;
  rotateCCW: boolean;
  hold: boolean;
  pause: boolean;
}

export interface InputTimers {
  dasLeft: number;
  dasRight: number;
  dasDown: number;
  arrLeft: number;
  arrRight: number;
  arrDown: number;
}

export class InputHandler {
  private keys: Record<string, boolean> = {};
  private prevKeys: Record<string, boolean> = {};
  private settings: Settings;
  private timers: InputTimers;
  
  constructor(settings: Settings) {
    this.settings = settings;
    this.timers = {
      dasLeft: 0,
      dasRight: 0,
      dasDown: 0,
      arrLeft: 0,
      arrRight: 0,
      arrDown: 0
    };
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      e.preventDefault();
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.resetTimersForKey(e.code);
      e.preventDefault();
    });
  }

  private resetTimersForKey(code: string): void {
    if (code === this.settings.keybinds.left) {
      this.timers.dasLeft = 0;
      this.timers.arrLeft = 0;
    } else if (code === this.settings.keybinds.right) {
      this.timers.dasRight = 0;
      this.timers.arrRight = 0;
    } else if (code === this.settings.keybinds.down) {
      this.timers.dasDown = 0;
      this.timers.arrDown = 0;
    }
  }

  update(dt: number): InputState {
    const input: InputState = {
      left: this.handleHorizontalInput('left', dt),
      right: this.handleHorizontalInput('right', dt),
      down: this.handleVerticalInput(dt),
      hardDrop: this.isPressed(this.settings.keybinds.hardDrop),
      rotateCW: this.isPressed(this.settings.keybinds.rotateCW),
      rotateCCW: this.isPressed(this.settings.keybinds.rotateCCW),
      hold: this.isPressed(this.settings.keybinds.hold),
      pause: this.isPressed(this.settings.keybinds.pause)
    };

    this.prevKeys = { ...this.keys };
    return input;
  }

  private handleHorizontalInput(direction: 'left' | 'right', dt: number): boolean {
    const key = this.settings.keybinds[direction];
    const dasTimer = direction === 'left' ? 'dasLeft' : 'dasRight';
    const arrTimer = direction === 'left' ? 'arrLeft' : 'arrRight';
    
    if (!this.keys[key]) {
      return false;
    }

    if (this.isPressed(key)) {
      this.timers[dasTimer] = 0;
      this.timers[arrTimer] = 0;
      return true;
    }

    if (this.timers[dasTimer] < this.settings.das) {
      this.timers[dasTimer] += dt;
      return false;
    }

    if (this.settings.arr === 0) {
      return true;
    }

    this.timers[arrTimer] += dt;
    if (this.timers[arrTimer] >= this.settings.arr) {
      this.timers[arrTimer] = 0;
      return true;
    }

    return false;
  }

  private handleVerticalInput(dt: number): boolean {
    const key = this.settings.keybinds.down;
    
    if (!this.keys[key]) {
      return false;
    }

    if (this.isPressed(key)) {
      this.timers.dasDown = 0;
      this.timers.arrDown = 0;
      return true;
    }

    if (this.timers.dasDown < this.settings.das) {
      this.timers.dasDown += dt;
      return false;
    }

    const sdRate = this.settings.sd / 100;
    const effectiveArr = this.settings.arr / sdRate;

    if (sdRate === 1) {
      return true;
    }

    this.timers.arrDown += dt;
    if (this.timers.arrDown >= effectiveArr) {
      this.timers.arrDown = 0;
      return true;
    }

    return false;
  }

  private isPressed(key: string): boolean {
    return this.keys[key] && !this.prevKeys[key];
  }

  updateSettings(settings: Settings): void {
    this.settings = settings;
  }
}