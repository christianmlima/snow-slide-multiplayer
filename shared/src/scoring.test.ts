import { describe, it, expect, beforeEach } from 'vitest';

class ScoringSystem {
  public calculateTrickPoints(rotationDeltaDegrees: number, inAirTimeMs: number, comboMultiplier: number): number {
    if (inAirTimeMs < 400) return 0;
    const basePoints = Math.floor(Math.abs(rotationDeltaDegrees) / 360) * 500;
    const airTimeBonus = Math.floor(inAirTimeMs / 100) * 50;
    return Math.round((basePoints + airTimeBonus) * comboMultiplier);
  }
}

describe('ScoringSystem - Trick & Economy Validation', () => {
  let scoring: ScoringSystem;

  beforeEach(() => {
    scoring = new ScoringSystem();
  });

  it('should award correct points for a clean 360 spin during a jump', () => {
    const rotationDelta = 360;
    const airTime = 1200;
    const multiplier = 1.5;

    const points = scoring.calculateTrickPoints(rotationDelta, airTime, multiplier);
    expect(points).toBe(1650);
  });

  it('should award zero points if air time is less than threshold', () => {
    const rotationDelta = 360;
    const airTime = 200;
    const multiplier = 1.0;

    const points = scoring.calculateTrickPoints(rotationDelta, airTime, multiplier);
    expect(points).toBe(0);
  });
});
