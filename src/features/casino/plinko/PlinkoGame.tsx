import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PLINKO_PAYOUTS, PlinkoDropResult, PlinkoRisk, PlinkoRows } from '@shared/engines/casino';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { hapticFeedback } from '@/lib/haptics';
import { colors, radii, spacing } from '@/theme';
import { BetControls, OptionPicker } from '../components/BetControls';
import { RoundResult } from '../components/RoundResult';
import { CasinoApiError, CasinoGameProps, CasinoRound } from '../types';

const STEP_MS = 140;
const MAX_BALLS = 10;

interface Geometry {
  width: number;
  gapX: number;
  gapY: number;
  top: number;
  pegRadius: number;
  ballSize: number;
  height: number;
}

function geometryFor(width: number, rows: number): Geometry {
  const gapX = width / (rows + 2);
  const gapY = gapX * 0.86;
  const top = gapY * 0.6;
  return {
    width,
    gapX,
    gapY,
    top,
    pegRadius: Math.max(2, gapX * 0.11),
    ballSize: Math.max(8, gapX * 0.45),
    height: top + gapY * rows,
  };
}

/** x of the peg/bin slot `offset` steps from the centre (in half-gap units handled by caller). */
function xAt(g: Geometry, offset: number) {
  return g.width / 2 + offset * g.gapX;
}

/** Bin colours: red at the edges to yellow in the middle (as in the original game). */
function binColor(index: number, bins: number): string {
  const half = (bins - 1) / 2;
  const t = half === 0 ? 1 : 1 - Math.abs(index - half) / half;
  const r = 255;
  const gr = Math.round(0 + 192 * t);
  const b = Math.round(63 * (1 - t));
  return `rgb(${r}, ${gr}, ${b})`;
}

interface BallProps {
  path: (0 | 1)[];
  geometry: Geometry;
}

function Ball({ path, geometry: g }: BallProps) {
  const x = useSharedValue(xAt(g, 0));
  const y = useSharedValue(0);

  useEffect(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    let rights = 0;
    for (let i = 0; i < path.length; i++) {
      // Land on top of the peg in row i, then bounce half a gap left or right
      xs.push(xAt(g, rights - i / 2));
      ys.push(g.top + i * g.gapY - g.pegRadius - g.ballSize / 2);
      rights += path[i];
    }
    xs.push(xAt(g, rights - path.length / 2));
    ys.push(g.height + g.gapY * 0.4);

    x.value = withSequence(
      ...xs.map((v) => withTiming(v, { duration: STEP_MS, easing: Easing.linear })),
    );
    y.value = withSequence(
      ...ys.map((v) => withTiming(v, { duration: STEP_MS, easing: Easing.in(Easing.quad) })),
    );
    // A ball's path never changes after it is dropped
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value - g.ballSize / 2 }, { translateY: y.value - g.ballSize / 2 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ball,
        { width: g.ballSize, height: g.ballSize, borderRadius: g.ballSize / 2 },
        style,
      ]}
    />
  );
}

interface LiveBall {
  id: string;
  path: (0 | 1)[];
}

export function PlinkoGame({ casino }: CasinoGameProps) {
  const { showToast } = useToast();
  const [bet, setBet] = useState(20);
  const [rows, setRows] = useState<PlinkoRows>(12);
  const [risk, setRisk] = useState<PlinkoRisk>('medium');
  const [width, setWidth] = useState(320);
  const [balls, setBalls] = useState<LiveBall[]>([]);
  const [pending, setPending] = useState(0);
  const [lastRound, setLastRound] = useState<CasinoRound<PlinkoDropResult> | null>(null);
  const [hitBin, setHitBin] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const unrevealed = useRef(new Set<string>());
  const { reveal } = casino;

  // Leaving with balls still falling must not keep their wins out of the balance
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      unrevealed.current.forEach(reveal);
    },
    [reveal],
  );

  const geometry = useMemo(() => geometryFor(width, rows), [width, rows]);
  const payouts = PLINKO_PAYOUTS[rows][risk];
  const busy = balls.length > 0 || pending > 0;

  const pegs = useMemo(() => {
    const list: { cx: number; cy: number }[] = [];
    for (let i = 0; i < rows; i++) {
      for (let k = 0; k < i + 3; k++) {
        list.push({ cx: xAt(geometry, k - (i + 2) / 2), cy: geometry.top + i * geometry.gapY });
      }
    }
    return list;
  }, [geometry, rows]);

  const drop = async () => {
    if (balls.length + pending >= MAX_BALLS) return;
    setPending((p) => p + 1);
    hapticFeedback.light();
    try {
      const res = await casino.play(
        { game: 'plinko', action: 'drop', bet, rows, risk },
        { revealLater: true },
      );
      const round = res.round as CasinoRound<PlinkoDropResult>;
      setBalls((b) => [...b, { id: round.id, path: round.state.path }]);
      unrevealed.current.add(round.id);

      const landing = setTimeout(
        () => {
          setBalls((b) => b.filter((ball) => ball.id !== round.id));
          unrevealed.current.delete(round.id);
          reveal(round.id);
          setLastRound(round);
          setHitBin(round.state.bin);
          if (round.payout > round.bet) hapticFeedback.success();
        },
        STEP_MS * (rows + 1) + 60,
      );
      timers.current.push(landing);
    } catch (err) {
      showToast({
        message: err instanceof CasinoApiError ? err.message : 'Drop failed',
        type: 'error',
      });
    } finally {
      setPending((p) => p - 1);
    }
  };

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const binWidth = geometry.gapX - 2;

  return (
    <>
      <View style={styles.board} onLayout={onLayout}>
        <View style={{ height: geometry.height + geometry.gapY * 0.2 }}>
          <Svg width={geometry.width} height={geometry.height}>
            {pegs.map((p, i) => (
              <Circle key={i} cx={p.cx} cy={p.cy} r={geometry.pegRadius} fill="#E8F5EE" />
            ))}
          </Svg>
          {balls.map((ball) => (
            <Ball key={ball.id} path={ball.path} geometry={geometry} />
          ))}
        </View>
        <View style={[styles.bins, { paddingHorizontal: geometry.gapX / 2 }]}>
          {payouts.map((m, i) => (
            <View
              key={i}
              style={[
                styles.bin,
                { width: binWidth, backgroundColor: binColor(i, payouts.length) },
                hitBin === i && styles.binHit,
              ]}
            >
              <Text
                style={[styles.binText, { fontSize: rows === 16 ? 7 : rows === 12 ? 8 : 10 }]}
                numberOfLines={1}
              >
                {m}×
              </Text>
            </View>
          ))}
        </View>
      </View>

      <BetControls bet={bet} onChange={setBet} balance={casino.balance} />

      <OptionPicker
        label="Risk"
        value={risk}
        onChange={setRisk}
        disabled={busy}
        options={[
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ]}
      />
      <OptionPicker
        label="Rows"
        value={rows}
        onChange={setRows}
        disabled={busy}
        options={[
          { value: 8, label: '8' },
          { value: 12, label: '12' },
          { value: 16, label: '16' },
        ]}
      />

      <Button
        title={`Drop ball · ${bet} coins`}
        onPress={drop}
        disabled={casino.balance < bet || balls.length + pending >= MAX_BALLS}
        variant="gold"
        size="lg"
        fullWidth
      />

      <RoundResult round={lastRound} mode={casino.mode} />
    </>
  );
}

const styles = StyleSheet.create({
  board: {
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
    backgroundColor: '#0B2219',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  ball: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: colors.goldLight,
  },
  bins: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
  },
  bin: {
    height: 24,
    borderRadius: radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  binHit: {
    transform: [{ translateY: 4 }],
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  binText: {
    fontWeight: '900',
    color: '#2A0A00',
  },
});
