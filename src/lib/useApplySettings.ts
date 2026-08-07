/**
 * 設定（テーマ・文字サイズ）を DOM に反映する副作用フック。
 * Tailwind v4 の text-* は rem 基準なので、html の font-size を変えると全体が拡大する。
 * テーマは body の data-theme で切り替え（index.css 側で背景色を定義）。
 */
import { useEffect } from 'react';
import { useSettingsStore, FONT_SCALE_PX } from '../store/settingsStore';

export function useApplySettings() {
  const theme = useSettingsStore((s) => s.theme);
  const fontScale = useSettingsStore((s) => s.fontScale);

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SCALE_PX[fontScale];
  }, [fontScale]);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);
}
