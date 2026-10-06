// DO NOT EDIT - GENERATED FROM shared/engines/colorFlow.ts
import { mulberry32 } from './prng.ts';

export interface ColorFlowPoint {
  r: number;
  c: number;
}

export interface ColorEndpoint {
  colorId: number;
  start: ColorFlowPoint;
  end: ColorFlowPoint;
  colorHex: string;
}

export interface ColorFlowGrid {
  size: number;
  endpoints: ColorEndpoint[];
}

export interface ColorFlowPayload {
  paths: {
    colorId: number;
    points: ColorFlowPoint[];
  }[];
  durationMs: number;
}

const COLOR_PALETTE = ['#00E676', '#00E5FF', '#FFD700', '#FF4081', '#E040FB'];

// Curated valid 5x5 flow board templates
const BOARD_TEMPLATES: {
  endpoints: { colorId: number; start: ColorFlowPoint; end: ColorFlowPoint }[];
}[] = [
  {
    endpoints: [
      { colorId: 0, start: { r: 0, c: 0 }, end: { r: 4, c: 0 } },
      { colorId: 1, start: { r: 0, c: 1 }, end: { r: 0, c: 4 } },
      { colorId: 2, start: { r: 1, c: 1 }, end: { r: 3, c: 3 } },
      { colorId: 3, start: { r: 4, c: 1 }, end: { r: 4, c: 4 } },
      { colorId: 4, start: { r: 2, c: 2 }, end: { r: 3, c: 1 } },
    ],
  },
  {
    endpoints: [
      { colorId: 0, start: { r: 0, c: 0 }, end: { r: 0, c: 3 } },
      { colorId: 1, start: { r: 1, c: 0 }, end: { r: 4, c: 0 } },
      { colorId: 2, start: { r: 1, c: 2 }, end: { r: 4, c: 2 } },
      { colorId: 3, start: { r: 2, c: 4 }, end: { r: 4, c: 4 } },
      { colorId: 4, start: { r: 0, c: 4 }, end: { r: 2, c: 3 } },
    ],
  },
  {
    endpoints: [
      { colorId: 0, start: { r: 0, c: 1 }, end: { r: 3, c: 1 } },
      { colorId: 1, start: { r: 0, c: 2 }, end: { r: 4, c: 2 } },
      { colorId: 2, start: { r: 1, c: 4 }, end: { r: 4, c: 4 } },
      { colorId: 3, start: { r: 0, c: 0 }, end: { r: 4, c: 0 } },
      { colorId: 4, start: { r: 3, c: 3 }, end: { r: 4, c: 3 } },
    ],
  },
];

export function getColorFlowBoard(seed: number): ColorFlowGrid {
  const prng = mulberry32(seed);
  const template = BOARD_TEMPLATES[prng.nextInt(BOARD_TEMPLATES.length)];

  const endpoints: ColorEndpoint[] = template.endpoints.map((ep) => ({
    colorId: ep.colorId,
    start: ep.start,
    end: ep.end,
    colorHex: COLOR_PALETTE[ep.colorId % COLOR_PALETTE.length],
  }));

  return {
    size: 5,
    endpoints,
  };
}

export function verifyColorFlow(
  seed: number,
  payload: unknown,
  claimedDurationMs?: number
): { valid: boolean; score: number; durationMs: number; reason?: string } {
  if (!payload || typeof payload !== 'object' || !('paths' in payload)) {
    return { valid: false, score: 0, durationMs: 0, reason: 'Invalid payload: paths array required' };
  }

  const p = payload as ColorFlowPayload;
  if (!Array.isArray(p.paths)) {
    return { valid: false, score: 0, durationMs: 0, reason: 'paths must be an array' };
  }

  const board = getColorFlowBoard(seed);
  let completedPairs = 0;
  const occupiedCells = new Set<string>();

  for (const path of p.paths) {
    const ep = board.endpoints.find((e) => e.colorId === path.colorId);
    if (!ep || !path.points || path.points.length < 2) continue;

    const first = path.points[0];
    const last = path.points[path.points.length - 1];

    const connectsStartToEnd =
      (first.r === ep.start.r && first.c === ep.start.c && last.r === ep.end.r && last.c === ep.end.c) ||
      (first.r === ep.end.r && first.c === ep.end.c && last.r === ep.start.r && last.c === ep.start.c);

    if (connectsStartToEnd) {
      completedPairs += 1;
      for (const pt of path.points) {
        occupiedCells.add(`${pt.r},${pt.c}`);
      }
    }
  }

  const baseScore = completedPairs * 200;
  const boardFillBonus = Math.floor((occupiedCells.size / (board.size * board.size)) * 500);
  const timeBonus = Math.max(0, 1000 - Math.floor((claimedDurationMs || 10000) / 100));

  const totalScore = baseScore + boardFillBonus + (completedPairs === board.endpoints.length ? timeBonus : 0);

  return {
    valid: true,
    score: totalScore,
    durationMs: claimedDurationMs ?? 15000,
  };
}
