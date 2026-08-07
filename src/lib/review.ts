/**
 * ふくしゅうコーナー。習熟度が低いスキル（正答率<70%・2回以上挑戦）を抽出し、
 * ホームで「もう少し れんしゅうしよう」として提示する。
 */
import { ModuleId, SkillMastery, skillToModuleId } from '../store/progressStore';
import { MODULES } from '../constants';

export interface ReviewTarget {
  moduleId: ModuleId;
  skillId: string;
  label: string;
  mastery: number;
}

export function getReviewTargets(
  mastery: Record<string, SkillMastery>,
  n = 3,
): ReviewTarget[] {
  const seen = new Set<ModuleId>();
  return Object.entries(mastery)
    .filter(([, m]) => m.attempts >= 2 && m.corrects / m.attempts < 0.7)
    .map(([skillId, m]): ReviewTarget | null => {
      const moduleId = skillToModuleId(skillId);
      if (!moduleId || moduleId === 'mock-test') return null;
      return {
        moduleId,
        skillId,
        label: MODULES.find((mod) => mod.id === moduleId)?.title ?? moduleId,
        mastery: m.corrects / m.attempts,
      };
    })
    .filter((x): x is ReviewTarget => x !== null)
    .sort((a, b) => a.mastery - b.mastery)
    .filter((t) => {
      if (seen.has(t.moduleId)) return false;
      seen.add(t.moduleId);
      return true;
    })
    .slice(0, n);
}
