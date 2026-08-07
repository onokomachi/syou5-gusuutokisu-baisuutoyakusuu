/**
 * 適応難易度（BKT の簡易版, エビレベルI）。
 * progressStore のスキル別習熟度から開始レベルを推定し、
 * セッション中は「2問続けてノーミス→レベルアップ」「2問続けてミス→レベルダウン」で自動調整する。
 */
import { useRef, useState } from 'react';
import { useProgressStore } from '../store/progressStore';

export function recommendStart(getMastery: (s: string) => number, prefix: string, levelIds: string[]): number {
  let start = 0;
  for (let i = 0; i < levelIds.length - 1; i++) {
    if (getMastery(`${prefix}-${levelIds[i]}`) >= 0.7) start = i + 1;
    else break;
  }
  return start;
}

export interface Adaptive<L extends string> {
  level: L;
  index: number;
  total: number;
  leveledUp: boolean;
  clearLevelUp: () => void;
  onResult: (perfect: boolean) => void;
}

export function useAdaptive<L extends string>(levelIds: L[], prefix: string): Adaptive<L> {
  const getMastery = useProgressStore((s) => s.getMastery);
  const [index, setIndex] = useState(() => recommendStart(getMastery, prefix, levelIds));
  const [leveledUp, setLeveledUp] = useState(false);
  const perfectRef = useRef(0);
  const missRef = useRef(0);

  const onResult = (perfect: boolean) => {
    if (perfect) {
      missRef.current = 0;
      perfectRef.current += 1;
      if (perfectRef.current >= 2) {
        perfectRef.current = 0;
        setIndex((i) => {
          if (i < levelIds.length - 1) { setLeveledUp(true); return i + 1; }
          return i;
        });
      }
    } else {
      perfectRef.current = 0;
      missRef.current += 1;
      if (missRef.current >= 2) {
        missRef.current = 0;
        setIndex((i) => (i > 0 ? i - 1 : i));
      }
    }
  };

  return {
    level: levelIds[index],
    index,
    total: levelIds.length,
    leveledUp,
    clearLevelUp: () => setLeveledUp(false),
    onResult,
  };
}
