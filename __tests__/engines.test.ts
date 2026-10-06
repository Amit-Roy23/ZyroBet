import {
  mulberry32,
  create2048Game,
  apply2048Move,
  verify2048,
  createMemoryMatchGame,
  verifyMemoryMatch,
  getReactionDelays,
  verifyReaction,
  getWordSprintGame,
  verifyWordSprint,
  getQuizRushQuestions,
  verifyQuizRush,
  getCyberRunnerTrack,
  verifyCyberRunner,
  getColorFlowBoard,
  verifyColorFlow,
  getSoundMatchSequence,
  verifySoundMatch,
  getSniperTargets,
  verifyTargetSniper,
  verify,
} from '@shared/engines';

describe('Shared Pure Engines', () => {
  describe('Mulberry32 PRNG', () => {
    it('is deterministic: same seed produces identical sequences', () => {
      const prng1 = mulberry32(12345);
      const prng2 = mulberry32(12345);

      const seq1 = Array.from({ length: 10 }, () => prng1.next());
      const seq2 = Array.from({ length: 10 }, () => prng2.next());

      expect(seq1).toEqual(seq2);
    });

    it('nextInt returns values strictly within [0, max - 1]', () => {
      const prng = mulberry32(999);
      for (let i = 0; i < 100; i++) {
        const val = prng.nextInt(6);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(6);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it('shuffle creates deterministic permutations without losing elements', () => {
      const prng = mulberry32(42);
      const arr = [1, 2, 3, 4, 5, 6, 7, 8];
      const shuffled = prng.shuffle(arr);

      expect([...shuffled].sort()).toEqual([...arr].sort());
      expect(shuffled).toEqual(mulberry32(42).shuffle(arr));
    });
  });

  describe('2048 Engine', () => {
    it('spawns 2 initial tiles on createGame', () => {
      const game = create2048Game(777);
      expect(game.tiles.length).toBe(2);
      expect(game.score).toBe(0);
      expect(game.moves).toBe(0);
      expect(game.over).toBe(false);
      expect(game.board.filter((v) => v > 0).length).toBe(2);
    });

    it('merges adjacent equal tiles and increases score', () => {
      const game = create2048Game(100);
      game.board = [
        2, 2, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ];
      game.tiles = [
        { id: 1, value: 2, row: 0, col: 0 },
        { id: 2, value: 2, row: 0, col: 1 },
      ];

      const { state, events } = apply2048Move(game, 'L');
      expect(state.moves).toBe(1);
      expect(state.score).toBe(4);
      expect(state.board[0]).toBe(4);
      expect(events.length).toBeGreaterThanOrEqual(2);
    });

    it('prevents double merge in a single move', () => {
      const game = create2048Game(100);
      game.board = [
        4, 4, 4, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ];
      game.tiles = [
        { id: 1, value: 4, row: 0, col: 0 },
        { id: 2, value: 4, row: 0, col: 1 },
        { id: 3, value: 4, row: 0, col: 2 },
      ];

      const { state } = apply2048Move(game, 'L');
      expect(state.board[0]).toBe(8);
      expect(state.board[1]).toBe(4);
      expect(state.score).toBe(8);
    });

    it('verifies a sequence of moves through server replay', () => {
      const seed = 54321;
      let state = create2048Game(seed);
      let moves = '';

      const directions: Array<'U' | 'D' | 'L' | 'R'> = ['U', 'L', 'D', 'R'];
      for (let step = 0; step < 20; step++) {
        for (const dir of directions) {
          const { state: nextState } = apply2048Move(state, dir);
          if (nextState.moves > state.moves) {
            state = nextState;
            moves += dir;
            break;
          }
        }
      }

      const result = verify2048(seed, { moves }, moves.length * 120);
      expect(result.valid).toBe(true);
      expect(result.score).toBe(state.score);
    });
  });

  describe('Memory Match Engine', () => {
    it('creates board with appropriate pairs count for each difficulty', () => {
      const easy = createMemoryMatchGame(123, 'easy');
      expect(easy.cards.length).toBe(12);
      expect(easy.pairsCount).toBe(6);

      const medium = createMemoryMatchGame(123, 'medium');
      expect(medium.cards.length).toBe(16);
      expect(medium.pairsCount).toBe(8);

      const hard = createMemoryMatchGame(123, 'hard');
      expect(hard.cards.length).toBe(20);
      expect(hard.pairsCount).toBe(10);
    });

    it('verifies valid completed game and applies difficulty multiplier', () => {
      const seed = 42;
      const game = createMemoryMatchGame(seed, 'easy');

      const symbolMap = new Map<number, number[]>();
      game.cards.forEach((c) => {
        const list = symbolMap.get(c.symbolId) || [];
        list.push(c.id);
        symbolMap.set(c.symbolId, list);
      });

      const flips: Array<{ i: number; t: number }> = [];
      let t = 500;

      for (const [, pair] of symbolMap.entries()) {
        flips.push({ i: pair[0], t });
        t += 300;
        flips.push({ i: pair[1], t });
        t += 400;
      }

      const result = verifyMemoryMatch(seed, 'easy', { flips });
      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Tap Reaction Engine', () => {
    it('calculates score for valid reaction rounds', () => {
      const seed = 999;
      const delays = getReactionDelays(seed);
      const sumDelays = delays.reduce((a, b) => a + b, 0);

      const payload = {
        rounds: [
          { ms: 250 },
          { ms: 300 },
          { ms: null },
          { ms: 200 },
          { ms: 400 },
        ],
      };

      const result = verifyReaction(seed, payload, sumDelays + 2000);
      expect(result.valid).toBe(true);
      expect(result.score).toBe(750 + 700 + 0 + 800 + 600);
    });
  });

  describe('Word Sprint Engine', () => {
    it('generates deterministic letter bank and validates words', () => {
      const game = getWordSprintGame(123);
      expect(game.letters.length).toBeGreaterThanOrEqual(5);

      const payload = {
        words: game.validWords.slice(0, 3),
        timestamps: [1000, 2000, 3000],
      };

      const result = verifyWordSprint(123, payload, 30000);
      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('Quiz Rush Engine', () => {
    it('generates 10 trivia questions and verifies answers', () => {
      const questions = getQuizRushQuestions(456, 10);
      expect(questions.length).toBe(10);

      const payload = {
        answers: questions.map((q) => ({
          questionId: q.id,
          selectedIndex: q.correctIndex,
          responseMs: 1500,
        })),
      };

      const result = verifyQuizRush(456, payload, 20000);
      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(1000);
    });
  });

  describe('Cyber Runner Engine', () => {
    it('generates track waves and verifies collision-free run', () => {
      const track = getCyberRunnerTrack(789, 20);
      expect(track.length).toBe(20);

      const actions = track.map((wave) => {
        const safeLane = ([0, 1, 2] as const).find((l) => l !== wave.lane) || 0;
        return {
          waveId: wave.id,
          lane: safeLane,
          jumped: false,
          hit: false,
        };
      });

      const result = verifyCyberRunner(789, { actions }, 15000);
      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('Color Flow Engine', () => {
    it('generates board and verifies completed paths', () => {
      const board = getColorFlowBoard(555);
      expect(board.endpoints.length).toBeGreaterThan(0);

      const paths = board.endpoints.map((ep) => ({
        colorId: ep.colorId,
        points: [ep.start, ep.end],
      }));

      const result = verifyColorFlow(555, { paths }, 12000);
      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('Echo Beat Sound Match Engine', () => {
    it('generates sound sequences and verifies completed rounds', () => {
      const sequences = getSoundMatchSequence(888);
      expect(sequences.length).toBeGreaterThan(0);

      const actions = sequences[0].map((note) => ({
        round: 1,
        padIndex: note,
        timestamp: 500,
      }));

      const result = verifySoundMatch(888, { actions }, 5000);
      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('Target Sniper Engine', () => {
    it('generates targets and scores timing accuracy', () => {
      const targets = getSniperTargets(333);
      expect(targets.length).toBe(8);

      const payload = {
        taps: targets.map((t) => ({
          targetId: t.id,
          deltaMs: 15, // Bullseye
          score: 300,
        })),
      };

      const result = verifyTargetSniper(333, payload, 16000);
      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(1500);
    });
  });

  describe('Universal verify router', () => {
    it('routes correctly for all 9 games in the catalog', () => {
      const games = [
        'neon-2048',
        'memory-matrix',
        'tap-reflex',
        'word-sprint',
        'quiz-rush',
        'cyber-runner',
        'color-flow',
        'sound-match',
        'target-sniper',
      ];

      games.forEach((g) => {
        const res = verify(g, undefined, 123, {});
        // Either valid or returns payload error (not "Unknown or unsupported")
        expect(res.reason).not.toContain('Unknown or unsupported');
      });
    });
  });
});
