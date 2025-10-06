export type SoundEffect = 'move' | 'rotate' | 'harddrop' | 'lock' | 'lineclear' | 'levelup';

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<SoundEffect, AudioBuffer> = new Map();
  private volume: { bgm: number; se: number } = { bgm: 0.6, se: 0.6 };
  private initialized = false;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized || !this.audioContext) return;

    try {
      await this.audioContext.resume();
      await this.loadSounds();
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize sound system:', error);
    }
  }

  private async loadSounds(): Promise<void> {
    if (!this.audioContext) return;

    const soundFiles: Record<SoundEffect, string> = {
      move: '/sounds/move.mp3',
      rotate: '/sounds/rotate.mp3',
      harddrop: '/sounds/harddrop.mp3',
      lock: '/sounds/lock.mp3',
      lineclear: '/sounds/lineclear.mp3',
      levelup: '/sounds/levelup.mp3'
    };

    const loadPromises = Object.entries(soundFiles).map(async ([name, url]) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        this.sounds.set(name as SoundEffect, audioBuffer);
      } catch (error) {
        console.warn(`Failed to load sound ${name}:`, error);
        this.createSilentBuffer(name as SoundEffect);
      }
    });

    await Promise.all(loadPromises);
  }

  private createSilentBuffer(name: SoundEffect): void {
    if (!this.audioContext) return;
    
    const buffer = this.audioContext.createBuffer(1, 1, this.audioContext.sampleRate);
    this.sounds.set(name, buffer);
  }

  play(effect: SoundEffect): void {
    if (!this.initialized || !this.audioContext || this.volume.se === 0) return;

    const buffer = this.sounds.get(effect);
    if (!buffer) return;

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = this.volume.se / 100;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
    } catch (error) {
      console.warn(`Failed to play sound ${effect}:`, error);
    }
  }

  setVolume(bgm: number, se: number): void {
    this.volume.bgm = Math.max(0, Math.min(100, bgm)) / 100;
    this.volume.se = Math.max(0, Math.min(100, se)) / 100;
  }

  mute(): void {
    this.volume.bgm = 0;
    this.volume.se = 0;
  }

  unmute(): void {
    this.volume.bgm = 0.6;
    this.volume.se = 0.6;
  }
}