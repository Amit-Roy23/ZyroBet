// DO NOT EDIT - GENERATED FROM shared/engines/quizRush.ts
import { mulberry32 } from './prng.ts';

export interface TriviaQuestion {
  id: number;
  question: string;
  category: string;
  options: string[];
  correctIndex: number; // 0..3
}

export interface QuizRushPayload {
  answers: {
    questionId: number;
    selectedIndex: number;
    responseMs: number;
  }[];
}

const TRIVIA_BANK = [
  {
    question: 'Which company developed the React and React Native frameworks?',
    category: 'Technology',
    options: ['Meta (Facebook)', 'Google', 'Apple', 'Microsoft'],
    correct: 0,
  },
  {
    question: 'What is the highest number tile in the classic 2048 game?',
    category: 'Gaming',
    options: ['2048', '131072', '65536', '4096'],
    correct: 1,
  },
  {
    question: 'In computer science, what does CPU stand for?',
    category: 'Science',
    options: ['Central Processing Unit', 'Core Power Utility', 'Computer Program Unit', 'Central Parallel User'],
    correct: 0,
  },
  {
    question: 'Which legendary game introduced the character Mario in 1981?',
    category: 'Gaming',
    options: ['Donkey Kong', 'Pac-Man', 'Space Invaders', 'Galaga'],
    correct: 0,
  },
  {
    question: 'What is the approximate speed of light in vacuum?',
    category: 'Physics',
    options: ['300,000 km/s', '150,000 km/s', '1,000,000 km/s', '30,000 km/s'],
    correct: 0,
  },
  {
    question: 'Which programming language uses JSX syntax by default?',
    category: 'Technology',
    options: ['React / JavaScript', 'Python', 'Rust', 'Ruby'],
    correct: 0,
  },
  {
    question: 'What color do you get by combining Red and Green light?',
    category: 'Science',
    options: ['Yellow', 'Magenta', 'Cyan', 'Brown'],
    correct: 0,
  },
  {
    question: 'What does AI stand for in tech and science?',
    category: 'Technology',
    options: ['Artificial Intelligence', 'Automated Interface', 'Algorithmic Integration', 'Audio Input'],
    correct: 0,
  },
  {
    question: 'Which retro video game featured the iconic line "Waka Waka"?',
    category: 'Gaming',
    options: ['Pac-Man', 'Frogger', 'Dig Dug', 'Q*bert'],
    correct: 0,
  },
  {
    question: 'How many bytes are there in one Megabyte (binary 1 MiB)?',
    category: 'Technology',
    options: ['1,048,576', '1,000,000', '524,288', '2,048,000'],
    correct: 0,
  },
  {
    question: 'What is the fastest muscle reflex in the human body?',
    category: 'Biology',
    options: ['Eye blink (Orbicularis oculi)', 'Knee tap jerk', 'Finger flexor', 'Jaw snap'],
    correct: 0,
  },
  {
    question: 'Which element has the chemical symbol "Au"?',
    category: 'Chemistry',
    options: ['Gold', 'Silver', 'Aluminum', 'Copper'],
    correct: 0,
  },
];

export function getQuizRushQuestions(seed: number, count = 10): TriviaQuestion[] {
  const prng = mulberry32(seed);
  const pool = [...TRIVIA_BANK];

  // Fisher-Yates shuffle of questions
  for (let i = pool.length - 1; i > 0; i--) {
    const j = prng.nextInt(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selected = pool.slice(0, Math.min(count, pool.length));

  return selected.map((q, idx) => {
    // Shuffle options deterministically
    const indexedOptions = q.options.map((opt, i) => ({ opt, isCorrect: i === q.correct }));
    for (let i = indexedOptions.length - 1; i > 0; i--) {
      const j = prng.nextInt(i + 1);
      [indexedOptions[i], indexedOptions[j]] = [indexedOptions[j], indexedOptions[i]];
    }

    const options = indexedOptions.map((o) => o.opt);
    const correctIndex = indexedOptions.findIndex((o) => o.isCorrect);

    return {
      id: idx + 1,
      question: q.question,
      category: q.category,
      options,
      correctIndex,
    };
  });
}

export function verifyQuizRush(
  seed: number,
  payload: unknown,
  claimedDurationMs?: number
): { valid: boolean; score: number; durationMs: number; reason?: string } {
  if (!payload || typeof payload !== 'object' || !('answers' in payload)) {
    return { valid: false, score: 0, durationMs: 0, reason: 'Invalid payload: answers array required' };
  }

  const p = payload as QuizRushPayload;
  if (!Array.isArray(p.answers)) {
    return { valid: false, score: 0, durationMs: 0, reason: 'answers must be an array' };
  }

  const questions = getQuizRushQuestions(seed, 10);
  let totalScore = 0;
  let combo = 0;

  for (let i = 0; i < p.answers.length; i++) {
    const ans = p.answers[i];
    const q = questions[i];
    if (!q) break;

    if (ans.selectedIndex === q.correctIndex) {
      combo += 1;
      const basePoints = 100;
      const speedBonus = Math.max(0, Math.floor((10000 - Math.min(10000, ans.responseMs || 3000)) / 100));
      const comboMultiplier = Math.min(3, 1 + combo * 0.2);
      totalScore += Math.round((basePoints + speedBonus) * comboMultiplier);
    } else {
      combo = 0;
    }
  }

  return {
    valid: true,
    score: totalScore,
    durationMs: claimedDurationMs ?? 30000,
  };
}
