import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MINES_TILES, minesMultiplier, payoutFor } from '@shared/engines/casino';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { hapticFeedback } from '@/lib/haptics';
import { colors, radii, spacing } from '@/theme';
import { formatCoins } from '@/utils/format';
import { BetControls, OptionPicker } from '../components/BetControls';
import { RoundResult } from '../components/RoundResult';
import { CasinoApiError, CasinoGameProps, CasinoResponse, CasinoRound } from '../types';

interface MinesState {
  mines: number;
  revealed: number[];
  multiplier: number;
  hitMine?: number;
  positions?: number[];
}

const GRID = 5;
const MINE_OPTIONS = [1, 3, 5, 10, 20];

export function MinesGame({ casino }: CasinoGameProps) {
  const { showToast } = useToast();
  const { play } = casino;
  const [bet, setBet] = useState(20);
  const [mineCount, setMineCount] = useState(3);
  const [round, setRound] = useState<CasinoRound<MinesState> | null>(null);
  const [busy, setBusy] = useState(false);
  const [tileSize, setTileSize] = useState(56);

  const active = round?.status === 'active';
  const state = round?.state;
  const revealed = state?.revealed ?? [];
  const positions = state?.positions ?? [];
  const mines = state?.mines ?? mineCount;

  // Resume a round left open (app closed mid-game)
  useEffect(() => {
    play({ game: 'mines', action: 'active' })
      .then((res) => {
        if (res.round) setRound(res.round as CasinoRound<MinesState>);
      })
      .catch(() => {});
  }, [play]);

  const run = async (fn: () => Promise<CasinoResponse>) => {
    setBusy(true);
    try {
      const res = await fn();
      const next = res.round as CasinoRound<MinesState>;
      setRound(next);
      return next;
    } catch (err) {
      if (err instanceof CasinoApiError && err.code === 'ROUND_ACTIVE' && err.details) {
        setRound((err.details as CasinoResponse).round as CasinoRound<MinesState>);
      }
      showToast({
        message: err instanceof CasinoApiError ? err.message : 'Something went wrong',
        type: 'error',
      });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const start = () => {
    hapticFeedback.light();
    run(() => play({ game: 'mines', action: 'start', bet, mines: mineCount }));
  };

  const reveal = async (tile: number) => {
    if (!round || !active || busy || revealed.includes(tile)) return;
    const next = await run(() =>
      play({ game: 'mines', action: 'reveal', roundId: round.id, tile }),
    );
    if (!next) return;
    if (next.state.hitMine !== undefined) hapticFeedback.error();
    else if (next.status === 'settled') hapticFeedback.success();
    else hapticFeedback.selection();
  };

  const cashout = async () => {
    if (!round) return;
    const next = await run(() => play({ game: 'mines', action: 'cashout', roundId: round.id }));
    if (next) hapticFeedback.success();
  };

  const onLayout = (e: LayoutChangeEvent) => {
    setTileSize(Math.floor((e.nativeEvent.layout.width - spacing.sm * (GRID - 1)) / GRID));
  };

  const currentMultiplier = active ? minesMultiplier(mines, revealed.length) : 1;
  const nextMultiplier = minesMultiplier(mines, revealed.length + 1);
  const roundBet = round?.bet ?? bet;

  return (
    <>
      <View style={styles.grid} onLayout={onLayout}>
        {Array.from({ length: MINES_TILES }, (_, tile) => {
          const isRevealed = revealed.includes(tile);
          const isMine = positions.includes(tile);
          const finished = round?.status === 'settled';
          const showGem = isRevealed && !isMine;
          const showMine = (isRevealed && isMine) || (finished && isMine);
          const faded = finished && !isRevealed;

          return (
            <TouchableOpacity
              key={tile}
              style={[
                styles.tile,
                { width: tileSize, height: tileSize },
                (showGem || showMine) && styles.tileOpen,
                state?.hitMine === tile && styles.tileHit,
                faded && styles.tileFaded,
              ]}
              disabled={!active || busy || isRevealed}
              onPress={() => reveal(tile)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Tile ${tile + 1}`}
            >
              {showGem && <Ionicons name="diamond" size={tileSize * 0.5} color={colors.primary} />}
              {showMine && <Ionicons name="nuclear" size={tileSize * 0.5} color={colors.danger} />}
              {finished && !isMine && !isRevealed && (
                <Ionicons name="diamond-outline" size={tileSize * 0.4} color={colors.textSubtle} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {active ? (
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Multiplier</Text>
            <Text style={styles.statValue}>{currentMultiplier.toFixed(2)}×</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Next tile</Text>
            <Text style={styles.statValue}>{nextMultiplier.toFixed(2)}×</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Cash out</Text>
            <Text style={[styles.statValue, { color: colors.gold }]}>
              {formatCoins(payoutFor(roundBet, currentMultiplier))}
            </Text>
          </View>
        </View>
      ) : (
        <>
          <BetControls bet={bet} onChange={setBet} balance={casino.balance} disabled={busy} />
          <OptionPicker
            label="Mines"
            value={mineCount}
            onChange={setMineCount}
            disabled={busy}
            options={MINE_OPTIONS.map((m) => ({ value: m, label: String(m) }))}
          />
        </>
      )}

      {active ? (
        <Button
          title={
            revealed.length === 0
              ? 'Pick a tile'
              : `Cash out ${formatCoins(payoutFor(roundBet, currentMultiplier))}`
          }
          onPress={cashout}
          disabled={busy || revealed.length === 0}
          variant="gold"
          size="lg"
          fullWidth
        />
      ) : (
        <Button
          title={`Start · ${bet} coins`}
          onPress={start}
          disabled={busy || casino.balance < bet}
          loading={busy}
          variant="gold"
          size="lg"
          fullWidth
        />
      )}

      <RoundResult round={round} mode={casino.mode} />
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    borderBottomWidth: 4,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileOpen: {
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 0,
  },
  tileHit: {
    backgroundColor: colors.dangerMuted,
  },
  tileFaded: {
    opacity: 0.55,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  statValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },
});
