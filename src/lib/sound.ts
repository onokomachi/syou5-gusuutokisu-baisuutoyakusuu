/**
 * やさしい効果音。本体は learning-app-kit（全アプリ共通）。音のオン・オフはこのアプリの設定から読む。
 */
import { createSound } from 'learning-app-kit/app';
import { useSettingsStore } from '../store/settingsStore';

export const { playCorrect, playClear, playLevelUp, playSoftTry } =
  createSound(() => useSettingsStore.getState().soundEnabled);
