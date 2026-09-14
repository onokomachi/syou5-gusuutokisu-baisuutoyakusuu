/**
 * ふくしゅうコーナー。習熟度が低いスキル（正答率<70%・2回以上挑戦）を抽出し、
 * ホームで「もう少し れんしゅうしよう」として提示する。
 */
import { getDueSkills, type ReviewState } from 'learning-app-kit/review';
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

/**
 * きょうの ふくしゅう（間隔反復）。前に取り組んだスキルのうち復習の時期が来たものを、
 * 期限超過が大きい順に、モジュールごと1つずつ最大 n 件返す。
 *
 * 「もう少し れんしゅうしよう」（getReviewTargets＝正答率の低いスキル）とは役割がちがう。
 * こちらは「できていたことを、わすれないうちに もういちど」。
 * Dunlosky et al. (2013) の distributed practice を単元内で実現する。
 */
export function getDueReviewTargets(
  review: Record<string, ReviewState>,
  mastery: Record<string, SkillMastery>,
  exclude: ReadonlySet<string> = new Set(),
  n = 3,
  now = Date.now(),
): ReviewTarget[] {
  const seen = new Set<ModuleId>();
  const out: ReviewTarget[] = [];
  for (const d of getDueSkills(review, { now })) {
    if (exclude.has(d.skillId)) continue;
    const moduleId = skillToModuleId(d.skillId);
    if (!moduleId || moduleId === 'mock-test' || moduleId === 'boss-battle' || seen.has(moduleId)) continue;
    seen.add(moduleId);
    const m = mastery[d.skillId];
    out.push({
      moduleId,
      skillId: d.skillId,
      label: MODULES.find((mod) => mod.id === moduleId)?.title ?? moduleId,
      mastery: m && m.attempts > 0 ? m.corrects / m.attempts : 0,
    });
    if (out.length >= n) break;
  }
  return out;
}
