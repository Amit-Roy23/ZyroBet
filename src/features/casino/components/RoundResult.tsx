import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radii, spacing } from '@/theme';
import { formatCoins } from '@/utils/format';
import { CasinoMode, CasinoRound } from '../types';

interface RoundResultProps {
  round: CasinoRound | null;
  mode: CasinoMode;
}

/** Win/loss line for the last settled round, plus its provably-fair seeds. */
export function RoundResult({ round, mode }: RoundResultProps) {
  const [showSeeds, setShowSeeds] = useState(false);

  if (!round || round.status !== 'settled') return null;

  const profit = round.payout - round.bet;
  const multiplier = round.multiplier ?? 0;
  const color = profit > 0 ? colors.primary : profit < 0 ? colors.danger : colors.textSecondary;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.multiplier, { color }]}>{multiplier.toFixed(2)}×</Text>
        <Text style={[styles.profit, { color }]}>
          {profit >= 0 ? '+' : '−'}
          {formatCoins(Math.abs(profit))} coins
        </Text>
      </View>

      {mode === 'live' && (
        <TouchableOpacity onPress={() => setShowSeeds((v) => !v)} activeOpacity={0.7}>
          <Text style={styles.fairToggle}>{showSeeds ? 'Hide' : 'Show'} provably fair seeds</Text>
        </TouchableOpacity>
      )}
      {showSeeds && mode === 'live' && (
        <View style={styles.seeds}>
          <Text style={styles.seedLabel}>Server seed hash (shown before play)</Text>
          <Text style={styles.seed} selectable>
            {round.serverSeedHash}
          </Text>
          <Text style={styles.seedLabel}>Server seed (revealed)</Text>
          <Text style={styles.seed} selectable>
            {round.serverSeed}
          </Text>
          <Text style={styles.seedLabel}>Client seed</Text>
          <Text style={styles.seed} selectable>
            {round.clientSeed}
          </Text>
          <Text style={styles.seedHint}>
            Check: SHA-256(server seed) equals the hash; the outcome comes from HMAC-SHA256(server
            seed, &quot;client seed:0&quot;).
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  multiplier: {
    fontSize: 22,
    fontWeight: '900',
  },
  profit: {
    fontSize: 16,
    fontWeight: '800',
  },
  fairToggle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  seeds: {
    gap: 2,
  },
  seedLabel: {
    marginTop: spacing.xs,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  seed: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  seedHint: {
    marginTop: spacing.xs,
    fontSize: 11,
    color: colors.textSubtle,
  },
});
