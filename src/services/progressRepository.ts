/**
 * 進捗データの保存先を抽象化するアダプタ。
 * 既定は localStorage。将来 Supabase / Firebase へ差し替える際は、
 * 同じ StateStorage インターフェースを満たす実装をここで返すだけでよい
 * （各コンポーネント・ストアは無改修）。
 *
 * 旧バージョン（hissann_progress_v3 = progressService 形式）のデータは、
 * 新キーが未作成のとき一度だけ zustand persist 形式へ変換して引き継ぐ。
 */
import type { StateStorage } from 'zustand/middleware';

const NEW_KEY = 'hissan_progress_v4';
const LEGACY_KEY = 'hissann_progress_v3';

interface LegacyLog {
  id: string;
  timestamp: number;
  difficulty: string;
  problem: { dividend: number; divisor: number };
  hasRemainder: boolean;
  isPerfect: boolean;
  isMasterMode?: boolean;
}

/** 旧 progressService のデータを新ストアの persist 形式へ変換する。 */
function migrateLegacy(): string | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const old = JSON.parse(raw);
    const oldLogs: LegacyLog[] = Array.isArray(old.logs) ? old.logs : [];
    const stats: Record<string, number> = old.stats ?? {};

    // 旧 stats（クリア総数）→ 累計カウンタ・習熟度のたたき台
    let totalCorrect = 0;
    const mastery: Record<string, { attempts: number; corrects: number; perfectStreak: number }> = {};
    for (const [key, count] of Object.entries(stats)) {
      const diff = key.replace(/_(rem|no_rem)$/, '');
      const skillId = `hissan-${diff}`;
      const prev = mastery[skillId] ?? { attempts: 0, corrects: 0, perfectStreak: 0 };
      mastery[skillId] = { attempts: prev.attempts + count, corrects: prev.corrects + count, perfectStreak: 0 };
      totalCorrect += count;
    }

    const logs = oldLogs.slice(0, 200).map((l) => ({
      id: l.id ?? crypto.randomUUID(),
      ts: l.timestamp,
      moduleId: 'hissan',
      skillId: `hissan-${l.difficulty}`,
      label: `${l.problem?.dividend ?? '?'} ÷ ${l.problem?.divisor ?? '?'}`,
      correct: !!l.isPerfect,
    }));

    const state = {
      logs,
      mastery,
      currentStreak: old.currentStreak ?? 0,
      maxStreak: old.maxStreak ?? 0,
      dailyGoal: 10,
      totalCorrect,
      moduleCounts: { hissan: totalCorrect },
      bestTestOmote: 0,
      bestTestUra: 0,
      bestTestTotal: 0,
      masteredModules: {},
    };
    return JSON.stringify({ state, version: 1 });
  } catch {
    return null;
  }
}

const localStorageAdapter: StateStorage = {
  getItem: (name) => {
    try {
      const value = localStorage.getItem(name);
      if (value == null && name === NEW_KEY) {
        const migrated = migrateLegacy();
        if (migrated) {
          localStorage.setItem(NEW_KEY, migrated);
          return migrated;
        }
      }
      return value;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* 容量超過などは黙って無視（児童端末でクラッシュさせない） */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* noop */
    }
  },
};

/** 現在の保存先を返す。差し替えポイントはこの関数のみ。 */
export function getProgressStorage(): StateStorage {
  return localStorageAdapter;
}
