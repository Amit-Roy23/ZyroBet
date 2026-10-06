// DO NOT EDIT - GENERATED FROM shared/engines/wordSprint.ts
import { mulberry32 } from './prng.ts';

export interface WordSprintLetterPool {
  baseWord: string;
  letters: string[];
  validWords: string[];
}

export interface WordSprintPayload {
  words: string[];
  timestamps: number[];
}

// Curated letter banks and their valid sub-words
const LETTER_BANKS: { base: string; valid: string[] }[] = [
  {
    base: 'STREAM',
    valid: ['STREAM', 'MASTER', 'TAMERS', 'MATES', 'MEATS', 'STEAM', 'TEAMS', 'TARES', 'TEARS', 'SMART', 'STARE', 'RATES', 'ARTS', 'EAST', 'EATS', 'MATE', 'MATS', 'MEAT', 'RAMS', 'RATE', 'REST', 'SEAT', 'SEAM', 'STAR', 'STEM', 'TEAM', 'TEAR', 'TERM', 'SET', 'SEA', 'RAM', 'RAT', 'MAT', 'EAT', 'TEA', 'ART', 'ARM', 'EAR', 'ERA', 'MET', 'TAR'],
  },
  {
    base: 'PLANET',
    valid: ['PLANET', 'PLANT', 'PANEL', 'PLANE', 'PLATE', 'PLEAT', 'LEAPT', 'PETAL', 'LANE', 'LATE', 'LEAP', 'NEAT', 'PALE', 'PANE', 'PANT', 'PEAL', 'PEAT', 'PELT', 'PLAN', 'PLAT', 'PLEA', 'TALE', 'TAPE', 'TEAL', 'ANT', 'APE', 'ATE', 'EAT', 'ALE', 'LAP', 'LET', 'NET', 'PAL', 'PAN', 'PAT', 'PEN', 'PET', 'TAP', 'TEA', 'TEN'],
  },
  {
    base: 'SILVER',
    valid: ['SILVER', 'LIVERS', 'SLIVER', 'LIVER', 'LIVES', 'RILES', 'RIVES', 'SLIER', 'VEILS', 'EVIL', 'ISLE', 'LEIS', 'LIES', 'LIVE', 'RILE', 'RISE', 'RIVE', 'SIRE', 'SLIM', 'VEIL', 'VILE', 'LIE', 'SIR', 'REV'],
  },
  {
    base: 'GARDEN',
    valid: ['GARDEN', 'DANGER', 'GANDER', 'RANGED', 'ANGER', 'GRADE', 'GRAND', 'RANGED', 'AGED', 'DARE', 'DEAN', 'DEAR', 'DRAG', 'EARN', 'GEAR', 'GRAD', 'GRAN', 'NERD', 'RAGE', 'RAND', 'READ', 'REND', 'AGE', 'AND', 'ARE', 'DAN', 'DEN', 'EAR', 'END', 'ERA', 'RED', 'RAG'],
  },
  {
    base: 'FLIGHT',
    valid: ['FLIGHT', 'LIGHT', 'FILTH', 'GIFT', 'GILT', 'HILT', 'LIFT', 'FIG', 'FIT', 'HIT', 'LIT'],
  },
  {
    base: 'MATRIX',
    valid: ['MATRIX', 'MAXI', 'TAXI', 'TRIM', 'AIR', 'ARM', 'ART', 'MAT', 'MIX', 'RAM', 'RAT', 'RIM', 'TAR'],
  },
  {
    base: 'WONDER',
    valid: ['WONDER', 'DOWNER', 'DROWN', 'OWNED', 'ROWED', 'DOWRY', 'DONE', 'DOWN', 'DREW', 'NERD', 'NODE', 'OWED', 'RODE', 'WORD', 'WORE', 'WORN', 'DEN', 'DEW', 'DOC', 'DOE', 'DON', 'END', 'EWE', 'NEW', 'NOW', 'ONE', 'ORE', 'OWE', 'OWN', 'RED', 'ROD', 'ROW', 'WED', 'WON'],
  },
  {
    base: 'SPARK',
    valid: ['SPARK', 'PARKS', 'PARK', 'PASS', 'RAPS', 'SPAR', 'RAYS', 'SCAR', 'ARK', 'ASK', 'CAP', 'CAR', 'RAP', 'SAP', 'SPA'],
  },
  {
    base: 'CYBER',
    valid: ['CYBER', 'BERYL', 'BEY', 'BYE', 'CRY', 'RYE', 'REC'],
  },
];

export function getWordSprintGame(seed: number): WordSprintLetterPool {
  const prng = mulberry32(seed);
  const bankIndex = prng.nextInt(LETTER_BANKS.length);
  const bank = LETTER_BANKS[bankIndex];

  // Shuffle letters deterministically
  const letters = bank.base.split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = prng.nextInt(i + 1);
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }

  return {
    baseWord: bank.base,
    letters,
    validWords: bank.valid,
  };
}

export function verifyWordSprint(
  seed: number,
  payload: unknown,
  claimedDurationMs?: number
): { valid: boolean; score: number; durationMs: number; reason?: string } {
  if (!payload || typeof payload !== 'object' || !('words' in payload)) {
    return { valid: false, score: 0, durationMs: 0, reason: 'Invalid payload: words array required' };
  }

  const p = payload as WordSprintPayload;
  if (!Array.isArray(p.words)) {
    return { valid: false, score: 0, durationMs: 0, reason: 'words must be an array' };
  }

  const game = getWordSprintGame(seed);
  const validSet = new Set(game.validWords.map((w) => w.toUpperCase()));
  const submittedSet = new Set<string>();

  let score = 0;
  for (const word of p.words) {
    const upper = String(word).toUpperCase().trim();
    if (!submittedSet.has(upper) && validSet.has(upper)) {
      submittedSet.add(upper);
      // Points by length: 3 letters = 100, 4 = 200, 5 = 400, 6+ = 800
      const len = upper.length;
      if (len >= 6) score += 800;
      else if (len === 5) score += 400;
      else if (len === 4) score += 200;
      else if (len === 3) score += 100;
    }
  }

  return {
    valid: true,
    score,
    durationMs: claimedDurationMs ?? 60000,
  };
}
