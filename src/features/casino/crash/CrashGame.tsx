import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  CRASH_GROWTH_PER_MS,
  CRASH_MAX_MULTIPLIER,
  CRASH_MIN_AUTO_CASHOUT,
  crashMsForMultiplier,
  crashMultiplierAt,
  payoutFor,
} from '@shared/engines/casino';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { hapticFeedback } from '@/lib/haptics';
import { colors, radii, spacing } from '@/theme';
import { formatCoins } from '@/utils/format';
import { BetControls } from '../components/BetControls';
import { RoundResult } from '../components/RoundResult';
import { CasinoApiError, CasinoGameProps, CasinoResponse, CasinoRound } from '../types';

interface CrashState {
  crashPoint?: number;
  cashedOutAt?: number;
}

// Live polls hit the server; demo polls are local and can run near frame rate
const POLL_MS = { live: 1000, demo: 100, checking: 1000 } as const;
const CHART_HEIGHT = 220;

function curvePath(elapsedMs: number, width: number, height: number): { d: string; maxM: number } {
  const windowMs = Math.max(8000, elapsedMs);
  const current = crashMultiplierAt(elapsedMs);
  const maxM = Math.max(2, current * 1.15);
  const samples = 40;
  let d = '';
  for (let i = 0; i <= samples; i++) {
    const t = (elapsedMs * i) / samples;
    const m = Math.exp(CRASH_GROWTH_PER_MS * t);
    const x = (t / windowMs) * width;
    const y = height - ((m - 1) / (maxM - 1)) * height;
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `;
  }
  return { d, maxM };
}

export function CrashGame({ casino }: CasinoGameProps) {
  const { showToast } = useToast();
  const { play } = casino;
  const [bet, setBet] = useState(20);
  const [autoText, setAutoText] = useState('');
  const [round, setRound] = useState<CasinoRound<CrashState> | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [chartWidth, setChartWidth] = useState(320);
  const [history, setHistory] = useState<number[]>([]);

  const localStart = useRef(0);
  const frame = useRef<number | null>(null);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlight = useRef(false);
  const roundRef = useRef<CasinoRound<CrashState> | null>(null);

  const running = round?.status === 'active';

  const stopLoops = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    if (poll.current) clearInterval(poll.current);
    frame.current = null;
    poll.current = null;
  }, []);

  const finish = useCallback(
    (settled: CasinoRound<CrashState>) => {
      // A status poll and a cash-out can both come back settled
      if (roundRef.current?.id === settled.id && roundRef.current.status === 'settled') return;
      stopLoops();
      roundRef.current = settled;
      setRound(settled);
      if (settled.state.crashPoint) {
        const point = settled.state.crashPoint;
        setHistory((h) => [point, ...h].slice(0, 12));
        if (settled.payout === 0) {
          setElapsed(crashMsForMultiplier(point));
        }
      }
      if (settled.payout > 0) hapticFeedback.success();
      else hapticFeedback.error();
    },
    [stopLoops],
  );

  const handleResponse = useCallback(
    (res: CasinoResponse) => {
      const next = res.round as CasinoRound<CrashState> | null;
      if (!next) return;
      if (next.status === 'settled') finish(next);
    },
    [finish],
  );

  const startLoops = useCallback(
    (active: CasinoRound<CrashState>, serverNow: string | undefined) => {
      stopLoops();
      // Align the local clock with the server's round start (server time is authoritative)
      const serverElapsed = serverNow ? Date.parse(serverNow) - Date.parse(active.createdAt) : 0;
      localStart.current = Date.now() - Math.max(0, serverElapsed);
      roundRef.current = active;
      setRound(active);

      const tick = () => {
        setElapsed(Date.now() - localStart.current);
        frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);

      poll.current = setInterval(async () => {
        const current = roundRef.current;
        if (!current || current.status !== 'active' || inFlight.current) return;
        inFlight.current = true;
        try {
          handleResponse(await play({ game: 'crash', action: 'status', roundId: current.id }));
        } catch {
          // Next poll retries
        } finally {
          inFlight.current = false;
        }
      }, POLL_MS[casino.mode]);
    },
    [casino.mode, handleResponse, play, stopLoops],
  );

  useEffect(() => stopLoops, [stopLoops]);

  // Resume a round left running
  useEffect(() => {
    play({ game: 'crash', action: 'active' })
      .then((res) => {
        const active = res.round as CasinoRound<CrashState> | null;
        if (active?.status === 'active') startLoops(active, res.serverNow);
      })
      .catch(() => {});
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parseAuto = (): number | null | 'invalid' => {
    if (autoText.trim() === '') return null;
    const v = Math.floor(Number(autoText) * 100) / 100;
    if (!(v >= CRASH_MIN_AUTO_CASHOUT && v <= CRASH_MAX_MULTIPLIER)) return 'invalid';
    return v;
  };

  const start = async () => {
    const autoCashout = parseAuto();
    if (autoCashout === 'invalid') {
      showToast({
        message: `Auto cash-out must be between ${CRASH_MIN_AUTO_CASHOUT} and ${CRASH_MAX_MULTIPLIER}`,
        type: 'error',
      });
      return;
    }
    setBusy(true);
    hapticFeedback.light();
    try {
      const res = await play({ game: 'crash', action: 'start', bet, autoCashout });
      setElapsed(0);
      startLoops(res.round as CasinoRound<CrashState>, res.serverNow);
    } catch (err) {
      showToast({
        message: err instanceof CasinoApiError ? err.message : 'Could not start round',
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const cashout = async () => {
    const current = roundRef.current;
    if (!current || current.status !== 'active') return;
    setBusy(true);
    inFlight.current = true;
    try {
      handleResponse(await play({ game: 'crash', action: 'cashout', roundId: current.id }));
    } catch (err) {
      showToast({
        message: err instanceof CasinoApiError ? err.message : 'Cash out failed',
        type: 'error',
      });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const onLayout = (e: LayoutChangeEvent) => setChartWidth(e.nativeEvent.layout.width);

  const settled = round?.status === 'settled';
  const crashed = settled && round.payout === 0;
  const display = settled
    ? crashed
      ? (round.state.crashPoint ?? 1)
      : (round.state.cashedOutAt ?? round.multiplier ?? 1)
    : running
      ? crashMultiplierAt(elapsed)
      : 1;
  const { d } = curvePath(round ? elapsed : 0, chartWidth, CHART_HEIGHT);
  const lineColor = crashed ? colors.danger : settled ? colors.primary : colors.gold;

  return (
    <>
      <View style={styles.historyRow}>
        {history.map((h, i) => (
          <View
            key={i}
            style={[
              styles.historyChip,
              { backgroundColor: h >= 2 ? colors.primaryMuted : colors.dangerMuted },
            ]}
          >
            <Text style={[styles.historyText, { color: h >= 2 ? colors.primary : colors.danger }]}>
              {h.toFixed(2)}×
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.chart} onLayout={onLayout}>
        <Svg width={chartWidth} height={CHART_HEIGHT} style={StyleSheet.absoluteFill}>
          <Path d={d} stroke={lineColor} strokeWidth={4} fill="none" strokeLinecap="round" />
        </Svg>
        <View style={styles.chartCenter} pointerEvents="none">
          <Text style={[styles.bigMultiplier, { color: lineColor }]}>{display.toFixed(2)}×</Text>
          {crashed && <Text style={styles.subText}>CRASHED</Text>}
          {settled && !crashed && (
            <Text style={[styles.subText, { color: colors.primary }]}>
              CASHED OUT · crashed at {(round.state.crashPoint ?? 0).toFixed(2)}×
            </Text>
          )}
          {!round && <Text style={styles.subText}>Place a bet to launch</Text>}
        </View>
      </View>

      {running ? (
        <Button
          title={`Cash out ${formatCoins(payoutFor(round.bet, crashMultiplierAt(elapsed)))}`}
          onPress={cashout}
          disabled={busy}
          variant="gold"
          size="lg"
          fullWidth
        />
      ) : (
        <>
          <BetControls bet={bet} onChange={setBet} balance={casino.balance} disabled={busy} />
          <View>
            <Text style={styles.label}>Auto cash-out (optional)</Text>
            <View style={styles.autoWrap}>
              <TextInput
                style={styles.autoInput}
                value={autoText}
                onChangeText={(t) => setAutoText(t.replace(/[^0-9.]/g, ''))}
                placeholder="Off"
                placeholderTextColor={colors.textSubtle}
                keyboardType="decimal-pad"
                inputMode="decimal"
                accessibilityLabel="Auto cash-out multiplier"
              />
              <Text style={styles.autoSuffix}>×</Text>
            </View>
          </View>
          <Button
            title={`Bet · ${bet} coins`}
            onPress={start}
            disabled={busy || casino.balance < bet}
            loading={busy}
            variant="gold"
            size="lg"
            fullWidth
          />
        </>
      )}

      {settled && <RoundResult round={round} mode={casino.mode} />}
    </>
  );
}

const styles = StyleSheet.create({
  historyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    minHeight: 24,
  },
  historyChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  historyText: {
    fontSize: 11,
    fontWeight: '800',
  },
  chart: {
    height: CHART_HEIGHT,
    borderRadius: radii.xl,
    backgroundColor: '#0B2219',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  chartCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigMultiplier: {
    fontSize: 48,
    fontWeight: '900',
  },
  subText: {
    marginTop: spacing.xs,
    fontSize: 13,
    fontWeight: '800',
    color: colors.danger,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  autoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  autoInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  autoSuffix: {
    color: colors.textMuted,
    fontWeight: '800',
  },
});
