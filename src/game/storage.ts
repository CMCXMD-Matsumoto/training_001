import { Settings, DEFAULT_SETTINGS } from './types.js';

const STORAGE_KEYS = {
  SETTINGS: 'tetris.settings.v1',
  BEST_SCORE: 'tetris.bestScore.v1',
  SPRINT_40: 'tetris.sprint40.best.v1',
  ULTRA_120: 'tetris.ultra120.best.v1',
  RESUME: 'tetris.resume.v1'
};

export class GameStorage {
  static saveSettings(settings: Settings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }

  static loadSettings(): Settings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  static saveBestScore(score: number): void {
    try {
      const current = this.loadBestScore();
      if (score > current) {
        localStorage.setItem(STORAGE_KEYS.BEST_SCORE, score.toString());
      }
    } catch (error) {
      console.warn('Failed to save best score:', error);
    }
  }

  static loadBestScore(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BEST_SCORE);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.warn('Failed to load best score:', error);
      return 0;
    }
  }

  static saveSprintTime(time: number): void {
    try {
      const current = this.loadSprintTime();
      if (current === 0 || time < current) {
        localStorage.setItem(STORAGE_KEYS.SPRINT_40, time.toString());
      }
    } catch (error) {
      console.warn('Failed to save sprint time:', error);
    }
  }

  static loadSprintTime(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SPRINT_40);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.warn('Failed to load sprint time:', error);
      return 0;
    }
  }

  static saveUltraScore(score: number): void {
    try {
      const current = this.loadUltraScore();
      if (score > current) {
        localStorage.setItem(STORAGE_KEYS.ULTRA_120, score.toString());
      }
    } catch (error) {
      console.warn('Failed to save ultra score:', error);
    }
  }

  static loadUltraScore(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ULTRA_120);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.warn('Failed to load ultra score:', error);
      return 0;
    }
  }

  static clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }
}