/**
 * やさしい効果音（Web Audio API でその場合成。音声ファイル不要）。
 * 資料: 不快なブザー音は使わない。正解・クリア・レベルアップの前向きな音のみ。
 * 設定で OFF にできる。
 */
import { useSettingsStore } from '../store/settingsStore';

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, gain = 0.15, type: OscillatorType = 'sine') {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ac.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function enabled() {
  return useSettingsStore.getState().soundEnabled;
}

/** 1ステップ正解などの軽い「ポン」。 */
export function playCorrect() {
  if (!enabled()) return;
  tone(880, 0, 0.12, 0.12);
}

/** 問題クリアの明るい上昇音。 */
export function playClear() {
  if (!enabled()) return;
  [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.1, 0.18, 0.14));
}

/** レベルアップのファンファーレ。 */
export function playLevelUp() {
  if (!enabled()) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.2, 0.16, 'triangle'));
}

/** やり直しをうながす やわらかい音（不快でない低めの短音）。 */
export function playSoftTry() {
  if (!enabled()) return;
  tone(330, 0, 0.16, 0.08, 'sine');
}
