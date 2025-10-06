import { PieceKind, Queue } from './types.js';
import { SeededRandom } from '../util/rng.js';

const ALL_PIECES: PieceKind[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export class SevenBagRandomizer {
  private rng: SeededRandom;
  private currentBag: PieceKind[];
  private bagIndex: number;

  constructor(seed?: number) {
    this.rng = new SeededRandom(seed);
    this.currentBag = [];
    this.bagIndex = 0;
    this.generateNewBag();
  }

  private generateNewBag(): void {
    this.currentBag = [...ALL_PIECES];
    this.shuffleBag();
    this.bagIndex = 0;
  }

  private shuffleBag(): void {
    for (let i = this.currentBag.length - 1; i > 0; i--) {
      const j = this.rng.nextInt(i + 1);
      [this.currentBag[i], this.currentBag[j]] = [this.currentBag[j], this.currentBag[i]];
    }
  }

  next(): PieceKind {
    if (this.bagIndex >= this.currentBag.length) {
      this.generateNewBag();
    }
    
    return this.currentBag[this.bagIndex++];
  }

  peek(count: number = 5): PieceKind[] {
    const result: PieceKind[] = [];
    let tempBag = [...this.currentBag];
    let tempBagIndex = this.bagIndex;
    
    for (let i = 0; i < count; i++) {
      if (tempBagIndex >= tempBag.length) {
        const newBag = [...ALL_PIECES];
        const tempRng = new SeededRandom(this.rng.getSeed());
        for (let j = newBag.length - 1; j > 0; j--) {
          const k = tempRng.nextInt(j + 1);
          [newBag[j], newBag[k]] = [newBag[k], newBag[j]];
        }
        tempBag = newBag;
        tempBagIndex = 0;
      }
      
      result.push(tempBag[tempBagIndex++]);
    }
    
    return result;
  }

  getSeed(): number {
    return this.rng.getSeed();
  }
}

export function createQueue(seed?: number): Queue {
  const randomizer = new SevenBagRandomizer(seed);
  return {
    pieces: [],
    bagIndex: 0
  };
}

export function fillQueue(queue: Queue, randomizer: SevenBagRandomizer, count: number = 5): void {
  while (queue.pieces.length < count) {
    queue.pieces.push(randomizer.next());
  }
}

export function getNextPiece(queue: Queue, randomizer: SevenBagRandomizer): PieceKind {
  fillQueue(queue, randomizer, 5);
  return queue.pieces.shift()!;
}