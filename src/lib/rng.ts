// Simple seeded RNG for deterministic galaxy generation
// TODO: Replace with proper seeded RNG library if needed

export class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Simple LCG (Linear Congruential Generator)
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % Math.pow(2, 32);
    return this.seed / Math.pow(2, 32);
  }

  // Random number between min and max (inclusive)
  range(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  // Random float between min and max
  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Random choice from array
  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

// Non-seeded RNG for non-deterministic operations
export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}
