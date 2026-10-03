/**
 * おまかせモード（適応難易度）。決まりの本体は learning-app-kit（全アプリ共通）。
 *
 * 習熟度は「記録に残した skillId」で引く。レベルIDがそのまま記録の名前になっている
 * モジュールは levelIds だけ渡す。記録の名前がちがうモジュール（例: レベル '2-1'・記録 'hissan-2-1'）
 * だけ toSkillId を渡す。以前はここで prefix を必ず足していたため、IDがすでに 'compare-basic' の
 * アプリでは 'compare-compare-basic' を引き、開始レベルがいつも最初になっていた。
 */
import { useAdaptiveLevels, type Adaptive } from 'learning-app-kit/react';
import { useProgressStore } from '../store/progressStore';

export type { Adaptive };

export function useAdaptive<L extends string>(levelIds: L[], toSkillId?: (levelId: L) => string): Adaptive<L> {
  const getMastery = useProgressStore((s) => s.getMastery);
  return useAdaptiveLevels(levelIds, getMastery, toSkillId);
}
