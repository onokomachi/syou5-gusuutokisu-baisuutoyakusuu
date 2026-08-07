/**
 * 児童ごとの表示・効果音設定。
 * UDフォント・コントラスト・文字サイズなどのアクセシビリティ／認知負荷低減に対応。
 * localStorage に永続化（zustand persist）。
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'aurora' | 'sakura' | 'inferno' | 'tenkuu';
export type FontScale = 'normal' | 'large' | 'xlarge';

const VALID_THEMES: Theme[] = ['light', 'dark', 'aurora', 'sakura', 'inferno', 'tenkuu'];

interface SettingsState {
  theme: Theme;
  fontScale: FontScale;
  soundEnabled: boolean;
  setTheme: (t: Theme) => void;
  setFontScale: (s: FontScale) => void;
  toggleSound: () => void;
}

export const FONT_SCALE_PX: Record<FontScale, string> = {
  normal: '16px',
  large: '18px',
  xlarge: '20px',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      fontScale: 'normal',
      soundEnabled: true,
      setTheme: (theme) => set({ theme }),
      setFontScale: (fontScale) => set({ fontScale }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
    }),
    {
      name: 'hissan_settings_v1',
      version: 2,
      // v1→v2: 廃止テーマ（和 cream / 深海 deep / 宇宙神 cosmos）は light に戻す
      migrate: (persisted) => {
        const state = persisted as Partial<SettingsState> | undefined;
        if (state && !VALID_THEMES.includes(state.theme as Theme)) {
          state.theme = 'light';
        }
        return state as SettingsState;
      },
    }
  )
);
