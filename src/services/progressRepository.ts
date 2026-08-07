/**
 * 進捗データの保存先を抽象化するアダプタ。
 * 既定は localStorage。将来 Supabase / Firebase へ差し替える際は、
 * 同じ StateStorage インターフェースを満たす実装をここで返すだけでよい
 * （各コンポーネント・ストアは無改修）。
 */
import type { StateStorage } from 'zustand/middleware';

const localStorageAdapter: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
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
