/**
 * ひょうじ設定パネル（モーダル）。
 * 資料: 背景色/コントラスト・大きいフォント・読み上げを児童自身が切り替えられるようにする。
 */
import React from 'react';
import { motion } from 'motion/react';
import { X, Sun, Flower2, Terminal, Flame, Sparkles, Cloud, Lock, Music, Music2 } from 'lucide-react';
import { useSettingsStore, Theme, FontScale } from '../store/settingsStore';
import { useProgressStore } from '../store/progressStore';
import { MODULES } from '../constants';
import { badgeRatio } from '../lib/badges';
import { THEME_UNLOCK, isThemeUnlocked } from '../lib/themeUnlock';

interface Props {
  onClose: () => void;
}

const THEMES: { id: Theme; label: string; icon: React.ReactNode; swatch: string }[] = [
  { id: 'light', label: 'ノーマル', icon: <Sun size={22} />, swatch: 'bg-surface border-slate-300' },
  { id: 'dark', label: 'マトリックス', icon: <Terminal size={22} />, swatch: 'bg-black border-green-500' },
  { id: 'aurora', label: '極光', icon: <Sparkles size={22} />, swatch: 'bg-[#060c16] border-purple-400' },
  { id: 'sakura', label: '桜吹雪', icon: <Flower2 size={22} />, swatch: 'bg-[#12051c] border-pink-400' },
  { id: 'inferno', label: 'インフェルノ', icon: <Flame size={22} />, swatch: 'bg-[#0c0100] border-orange-500' },
  { id: 'tenkuu', label: '天空神', icon: <Cloud size={22} />, swatch: 'bg-[#041022] border-yellow-300' },
];

const FONTS: { id: FontScale; label: string; sample: string }[] = [
  { id: 'normal', label: 'ふつう', sample: 'text-base' },
  { id: 'large', label: 'おおきい', sample: 'text-xl' },
  { id: 'xlarge', label: 'とてもおおきい', sample: 'text-2xl' },
];

export const Settings: React.FC<Props> = ({ onClose }) => {
  const { theme, fontScale, soundEnabled, setTheme, setFontScale, toggleSound } = useSettingsStore();

  // バッジ獲得率（特別テーマの解放判定に使う）
  const totalCorrect = useProgressStore((s) => s.totalCorrect);
  const maxStreak = useProgressStore((s) => s.maxStreak);
  const moduleCountsAll = useProgressStore((s) => s.moduleCounts);
  const bestTestOmote = useProgressStore((s) => s.bestTestOmote);
  const bestTestUra = useProgressStore((s) => s.bestTestUra);
  const bestTestTotal = useProgressStore((s) => s.bestTestTotal);
  const testPerfectCounts = useProgressStore((s) => s.testPerfectCounts);
  const masteredModulesAll = useProgressStore((s) => s.masteredModules);
  const moduleCounts: Record<string, number> = {};
  MODULES.forEach((m) => (moduleCounts[m.id] = moduleCountsAll[m.id] ?? 0));
  const masteredModules: Record<string, boolean> = {};
  MODULES.forEach((m) => (masteredModules[m.id] = !!masteredModulesAll[m.id]));
  const ratio = badgeRatio({ totalCorrect, maxStreak, moduleCounts, bestTestOmote, bestTestUra, bestTestTotal, testPerfectCounts, masteredModules });

  // 選択中ボタンの強調はテーマ追従（brand 色＋surface-3）にして、
  // ダーク（マトリックス）でも文字が暗くならず読みやすいようにする。
  const selCls = 'border-brand bg-surface-3';
  const unselCls = 'border-line hover:border-faint';
  // 暗背景テーマのときはオーバーレイを透明にして、背後の動く背景をそのまま見せる
  // （blur や暗幕で背景がにじまないようにする）。
  const neonThemes: Theme[] = ['dark', 'aurora', 'sakura', 'inferno', 'tenkuu'];
  const overlayCls = neonThemes.includes(theme) ? 'bg-black/20' : 'bg-slate-900/40 backdrop-blur-sm';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className={`fixed inset-0 z-[200] ${overlayCls} flex items-center justify-center p-6`}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-line rounded-[32px] p-8 max-w-lg w-full shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-content">ひょうじの せってい</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-3 text-muted"
            aria-label="とじる"
          >
            <X size={24} />
          </button>
        </div>

        {/* 背景・コントラスト */}
        <div className="mb-6">
          <label className="text-xs font-black text-faint uppercase tracking-widest mb-3 block">
            はいけいの いろ
          </label>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((t) => {
              const unlocked = isThemeUnlocked(t.id, ratio);
              const reqLabel = THEME_UNLOCK[t.id]?.label;
              return (
                <button
                  key={t.id}
                  onClick={() => unlocked && setTheme(t.id)}
                  disabled={!unlocked}
                  aria-label={unlocked ? t.label : `${t.label}（${reqLabel} で 解放）`}
                  className={`relative p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                    theme === t.id ? selCls : unselCls
                  } ${unlocked ? '' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <span className={`w-10 h-10 rounded-full border-2 ${t.swatch}`} />
                  <span className="flex items-center gap-1 text-sm font-bold text-content">
                    {t.icon}
                    {t.label}
                  </span>
                  {!unlocked && (
                    <span className="absolute inset-0 rounded-2xl bg-black/45 flex flex-col items-center justify-center gap-1 text-white">
                      <Lock size={18} />
                      <span className="text-[10px] font-black leading-none">{reqLabel}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 文字サイズ */}
        <div className="mb-6">
          <label className="text-xs font-black text-faint uppercase tracking-widest mb-3 block">
            もじの おおきさ
          </label>
          <div className="grid grid-cols-3 gap-3">
            {FONTS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFontScale(f.id)}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  fontScale === f.id ? selCls : unselCls
                }`}
              >
                <span className={`block font-black text-content ${f.sample}`}>あ</span>
                <span className="text-xs font-bold text-muted">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 効果音 */}
        <div className="flex items-center justify-between p-5 bg-surface-2 rounded-2xl border border-line">
          <div className="flex items-center gap-3">
            {soundEnabled ? <Music className="text-brand" /> : <Music2 className="text-faint" />}
            <div>
              <div className="font-bold text-content">こうかおん</div>
              <div className="text-sm text-muted">せいかいや クリアの 音をならします。</div>
            </div>
          </div>
          <button
            onClick={toggleSound}
            className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${
              soundEnabled ? 'bg-brand' : 'bg-surface-3'
            }`}
            aria-label="こうかおんの オン・オフ"
          >
            <motion.div
              animate={{ x: soundEnabled ? 24 : 0 }}
              className="w-6 h-6 rounded-full shadow-sm"
              style={{ backgroundColor: '#f8fafc' }}
            />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
