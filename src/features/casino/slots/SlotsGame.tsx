import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  SLOT_PAYTABLE,
  SLOT_REELS,
  SLOT_ROWS,
  SLOT_SYMBOL_WEIGHTS,
  SlotSpinResult,
  SlotSymbol,
} from '@shared/engines/casino';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { hapticFeedback } from '@/lib/haptics';
import { colors, radii, spacing } from '@/theme';
import { BetControls } from '../components/BetControls';
import { RoundResult } from '../components/RoundResult';
import { CasinoApiError, CasinoGameProps, CasinoRound } from '../types';

// Symbol art from n1md7/slot-game (ISC licence)
const SYMBOL_IMAGES: Record<Exclude<SlotSymbol, 'Blank'>, number> = {
  '1xBAR': require('../../../../assets/casino/slots/1xBAR.png'),
  '2xBAR': require('../../../../assets/casino/slots/2xBAR.png'),
  '3xBAR': require('../../../../assets/casino/slots/3xBAR.png'),
  Seven: require('../../../../assets/casino/slots/Seven.png'),
  Cherry: require('../../../../assets/casino/slots/Cherry.png'),
};

const FILLER_COUNT = 14;
const REEL_DURATIONS = [900, 1200, 1500];

function randomSymbol(): SlotSymbol {
  return SLOT_SYMBOL_WEIGHTS[Math.floor(Math.random() * SLOT_SYMBOL_WEIGHTS.length)].symbol;
}

function randomColumn(): SlotSymbol[] {
  return Array.from({ length: SLOT_ROWS }, randomSymbol);
}

function SymbolCell({
  symbol,
  size,
  highlight,
}: {
  symbol: SlotSymbol;
  size: number;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.cell, { height: size }, highlight && styles.cellWin]}>
      {symbol !== 'Blank' && (
        <Image source={SYMBOL_IMAGES[symbol]} style={styles.symbolImage} contentFit="contain" />
      )}
    </View>
  );
}

interface ReelProps {
  previous: SlotSymbol[];
  target: SlotSymbol[];
  spinKey: number;
  duration: number;
  cellSize: number;
  winningRows: number[];
}

/**
 * One spin of a reel. Mounted fresh for every spin (keyed by spinKey) so it starts showing
 * the previous symbols and scrolls through filler until the target column is in view.
 */
function ReelStrip({ previous, target, spinKey, duration, cellSize, winningRows }: ReelProps) {
  const [strip] = useState<SlotSymbol[]>(() =>
    spinKey === 0
      ? target
      : [...previous, ...Array.from({ length: FILLER_COUNT }, randomSymbol), ...target],
  );
  const targetStart = strip.length - SLOT_ROWS;
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withTiming(-targetStart * cellSize, {
      duration,
      easing: Easing.out(Easing.back(0.8)),
    });
    // Runs once per mount; cell size changes are applied by the next spin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      {strip.map((symbol, i) => (
        <SymbolCell
          key={i}
          symbol={symbol}
          size={cellSize}
          highlight={i >= targetStart && winningRows.includes(i - targetStart)}
        />
      ))}
    </Animated.View>
  );
}

function Reel(props: ReelProps) {
  return (
    <View style={[styles.reel, { height: props.cellSize * SLOT_ROWS }]}>
      <ReelStrip key={props.spinKey} {...props} />
    </View>
  );
}

const PAYTABLE_ROWS: { label: string; symbols: SlotSymbol[]; multiplier: number }[] = [
  {
    label: '3 Cherries',
    symbols: ['Cherry', 'Cherry', 'Cherry'],
    multiplier: SLOT_PAYTABLE.Cherry,
  },
  { label: '3 Sevens', symbols: ['Seven', 'Seven', 'Seven'], multiplier: SLOT_PAYTABLE.Seven },
  { label: '3 × 3BAR', symbols: ['3xBAR', '3xBAR', '3xBAR'], multiplier: SLOT_PAYTABLE['3xBAR'] },
  { label: '3 × 2BAR', symbols: ['2xBAR', '2xBAR', '2xBAR'], multiplier: SLOT_PAYTABLE['2xBAR'] },
  { label: '3 × 1BAR', symbols: ['1xBAR', '1xBAR', '1xBAR'], multiplier: SLOT_PAYTABLE['1xBAR'] },
  {
    label: 'Any Cherry / Seven',
    symbols: ['Cherry', 'Seven', 'Cherry'],
    multiplier: SLOT_PAYTABLE.CherryOrSeven,
  },
  { label: 'Any 3 BARs', symbols: ['1xBAR', '3xBAR', '2xBAR'], multiplier: SLOT_PAYTABLE.AnyBar },
];

export function SlotsGame({ casino }: CasinoGameProps) {
  const { showToast } = useToast();
  const [bet, setBet] = useState(30);
  const [cellSize, setCellSize] = useState(90);
  const [columns, setColumns] = useState<SlotSymbol[][]>(() =>
    Array.from({ length: SLOT_REELS }, randomColumn),
  );
  const [previous, setPrevious] = useState<SlotSymbol[][]>(columns);
  const [spinKey, setSpinKey] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [lastRound, setLastRound] = useState<CasinoRound<SlotSpinResult> | null>(null);
  const [winningRows, setWinningRows] = useState<number[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unrevealed = useRef<string | null>(null);
  const { reveal } = casino;

  // Leaving mid-spin must not keep the win out of the balance
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (unrevealed.current) reveal(unrevealed.current);
    },
    [reveal],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setCellSize(Math.floor(((width - spacing.sm * (SLOT_REELS + 1)) / SLOT_REELS) * 0.86));
  };

  const spin = async () => {
    if (spinning) return;
    setSpinning(true);
    setWinningRows([]);
    hapticFeedback.light();

    try {
      const res = await casino.play({ game: 'slots', action: 'spin', bet }, { revealLater: true });
      const round = res.round as CasinoRound<SlotSpinResult>;

      setPrevious(columns);
      setColumns(round.state.grid);
      setSpinKey((k) => k + 1);
      unrevealed.current = round.id;

      timer.current = setTimeout(
        () => {
          unrevealed.current = null;
          reveal(round.id);
          setLastRound(round);
          setWinningRows(round.state.lines.map((l) => l.row));
          if (round.payout > 0) hapticFeedback.success();
          setSpinning(false);
        },
        REEL_DURATIONS[REEL_DURATIONS.length - 1] + 100,
      );
    } catch (err) {
      showToast({
        message: err instanceof CasinoApiError ? err.message : 'Spin failed',
        type: 'error',
      });
      setSpinning(false);
    }
  };

  return (
    <>
      <View style={styles.machine} onLayout={onLayout}>
        <View style={styles.reels}>
          {columns.map((column, reel) => (
            <Reel
              key={reel}
              previous={previous[reel]}
              target={column}
              spinKey={spinKey}
              duration={REEL_DURATIONS[reel]}
              cellSize={cellSize}
              winningRows={spinning ? [] : winningRows}
            />
          ))}
        </View>
      </View>

      <BetControls bet={bet} onChange={setBet} balance={casino.balance} disabled={spinning} />

      <Button
        title={spinning ? 'Spinning…' : `Spin · ${bet} coins`}
        onPress={spin}
        disabled={spinning || casino.balance < bet}
        variant="gold"
        size="lg"
        fullWidth
      />

      <RoundResult round={lastRound} mode={casino.mode} />

      <View style={styles.paytable}>
        <Text style={styles.paytableTitle}>Paytable</Text>
        <Text style={styles.paytableHint}>
          Each of the 3 rows is a line worth a third of your bet. Line pays × that stake.
        </Text>
        {PAYTABLE_ROWS.map((row) => (
          <View key={row.label} style={styles.payRow}>
            <View style={styles.paySymbols}>
              {row.symbols.map((s, i) => (
                <Image
                  key={i}
                  source={SYMBOL_IMAGES[s as Exclude<SlotSymbol, 'Blank'>]}
                  style={styles.payImage}
                  contentFit="contain"
                />
              ))}
            </View>
            <Text style={styles.payLabel}>{row.label}</Text>
            <Text style={styles.payValue}>{row.multiplier}×</Text>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  machine: {
    padding: spacing.sm,
    borderRadius: radii.xl,
    backgroundColor: '#3B1E08',
    borderWidth: 3,
    borderColor: colors.goldDark,
  },
  reels: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  reel: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: radii.md,
    backgroundColor: '#FFF8E7',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  cellWin: {
    backgroundColor: 'rgba(245, 197, 66, 0.55)',
  },
  symbolImage: {
    width: '85%',
    height: '85%',
  },
  paytable: {
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  paytableTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  paytableHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paySymbols: {
    flexDirection: 'row',
    gap: 2,
    padding: 2,
    borderRadius: radii.xs,
    backgroundColor: '#FFF8E7',
  },
  payImage: {
    width: 24,
    height: 20,
  },
  payLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },
  payValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gold,
  },
});
