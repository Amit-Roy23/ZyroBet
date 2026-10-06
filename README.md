# ZyroBet (Casual Skill Mini-Games Mobile App)

> **Pure Casual Mini-Games • Virtual Coins Only**  
> Built with Expo SDK 57, React Native (New Architecture enabled), TypeScript Strict, Expo Router, Reanimated UI worklets, and Supabase.

---

## 🛡️ Core Product & Compliance Rules

- **Virtual Coins Only:** Coins have **NO cash value** and can **NEVER** be withdrawn, redeemed, or exchanged for real money, goods, or prizes.
- **No Real-Money Gambling:** No casino-style mechanics (no slots, roulette, crash, betting, or loot-box odds).
- **Skill-Based Deterministic Games:** Every mini-game is skill, memory, knowledge, or reaction-based (Neon 2048, Memory Matrix, Tap Reflex). Rewards are strictly deterministic from score; no randomness in payouts.
- **Security-First Virtual Economy:** The client can never write coin balances, scores, or ledger entries directly. All balance updates and score certifications happen via server-side verification and atomic RPC transactions (`finish_game_session`, `apply_coin_transaction`) with RLS enforcement and advisory locks.

---

## 🕹️ Mini-Games & Server Replay Architecture

### 1. Shared Pure Engines (`shared/engines/`)
Zero-dependency, pure TypeScript engines shared across the mobile client and Supabase Edge Functions:
- **`prng.ts`**: Deterministic `mulberry32(seed)` PRNG supplying `next()`, `nextInt(max)`, and Fisher-Yates `shuffle(arr)`.
- **`game2048.ts`**: 4x4 slide and merge engine. Prevents chained double-merges, calculates slide animations via event logs, and spawns tiles (90% 2, 10% 4) at PRNG-determined empty cells.
  - **Replay Verifier (`verify2048`)**: Replays all move directions (`"UDLR..."`), checks effectiveness of each move, computes true score on the server, and ensures claimed duration satisfies `durationMs >= moves.length * 90ms`.
- **`memoryMatch.ts`**: Responsive card grid with 3 difficulties: Easy (3x4, 6 pairs), Medium (4x4, 8 pairs), Hard (4x5, 10 pairs).
  - **Formula**: `score = max(50, pairs*100 + timeBonus - missPenalty) * difficultyMultiplier`.
  - **Replay Verifier (`verifyMemoryMatch`)**: Validates strictly increasing flip timestamps (`t >= 150ms` delta), prohibits flipping already matched cards or repeating the same card in a pair, and verifies all pairs match.
- **`reaction.ts`**: 5 rounds with server-seeded delays (1500ms – 4500ms).
  - **Formula**: `roundScore = ms === null ? 0 : max(0, 1000 - ms)`. False starts score 0 without repeating rounds.
  - **Replay Verifier (`verifyReaction`)**: Asserts exactly 5 rounds, valid reaction windows (`80ms <= ms <= 2000ms` or null), and `durationMs >= sum(delays)`.
- **Universal Verifier (`index.ts`)**: `verify(gameId, difficulty, seed, payload, durationMs)`.

### 2. Engine Sync Workflow
To share pure engines with Deno-based Supabase Edge Functions without code duplication:
```bash
# Sync shared engines to Edge Functions (adds .ts extensions for Deno runtime)
npm run engines:sync

# Check synchronization in CI / pre-commit hook (fails if out of sync)
npm run engines:check
```
The target folder `supabase/functions/_shared/engines` is tracked in git with a "DO NOT EDIT" notice.

---

## 🗄️ Database Schema & Server-Side Security (`supabase/migrations/20261006000003_games.sql`)

### Tables & Views
- **`games`**: `(id, slug, title, category, thumb_url, is_new, is_hot, sort_order, enabled)`.
- **`game_config`**: `(game_id, per_session_max, score_divisor, min_reward, daily_cap, min_duration_ms, max_session_age_s)`.
- **`game_global_config`**: Global daily cap configuration (`daily_cap` default `300`).
- **`game_sessions`**: `(id, user_id, game_id, difficulty, seed, status, started_at, finished_at, score, duration_ms, coins_awarded, reject_reason, client_version)`.
- **`game_scores`**: `(id, user_id, game_id, difficulty, score, session_id, created_at)` with index `(game_id, difficulty, score desc)` for leaderboards.
- **`game_daily_earnings`**: `(user_id, day, game_id, coins)` tracking daily caps.
- **`v_game_best`**: View computing all-time best scores per user/game/difficulty.

### Row-Level Security (RLS)
- Authenticated users may `SELECT` active games, configs, and their own sessions, scores, and earnings.
- Client `INSERT`, `UPDATE`, and `DELETE` policies are **completely denied** across all game tables.

### `finish_game_session` RPC
- `SECURITY DEFINER` with transaction-level advisory locks `pg_advisory_xact_lock(hashtext(p_user::text))`.
- Validates session ownership, active status, and age (`<= max_session_age_s`).
- **Deterministic Reward Formula**:
  $$\text{raw\_reward} = \min(\text{per\_session\_max}, \max(\text{min\_reward}, \lfloor\text{score} / \text{score\_divisor}\rfloor))$$
- **Cap Bounding**:
  $$\text{coins} = \max(0, \min(\text{raw\_reward}, \text{game\_daily\_left}, \text{global\_daily\_left}))$$
- Invokes `apply_coin_transaction` atomically if coins > 0, updates `game_daily_earnings`, records `game_scores`, and marks session `finished`.
- **Idempotent**: Re-invoking with a finished session returns identical results without duplicate coins.

---

## ⚡ Edge Functions (`supabase/functions/`)

- **`game-start` (POST)**: Validates game enabled state, expires old active sessions for the user, generates a secure random 32-bit seed, creates an active `game_sessions` record, and returns `{ sessionId, seed, difficulty, serverNow, dailyStatus }`.
- **`game-finish` (POST)**:
  1. Zod schema validation per game payload.
  2. Verifies session ownership and status (`active`).
  3. Validates server elapsed time (`durationMs <= elapsed + 3000ms` tolerance and `>= min_duration_ms`).
  4. Runs shared engine `verify()`. On failure, marks session `rejected` with typed 422 error.
  5. On success, calls `finish_game_session` and returns full rewards summary.
- **`game-daily-status` (GET)**: Computes user's today progress against per-game and global caps (using `REWARD_TIMEZONE`), plus current best scores.

---

## 🎛️ Tuning Game Rewards

All game reward tuning is managed directly via SQL rows without touching client code:

```sql
-- View current game configurations
SELECT g.id, g.title, c.per_session_max, c.score_divisor, c.min_reward, c.daily_cap, c.min_duration_ms
FROM games g
JOIN game_config c ON c.game_id = g.id;

-- Example: Adjust Neon 2048 reward parameters
UPDATE game_config
SET per_session_max = 60, score_divisor = 80, min_reward = 3, daily_cap = 200
WHERE game_id = 'game-2048';

-- Example: Adjust global daily cap for all games
UPDATE game_global_config SET daily_cap = 500;
```

---

## 🎮 Shared Game Host & Client Architecture (`src/features/games/`)

- **Route (`app/game/[id].tsx`)**: Thin container delegating directly to `<GameHost />`.
- **State Machine**: `loading` ➔ `difficultyPicker` (if applicable) ➔ `countdown` (3, 2, 1, GO!) ➔ `playing` 🔁 `paused` ➔ `finishing` ➔ `result`.
- **Screen Wake Lock (`expo-keep-awake`)**: Active during gameplay.
- **AppState Background Auto-Pause**: Automatically pauses games when minimized.
- **Hardware & Gesture Back Protection**: Displays confirmation dialog before forfeiting an active session.
- **Network Resilience & Pending Submissions**: If score submission encounters a network error, the payload is stored in MMKV (`pendingSubmissions.ts`) and retried automatically on app foreground or restart.
- **Practice Mode**: If session initialization fails offline, the game generates a local seed and flags `session.practice = true`. Players can enjoy the mini-game without coins, and local best scores are saved to MMKV.

---

## 🧪 Testing & Verification Suites

### 1. Run Complete Automated Test Suites
```bash
# TypeScript strict typechecking (0 errors)
npm run typecheck

# ESLint verification (0 warnings, 0 errors)
npm run lint

# Jest Unit & Component Tests
npm test

# Check Pure Engines Sync
npm run engines:check

# Expo Doctor configuration checks
npm run doctor

# Verify Native Fingerprint matches baseline (OTA Safety Check)
npm run fingerprint:check
```

### 2. Native Development Builds (EAS Build)
When native code or plugins are configured, generate dev client binaries:
```bash
# Android Development Build (APK / AAB)
eas build --profile development --platform android

# iOS Development Build (Simulator / Device)
eas build --profile development --platform ios
```

### 3. Publishing OTA Updates (EAS Update)
Deploy JavaScript and asset updates over-the-air without app store reviews:
```bash
# Publish to Preview Channel (for internal testing)
npm run update:preview -- --message "Describe updates"

# Publish to Production Channel (for live users)
npm run update:production -- --message "Describe production release"

# Rollback an update if needed
eas update:rollback --channel production
```
See [docs/OTA_PLAYBOOK.md](docs/OTA_PLAYBOOK.md) for full release guidelines and restrictions.

### 4. Native Smoke Test Screen
Access the live native module diagnostic suite via **Account > Developer Tools > Native Smoke Test** (or `/dev/native-check`) in dev builds to verify all 25+ native modules, permissions, and runtime hashes.

### 2. Run SQL Database Verification Scripts
To verify database caps, advisory locks, idempotency, and RLS policies:
```bash
# Mini-Games & Reward Caps verification
psql -d postgres -f supabase/tests/games_test.sql

# Wallet & Ledger verification
psql -d postgres -f supabase/tests/wallet_ledger_test.sql

# Daily 7-Day Rewards verification
psql -d postgres -f supabase/tests/daily_rewards_test.sql
```

---

## 📁 Architecture & Folder Structure

```
zyrobet/
├─ app/                         # Expo Router typed routes (thin screens)
│  ├─ _layout.tsx               # QueryClient, GestureHandler, Anonymous Session Bootstrap
│  ├─ index.tsx                 # Route gate
│  ├─ (tabs)/
│  │  ├─ _layout.tsx            # Bottom tab bar with raised center Daily Reward button
│  │  ├─ home.tsx               # Lobby Screen with Live useGames() and Daily Game Coins Chip
│  │  ├─ promotions.tsx         # Tournaments & Daily Missions
│  │  ├─ rewards.tsx            # Daily 7-Day Streak Claim
│  │  ├─ shop.tsx               # Virtual Coin Packs & Legal Disclaimer
│  │  └─ account.tsx            # Profile, Settings, Reminder Time Picker, Dev Grant Tools
│  ├─ wallet/
│  │  └─ history.tsx            # Keyset pagination transaction ledger
│  ├─ game/[id].tsx             # Thin dynamic route delegating to GameHost
│  ├─ leaderboard.tsx           # Rankings placeholder
│  └─ +not-found.tsx
├─ shared/                      # Shared Pure TypeScript Engines (Node & Deno compatible)
│  ├─ engines/
│  │  ├─ prng.ts                # Mulberry32 seeded PRNG
│  │  ├─ game2048.ts            # 2048 pure rules & replay verifier
│  │  ├─ memoryMatch.ts         # Memory Match shuffle & flip verifier
│  │  ├─ reaction.ts            # Tap Reaction delays & reaction verifier
│  │  └─ index.ts               # Universal verify() export
├─ scripts/
│  └─ sync-engines.mjs          # Syncs shared/engines to supabase/functions/_shared/engines
├─ src/
│  ├─ features/
│  │  ├─ auth/                  # Anonymous identity bootstrap
│  │  ├─ wallet/                # Wallet store, CoinChip, Keyset ledger
│  │  ├─ rewards/               # 7-day streak calendar, claim celebration, push reminders
│  │  ├─ lobby/                 # Game cards, category filtering, best score badges
│  │  └─ games/                 # Mini-game engine UI & Host
│  │     ├─ game-2048/          # Neon 2048 (Reanimated worklets, Pan gesture, accessibility D-pad)
│  │     ├─ memory-match/       # Memory Matrix (3D card flip, mismatch shake, vector shapes)
│  │     ├─ tap-reaction/       # Tap Reflex (low latency performance.now(), 5-round pad)
│  │     ├─ host/               # GameHost state machine
│  │     ├─ components/         # GameHostTopBar, CountdownOverlay, DifficultyPickerModal,
│  │     │                      # GamePauseModal, GameResultModal
│  │     ├─ hooks/              # useGames, useStartSession, useFinishSession, useGameDailyStatus, useBestScore
│  │     ├─ api.ts              # Supabase game RPCs & fallback catalog
│  │     └─ pendingSubmissions.ts # MMKV offline retry queue
│  ├─ components/ui/            # Button, Card, Badge, Chip, CoinChip, Skeleton, Toast, Modal
│  ├─ components/layout/        # Screen, Header, LobbyHeader, TabBar
│  ├─ theme/                    # colors, spacing, radii, typography, shadows, gradients
│  ├─ lib/                      # supabase, queryClient, mmkv, haptics, audio
│  ├─ utils/                    # format, date, logger
│  └─ types/                    # supabase.ts (generated DB types), game types
├─ supabase/
│  ├─ migrations/               # 20261006000001_wallet_ledger.sql, 20261006000002_daily_rewards.sql, 20261006000003_games.sql
│  ├─ functions/                # wallet-get, wallet-transaction, daily-reward-status, daily-reward-claim,
│  │                            # game-start, game-finish, game-daily-status
```

---

## 🌐 Web Platform Support & Vercel Deployment

ZyroBet includes full, zero-regression web support built with Expo SDK 57, `react-native-web`, `@expo/metro-runtime`, and `react-dom`.

### 1. Web Scripts
```bash
# Start Web Development Server
npm run web           # npx expo start --web

# Build Production Web Static Bundle
npm run build:web     # npx expo export -p web

# Locally Preview Exported Web Production Dist
npm run preview:web   # npx serve dist
```

### 2. Deploying to Vercel
1. In the Vercel Dashboard, import the repository.
2. Configure Project Settings:
   - **Framework Preset:** `Other`
   - **Build Command:** `npm run build:web`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
3. Environment Variables (set in Vercel project settings):
   - `EXPO_PUBLIC_APP_ENV`: `production` (or `preview`)
   - `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `EXPO_PUBLIC_DEV_TOOLS`: `false` (for production)
4. SPA Routing and Cache Headers:
   - Handled automatically by `vercel.json` (SPA rewrite to `/index.html`, immutable 1-year cache headers for `_expo/static` and assets).

### 3. Supabase Edge Functions CORS & Web Origin
Supabase Edge Functions validate allowed origins to support web requests from Vercel deployments and local development:
- **`ALLOWED_ORIGINS`**: Comma-separated list of origins (e.g., `https://zyrobet.vercel.app,http://localhost:8081`).
- **`WEB_APP_ORIGIN`**: Primary production web origin (e.g., `https://zyrobet.vercel.app`).
Set these in your Supabase project dashboard under **Project Settings > Edge Functions > Secrets**.

### 4. Web vs Native Differences Summary
| Feature | Native (iOS / Android) | Web Platform |
| :--- | :--- | :--- |
| **Storage (Core)** | Nitro C++ `react-native-mmkv` | `localStorage` fallback adapter |
| **Session Security** | Hardware `expo-secure-store` Keychain/Keystore | Scoped `localStorage` secure storage adapter |
| **Coin Purchases** | RevenueCat StoreKit / Play Billing (`canPurchase = true`) | Disabled (`canPurchase = false`), friendly panel |
| **Notifications** | Push / local notifications (`expo-notifications`) | No-op, Daily Reminders settings section hidden |
| **Haptics** | Native haptic motor (`expo-haptics`) | `navigator.vibrate` with safe desktop no-op |
| **Keep Awake** | Native window keep-awake (`expo-keep-awake`) | W3C Screen Wake Lock API (`navigator.wakeLock`) |
| **Sharing** | Native OS Share Sheet | Web Share API (`navigator.share`) with Clipboard fallback |
| **Game Input (2048)** | Pan gestures / swipes | Arrow keys + WASD keyboard + Pan gestures |
| **Audio** | Native `expo-audio` | Web Audio unlocked on first user gesture |
| **Layout** | Native device screen bounds | Centered max-width 480 column, `#07140F` backdrop, `100dvh` |

### 5. Manual Test Checklist (Web)
Run `npm run build:web && npm run preview:web` or `npm run web`, and verify:
- [ ] **Sign-in Bootstrap:** App launches without crashes; anonymous guest session is initialized and stored in localStorage.
- [ ] **Lobby:** Game catalog renders in centered responsive column; category chips filter smoothly; announcement ticker animates.
- [ ] **Neon 2048:** Responsive swipes and keyboard controls (Arrow keys and WASD) move and merge tiles; sound effects play.
- [ ] **Memory Matrix:** Responsive clicks flip cards with 3D animation; mismatch shake triggers; sound and win celebrations fire.
- [ ] **Tap Reflex:** Reaction pad reacts instantly via `pointerdown`; false start penalty works; millisecond accuracy computed.
- [ ] **Claim Daily Reward:** 7-day streak calendar accessible; claiming credits coins and updates header chip; celebration modal appears.
- [ ] **Wallet History:** Navigate to account / ledger history; transactions render with keyset pagination.
- [ ] **Offline / Practice Mode:** If Edge Functions or internet are offline, games switch to practice mode and record scores locally.
- [ ] **Page Refresh Persistence:** Refreshing the browser preserves the active session, coin wallet balance, and game preferences.

