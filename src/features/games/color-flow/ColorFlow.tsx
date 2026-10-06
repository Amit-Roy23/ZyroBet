import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/theme';
import { GameProps } from '../types';
import {
  getColorFlowBoard,
  ColorFlowGrid,
  ColorFlowPoint,
  ColorFlowPayload,
} from '@shared/engines';
import { haptics } from '@/lib/haptics';
import { soundManager } from '@/lib/audio';

export function ColorFlow({ session, paused, onScoreChange, onFinish }: GameProps) {
  const { width } = useWindowDimensions();
  const [board] = useState<ColorFlowGrid>(() => getColorFlowBoard(session.seed));

  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [paths, setPaths] = useState<Record<number, ColorFlowPoint[]>>({});
  const [liveScore, setLiveScore] = useState(0);

  const finishedRef = useRef(false);
  const gameStartRef = useRef(0);

  useEffect(() => {
    gameStartRef.current = Date.now();
  }, []);

  const gridDimension = Math.min(width - 32, 340);
  const cellSize = gridDimension / board.size;

  // Check board completion
  const checkCompletion = useCallback(
    (currentPaths: Record<number, ColorFlowPoint[]>) => {
      let completedCount = 0;
      const formattedPaths: ColorFlowPayload['paths'] = [];

      for (const ep of board.endpoints) {
        const path = currentPaths[ep.colorId];
        if (!path || path.length < 2) continue;

        const first = path[0];
        const last = path[path.length - 1];

        const isConnected =
          (first.r === ep.start.r && first.c === ep.start.c && last.r === ep.end.r && last.c === ep.end.c) ||
          (first.r === ep.end.r && first.c === ep.end.c && last.r === ep.start.r && last.c === ep.start.c);

        if (isConnected) {
          completedCount++;
          formattedPaths.push({ colorId: ep.colorId, points: path });
        }
      }

      const score = completedCount * 200 + (completedCount === board.endpoints.length ? 500 : 0);
      setLiveScore(score);
      onScoreChange(score);

      if (completedCount === board.endpoints.length && !finishedRef.current) {
        finishedRef.current = true;
        soundManager.playSound('win');
        haptics.notification('success');

        const durationMs = Date.now() - gameStartRef.current;
        setTimeout(() => {
          onFinish({ paths: formattedPaths, durationMs }, durationMs);
        }, 600);
      }
    },
    [board.endpoints, onScoreChange, onFinish]
  );

  const handleCellPress = (r: number, c: number) => {
    if (paused || finishedRef.current) return;

    // Is this an endpoint?
    const endpoint = board.endpoints.find(
      (e) => (e.start.r === r && e.start.c === c) || (e.end.r === r && e.end.c === c)
    );

    if (endpoint) {
      // Start or complete path for this color
      soundManager.playSound('flip');
      haptics.impact('light');

      if (selectedColor === endpoint.colorId) {
        // Appending endpoint to finish path
        const currPath = paths[endpoint.colorId] || [];
        const nextPath = [...currPath, { r, c }];
        const newPaths = { ...paths, [endpoint.colorId]: nextPath };
        setPaths(newPaths);
        setSelectedColor(null);
        checkCompletion(newPaths);
      } else {
        // Start fresh path from this endpoint
        setSelectedColor(endpoint.colorId);
        setPaths((prev) => ({
          ...prev,
          [endpoint.colorId]: [{ r, c }],
        }));
      }
      return;
    }

    // Normal empty cell
    if (selectedColor !== null) {
      const currPath = paths[selectedColor] || [];
      const lastPoint = currPath[currPath.length - 1];

      // Check adjacency
      if (lastPoint) {
        const dr = Math.abs(lastPoint.r - r);
        const dc = Math.abs(lastPoint.c - c);
        if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
          soundManager.playSound('flip');
          haptics.impact('light');

          const nextPath = [...currPath, { r, c }];
          const newPaths = { ...paths, [selectedColor]: nextPath };
          setPaths(newPaths);
          checkCompletion(newPaths);
        }
      }
    }
  };

  const handleReset = () => {
    if (paused || finishedRef.current) return;
    haptics.impact('medium');
    setPaths({});
    setSelectedColor(null);
    setLiveScore(0);
    onScoreChange(0);
  };

  return (
    <View style={styles.container}>
      {/* Top HUD */}
      <View style={styles.hudBar}>
        <View style={styles.hudChip}>
          <Text style={styles.hudLabel}>Connected</Text>
          <Text style={styles.hudValue}>
            {Object.keys(paths).filter((cId) => {
              const ep = board.endpoints.find((e) => e.colorId === Number(cId));
              const p = paths[Number(cId)];
              if (!ep || !p || p.length < 2) return false;
              const f = p[0];
              const l = p[p.length - 1];
              return (f.r === ep.start.r && f.c === ep.start.c && l.r === ep.end.r && l.c === ep.end.c) ||
                (f.r === ep.end.r && f.c === ep.end.c && l.r === ep.start.r && l.c === ep.start.c);
            }).length} / {board.endpoints.length}
          </Text>
        </View>

        <View style={styles.hudChip}>
          <Text style={styles.hudLabel}>Score</Text>
          <Text style={styles.hudValue}>{liveScore}</Text>
        </View>

        <TouchableOpacity style={styles.resetChip} onPress={handleReset} activeOpacity={0.7}>
          <Ionicons name="refresh" size={14} color={colors.textMuted} />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Grid Canvas */}
      <View style={[styles.boardGrid, { width: gridDimension, height: gridDimension }]}>
        {Array.from({ length: board.size }).map((_, r) => (
          <View key={r} style={styles.boardRow}>
            {Array.from({ length: board.size }).map((_, c) => {
              const ep = board.endpoints.find(
                (e) => (e.start.r === r && e.start.c === c) || (e.end.r === r && e.end.c === c)
              );

              // Find if this cell is in any path
              let cellColorHex: string | null = null;
              for (const [cId, pts] of Object.entries(paths)) {
                if (pts.some((pt) => pt.r === r && pt.c === c)) {
                  const endpointInfo = board.endpoints.find((e) => e.colorId === Number(cId));
                  cellColorHex = endpointInfo?.colorHex || '#00E676';
                  break;
                }
              }

              return (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.cell,
                    { width: cellSize, height: cellSize },
                    cellColorHex ? { backgroundColor: `${cellColorHex}25` } : undefined,
                  ]}
                  onPress={() => handleCellPress(r, c)}
                  activeOpacity={0.8}
                >
                  {ep ? (
                    <View style={[styles.endpointNode, { backgroundColor: ep.colorHex }]}>
                      <View style={styles.innerDot} />
                    </View>
                  ) : cellColorHex ? (
                    <View style={[styles.pathSegment, { backgroundColor: cellColorHex }]} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Instruction Help Note */}
      <Text style={styles.hintText}>
        Tap an endpoint to draw a conduit to its matching colored node.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  hudBar: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  hudChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0E2A1F',
    borderWidth: 1,
    borderColor: '#1D4D38',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  hudLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  hudValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fonts.heading,
  },
  resetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#14382A',
    borderWidth: 1,
    borderColor: '#225B44',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  boardGrid: {
    backgroundColor: '#071A12',
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: '#133E2B',
    overflow: 'hidden',
  },
  boardRow: {
    flexDirection: 'row',
    flex: 1,
  },
  cell: {
    borderWidth: 0.5,
    borderColor: '#103022',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endpointNode: {
    width: '60%',
    height: '60%',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFF',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  innerDot: {
    width: '35%',
    height: '35%',
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  pathSegment: {
    width: '40%',
    height: '40%',
    borderRadius: radii.xs,
  },
  hintText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    maxWidth: 300,
  },
});
