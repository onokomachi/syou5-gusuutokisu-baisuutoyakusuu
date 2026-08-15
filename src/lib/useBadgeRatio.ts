/**
 * バッジ獲得率（0..1）を progressStore から算出するフック。
 * テーマ解放やボス戦の挑戦条件など、複数箇所で同じ計算を使うため共通化する。
 */
import { useProgressStore } from '../store/progressStore';
import { MODULES } from '../constants';
import { badgeRatio } from './badges';

export function useBadgeRatio(): number {
  const totalCorrect = useProgressStore((s) => s.totalCorrect);
  const maxStreak = useProgressStore((s) => s.maxStreak);
  const moduleCountsAll = useProgressStore((s) => s.moduleCounts);
  const bestTestOmote = useProgressStore((s) => s.bestTestOmote);
  const bestTestUra = useProgressStore((s) => s.bestTestUra);
  const bestTestTotal = useProgressStore((s) => s.bestTestTotal);
  const testPerfectCounts = useProgressStore((s) => s.testPerfectCounts);
  const masteredModulesAll = useProgressStore((s) => s.masteredModules);
  const debugAllBadges = useProgressStore((s) => s.debugAllBadges);

  const moduleCounts: Record<string, number> = {};
  MODULES.forEach((m) => (moduleCounts[m.id] = moduleCountsAll[m.id] ?? 0));
  const masteredModules: Record<string, boolean> = {};
  MODULES.forEach((m) => (masteredModules[m.id] = !!masteredModulesAll[m.id]));

  return badgeRatio({
    totalCorrect, maxStreak, moduleCounts,
    bestTestOmote, bestTestUra, bestTestTotal,
    testPerfectCounts, masteredModules, debugAllBadges,
  });
}
