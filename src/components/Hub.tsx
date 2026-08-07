/**
 * ホーム＝「わり算ランド」。モジュールをカードで選ぶ。
 * 視覚的混沌を避けるため、余白を広く・1カード1テーマに。
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Divide, Zap, Compass, CheckCheck, Scale, Search, BookOpen,
  History, Settings as SettingsIcon, Lock, ClipboardCheck, ChevronRight, Flame,
} from 'lucide-react';
import { MODULES, ModuleMeta } from '../constants';
import { ModuleId, useProgressStore } from '../store/progressStore';
import { Settings } from './Settings';
import { GoalRing } from './ui/GoalRing';
import { getReviewTargets } from '../lib/review';

interface Props {
  onSelectModule: (id: ModuleId) => void;
  onOpenLog: () => void;
  onStartTest: () => void;
}

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Divide, Zap, Compass, CheckCheck, Scale, Search, BookOpen,
};

// Tailwind がパージしないよう静的に定義
const ACCENT: Record<string, { bg: string; text: string; ring: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'group-hover:ring-blue-300' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'group-hover:ring-emerald-300' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'group-hover:ring-violet-300' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'group-hover:ring-amber-300' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'group-hover:ring-rose-300' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', ring: 'group-hover:ring-cyan-300' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', ring: 'group-hover:ring-teal-300' },
};

const ModuleCard: React.FC<{ m: ModuleMeta; onClick: () => void; cleared: number }> = ({ m, onClick, cleared }) => {
  const Icon = ICONS[m.icon] ?? Divide;
  const accent = ACCENT[m.accent] ?? ACCENT.blue;
  const isReady = m.status === 'ready';

  return (
    <motion.button
      whileHover={isReady ? { y: -4 } : undefined}
      whileTap={isReady ? { scale: 0.98 } : undefined}
      onClick={() => {
        if (!isReady) return;
        onClick();
      }}
      className={`group relative text-left p-6 rounded-[28px] bg-surface border border-line shadow-sm ring-2 ring-transparent transition-all ${
        isReady ? `hover:shadow-lg ${accent.ring} cursor-pointer` : 'opacity-60 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-16 h-16 rounded-2xl ${accent.bg} ${accent.text} flex items-center justify-center`}>
          <Icon size={32} />
        </div>
        {!isReady && (
          <span className="flex items-center gap-1 bg-surface-3 text-faint px-3 py-1 rounded-full text-xs font-black">
            <Lock size={14} /> じゅんびちゅう
          </span>
        )}
        {isReady && cleared > 0 && (
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black ring-1 ring-amber-200">
            クリア {cleared}
          </span>
        )}
      </div>
      <h3 className="text-xl font-black text-content mb-1">{m.title}</h3>
      <p className="text-sm text-muted font-medium">{m.description}</p>
    </motion.button>
  );
};

export const Hub: React.FC<Props> = ({ onSelectModule, onOpenLog, onStartTest }) => {
  const [showSettings, setShowSettings] = useState(false);
  const getModuleCount = useProgressStore((s) => s.getModuleCount);
  const mastery = useProgressStore((s) => s.mastery);
  const currentStreak = useProgressStore((s) => s.currentStreak);
  const reviewTargets = getReviewTargets(mastery);

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* トップバー */}
        <div className="flex justify-between items-center gap-3 mb-2 flex-wrap">
          <div className="flex items-center gap-3">
            <GoalRing />
            {currentStreak > 0 && (
              <span className="flex items-center gap-1.5 bg-surface px-4 py-2 rounded-full shadow-sm border border-line text-amber-500 font-black text-sm">
                <Flame size={18} /> 連続ノーミス {currentStreak}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onOpenLog}
              className="flex items-center gap-2 bg-surface px-5 py-2.5 rounded-full shadow-sm border border-line text-muted font-bold hover:bg-surface-2 transition-all"
            >
              <History size={20} />
              <span>学習のきろく</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 bg-surface px-5 py-2.5 rounded-full shadow-sm border border-line text-muted font-bold hover:bg-surface-2 transition-all"
            >
              <SettingsIcon size={20} />
              <span>せってい</span>
            </button>
          </div>
        </div>

        {/* タイトル */}
        <div className="text-center pt-2 pb-8 flex flex-col items-center">
          <div className="mb-3">
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-blue-200">
              4年生のさんすう
            </span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black text-content tracking-tight">
              わり算の筆算<span className="text-blue-600">ラボEX</span>
            </h1>
          </div>
          <p className="text-muted font-medium mt-2">たてる・かける・ひく・おろす を マスターしよう！</p>
        </div>

        {/* 本番テストモード */}
        <motion.button
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.99 }}
          onClick={onStartTest}
          className="w-full mb-6 p-5 rounded-[24px] bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl text-left transition-all flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <ClipboardCheck size={30} />
          </div>
          <div className="flex-1">
            <div className="text-xl font-black">📝 本番テストモード</div>
            <div className="text-sm text-white/85 font-medium">「わり算の筆算」を テストと同じ 問題数で ちょうせん！</div>
          </div>
          <ChevronRight size={28} className="shrink-0 opacity-80" />
        </motion.button>

        {/* ふくしゅうコーナー */}
        {reviewTargets.length > 0 && (
          <div className="mb-6 p-5 rounded-[24px] bg-amber-50 border border-amber-200">
            <p className="text-sm font-black text-amber-700 mb-3">もう少し れんしゅうしよう</p>
            <div className="flex flex-wrap gap-2">
              {reviewTargets.map((t) => (
                <button
                  key={t.skillId}
                  onClick={() => onSelectModule(t.moduleId)}
                  className="px-4 py-2 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-black text-sm hover:bg-amber-200 transition-all active:scale-95"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* モジュール */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((m) => (
            <ModuleCard
              key={m.id}
              m={m}
              cleared={getModuleCount(m.id)}
              onClick={() => onSelectModule(m.id)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </div>
  );
};
