import { mulberry32, PRNG } from './prng';

export type MoveDirection = 'U' | 'D' | 'L' | 'R';

export interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
}

export interface TileEvent {
  id: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  value: number;
  mergedIntoId?: number;
  spawned?: boolean;
}

export interface Game2048State {
  board: number[]; // 16 elements (4x4)
  tiles: Tile[];
  score: number;
  moves: number;
  over: boolean;
  won: boolean;
  nextTileId: number;
  _prng: PRNG;
}

export interface Game2048Payload {
  moves: string;
}

/**
 * Creates a new 2048 game with the specified seed.
 * Spawns two initial tiles.
 */
export function create2048Game(seed: number): Game2048State {
  const prng = mulberry32(seed);
  const board = new Array(16).fill(0);
  const tiles: Tile[] = [];
  let nextTileId = 1;

  // Spawn first tile
  const idx1 = prng.nextInt(16);
  const val1 = prng.next() < 0.9 ? 2 : 4;
  board[idx1] = val1;
  tiles.push({
    id: nextTileId++,
    value: val1,
    row: Math.floor(idx1 / 4),
    col: idx1 % 4,
  });

  // Spawn second tile from remaining empty spots
  const emptyIndices: number[] = [];
  for (let i = 0; i < 16; i++) {
    if (board[i] === 0) emptyIndices.push(i);
  }
  const idx2 = emptyIndices[prng.nextInt(emptyIndices.length)];
  const val2 = prng.next() < 0.9 ? 2 : 4;
  board[idx2] = val2;
  tiles.push({
    id: nextTileId++,
    value: val2,
    row: Math.floor(idx2 / 4),
    col: idx2 % 4,
  });

  return {
    board,
    tiles,
    score: 0,
    moves: 0,
    over: false,
    won: false,
    nextTileId,
    _prng: prng,
  };
}

/**
 * Checks if the board has any valid moves left.
 */
export function isGameOver(board: number[]): boolean {
  for (let i = 0; i < 16; i++) {
    if (board[i] === 0) return false;
    const r = Math.floor(i / 4);
    const c = i % 4;
    // Check right neighbor
    if (c < 3 && board[i] === board[i + 1]) return false;
    // Check down neighbor
    if (r < 3 && board[i] === board[i + 4]) return false;
  }
  return true;
}

/**
 * Applies a move in direction 'U' | 'D' | 'L' | 'R'.
 * Returns the updated state and animation events.
 * If move changes nothing, returns unchanged state with empty events.
 */
export function apply2048Move(
  state: Game2048State,
  dir: MoveDirection
): { state: Game2048State; events: TileEvent[] } {
  if (state.over) {
    return { state, events: [] };
  }

  const board = [...state.board];
  const currentTiles = [...state.tiles];
  let nextTileId = state.nextTileId;
  let scoreDelta = 0;
  let moved = false;
  const events: TileEvent[] = [];
  const resultingTiles: Tile[] = [];

  // Helper to get tile at (r, c)
  const getTileAt = (r: number, c: number): Tile | undefined => {
    return currentTiles.find((t) => t.row === r && t.col === c);
  };

  // Process 4 lines based on direction
  for (let line = 0; line < 4; line++) {
    const coords: Array<{ r: number; c: number }> = [];
    for (let pos = 0; pos < 4; pos++) {
      if (dir === 'L') coords.push({ r: line, c: pos });
      else if (dir === 'R') coords.push({ r: line, c: 3 - pos });
      else if (dir === 'U') coords.push({ r: pos, c: line });
      else if (dir === 'D') coords.push({ r: 3 - pos, c: line });
    }

    // Extract non-zero values and their source tiles along this line
    const lineTiles: Array<{ tile: Tile; r: number; c: number }> = [];
    for (const pt of coords) {
      const idx = pt.r * 4 + pt.c;
      if (board[idx] !== 0) {
        const t = getTileAt(pt.r, pt.c);
        if (t) {
          lineTiles.push({ tile: t, r: pt.r, c: pt.c });
        }
      }
    }

    let targetIdx = 0;
    let i = 0;
    while (i < lineTiles.length) {
      const current = lineTiles[i];
      const targetCoord = coords[targetIdx];

      // Check for merge with next tile in line
      if (i + 1 < lineTiles.length && current.tile.value === lineTiles[i + 1].tile.value) {
        const next = lineTiles[i + 1];
        const mergedVal = current.tile.value * 2;
        scoreDelta += mergedVal;
        moved = true;

        const newId = nextTileId++;

        // Event for current tile sliding into target
        events.push({
          id: current.tile.id,
          fromRow: current.tile.row,
          fromCol: current.tile.col,
          toRow: targetCoord.r,
          toCol: targetCoord.c,
          value: current.tile.value,
          mergedIntoId: newId,
        });

        // Event for next tile sliding into target
        events.push({
          id: next.tile.id,
          fromRow: next.tile.row,
          fromCol: next.tile.col,
          toRow: targetCoord.r,
          toCol: targetCoord.c,
          value: next.tile.value,
          mergedIntoId: newId,
        });

        // New merged tile created at target
        resultingTiles.push({
          id: newId,
          value: mergedVal,
          row: targetCoord.r,
          col: targetCoord.c,
        });

        i += 2;
      } else {
        // No merge: tile simply slides to targetCoord
        if (current.tile.row !== targetCoord.r || current.tile.col !== targetCoord.c) {
          moved = true;
        }

        events.push({
          id: current.tile.id,
          fromRow: current.tile.row,
          fromCol: current.tile.col,
          toRow: targetCoord.r,
          toCol: targetCoord.c,
          value: current.tile.value,
        });

        resultingTiles.push({
          id: current.tile.id,
          value: current.tile.value,
          row: targetCoord.r,
          col: targetCoord.c,
        });

        i += 1;
      }
      targetIdx++;
    }
  }

  if (!moved) {
    return { state, events: [] };
  }

  // Update board from resultingTiles
  board.fill(0);
  for (const t of resultingTiles) {
    board[t.row * 4 + t.col] = t.value;
  }

  // Spawn new tile in empty spot
  const emptySpots: number[] = [];
  for (let idx = 0; idx < 16; idx++) {
    if (board[idx] === 0) emptySpots.push(idx);
  }

  if (emptySpots.length > 0) {
    const spawnIdx = emptySpots[state._prng.nextInt(emptySpots.length)];
    const spawnVal = state._prng.next() < 0.9 ? 2 : 4;
    const spawnRow = Math.floor(spawnIdx / 4);
    const spawnCol = spawnIdx % 4;
    const spawnId = nextTileId++;

    board[spawnIdx] = spawnVal;

    const newTile: Tile = {
      id: spawnId,
      value: spawnVal,
      row: spawnRow,
      col: spawnCol,
    };
    resultingTiles.push(newTile);

    events.push({
      id: spawnId,
      fromRow: spawnRow,
      fromCol: spawnCol,
      toRow: spawnRow,
      toCol: spawnCol,
      value: spawnVal,
      spawned: true,
    });
  }

  const newScore = state.score + scoreDelta;
  const won = state.won || resultingTiles.some((t) => t.value >= 2048);
  const over = isGameOver(board);

  const nextState: Game2048State = {
    board,
    tiles: resultingTiles,
    score: newScore,
    moves: state.moves + 1,
    over,
    won,
    nextTileId,
    _prng: state._prng,
  };

  return { state: nextState, events };
}

/**
 * Pure engine verification for 2048 session.
 */
export function verify2048(
  seed: number,
  payload: unknown,
  claimedDurationMs?: number
): { valid: boolean; score: number; durationMs: number; reason?: string } {
  if (!payload || typeof payload !== 'object' || !('moves' in payload)) {
    return { valid: false, score: 0, durationMs: 0, reason: 'Invalid payload: moves string required' };
  }

  const movesStr = (payload as { moves: unknown }).moves;
  if (typeof movesStr !== 'string') {
    return { valid: false, score: 0, durationMs: 0, reason: 'Invalid payload: moves must be string' };
  }

  if (movesStr.length > 6000) {
    return { valid: false, score: 0, durationMs: 0, reason: 'Move limit exceeded (> 6000 moves)' };
  }

  const movesCount = movesStr.length;
  const minRequiredDurationMs = movesCount * 90;

  if (claimedDurationMs !== undefined && claimedDurationMs < minRequiredDurationMs) {
    return {
      valid: false,
      score: 0,
      durationMs: claimedDurationMs,
      reason: `Duration ${claimedDurationMs}ms is impossibly fast for ${movesCount} moves (min ${minRequiredDurationMs}ms)`,
    };
  }

  let state = create2048Game(seed);

  for (let i = 0; i < movesStr.length; i++) {
    const char = movesStr[i] as MoveDirection;
    if (!['U', 'D', 'L', 'R'].includes(char)) {
      return { valid: false, score: 0, durationMs: 0, reason: `Invalid move character: ${char} at move ${i + 1}` };
    }

    const prevMoves = state.moves;
    const { state: nextState } = apply2048Move(state, char);

    // Ineffective moves are prohibited
    if (nextState.moves === prevMoves) {
      return {
        valid: false,
        score: state.score,
        durationMs: claimedDurationMs ?? 0,
        reason: `Ineffective move '${char}' rejected at step ${i + 1}`,
      };
    }

    state = nextState;
  }

  return {
    valid: true,
    score: state.score,
    durationMs: claimedDurationMs ?? Math.max(minRequiredDurationMs, 1000),
  };
}
