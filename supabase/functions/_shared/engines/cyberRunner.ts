// DO NOT EDIT - GENERATED FROM shared/engines/cyberRunner.ts
import { mulberry32 } from './prng.ts';

export type RunnerLane = 0 | 1 | 2; // 0=Left, 1=Center, 2=Right
export type ObstacleType = 'laser_gate' | 'barrier' | 'drone';

export interface ObstacleWave {
  id: number;
  lane: RunnerLane;
  type: ObstacleType;
  coinLane?: RunnerLane;
}

export interface CyberRunnerPayload {
  wavesSurvived: number;
  coinsCollected: number;
  actions: {
    waveId: number;
    lane: RunnerLane;
    jumped: boolean;
    hit: boolean;
  }[];
}

export function getCyberRunnerTrack(seed: number, totalWaves = 40): ObstacleWave[] {
  const prng = mulberry32(seed);
  const waves: ObstacleWave[] = [];

  const types: ObstacleType[] = ['barrier', 'laser_gate', 'drone'];

  for (let i = 0; i < totalWaves; i++) {
    const lane = prng.nextInt(3) as RunnerLane;
    const type = types[prng.nextInt(types.length)];

    // Coin can be in one of the other 2 lanes
    const freeLanes = ([0, 1, 2] as RunnerLane[]).filter((l) => l !== lane);
    const coinLane = prng.nextInt(2) === 0 ? freeLanes[prng.nextInt(freeLanes.length)] : undefined;

    waves.push({
      id: i + 1,
      lane,
      type,
      coinLane,
    });
  }

  return waves;
}

export function verifyCyberRunner(
  seed: number,
  payload: unknown,
  claimedDurationMs?: number
): { valid: boolean; score: number; durationMs: number; reason?: string } {
  if (!payload || typeof payload !== 'object' || !('actions' in payload)) {
    return { valid: false, score: 0, durationMs: 0, reason: 'Invalid payload: actions array required' };
  }

  const p = payload as CyberRunnerPayload;
  if (!Array.isArray(p.actions)) {
    return { valid: false, score: 0, durationMs: 0, reason: 'actions must be an array' };
  }

  const track = getCyberRunnerTrack(seed, 40);
  let score = 0;
  let coins = 0;
  let waves = 0;

  for (let i = 0; i < p.actions.length; i++) {
    const act = p.actions[i];
    const wave = track[i];
    if (!wave) break;

    // Check collision: if player is in obstacle lane and did not jump over barrier
    const isCollision = act.lane === wave.lane && (!act.jumped || wave.type === 'laser_gate');

    if (isCollision) {
      // Runner crashes and game ends
      break;
    }

    waves += 1;
    score += 50; // 50 pts per wave survived

    if (wave.coinLane !== undefined && act.lane === wave.coinLane) {
      coins += 1;
      score += 150; // 150 pts per collected coin
    }
  }

  // Bonus for completing full run
  if (waves >= track.length) {
    score += 1000;
  }

  return {
    valid: true,
    score,
    durationMs: claimedDurationMs ?? waves * 800,
  };
}
