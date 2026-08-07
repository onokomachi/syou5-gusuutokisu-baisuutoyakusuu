/**
 * 共通UIプリミティブ。デザイントークンで全テーマ追従。コピペ解消・一貫性確保（CLT）。
 */
import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Lightbulb, Sparkles } from 'lucide-react';
import { praiseClear } from '../../lib/praise';

/* ---- Button ---- */
type BtnVariant = 'primary' | 'secondary' | 'ghost';
export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }> = ({ variant = 'primary', className = '', children, ...rest }) => {
  const base = 'rounded-2xl font-black transition-all active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100';
  const styles: Record<BtnVariant, string> = {
    primary: 'bg-brand text-on-brand hover:bg-brand-strong shadow-lg',
    secondary: 'bg-surface border-2 border-line text-content hover:bg-surface-2',
    ghost: 'text-muted hover:bg-surface-3',
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...rest}>{children}</button>;
};

/* ---- Card / Panel ---- */
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...rest }) => (
  <div className={`bg-surface border border-line rounded-[28px] shadow-xl ${className}`} {...rest}>{children}</div>
);

/* ---- Chip ---- */
export const Chip: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${className}`}>{children}</span>
);

/* ---- MasteryBar（Khan型 習熟度） ---- */
export const MasteryBar: React.FC<{ value: number; segments?: number }> = ({ value, segments = 5 }) => {
  const filled = Math.round(value * segments);
  return (
    <div className="flex items-center gap-1" aria-label={`習熟度 ${Math.round(value * 100)}%`}>
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className={`h-2 w-5 rounded-full ${i < filled ? 'bg-emerald-500' : 'bg-surface-3'}`} />
      ))}
    </div>
  );
};

/* ---- HintBox（アイコン＋ヒント） ---- */
export const HintBox: React.FC<{ children: React.ReactNode; tone?: 'hint' | 'wrong' }> = ({ children, tone = 'hint' }) => (
  <div className={`rounded-3xl p-5 border flex items-start gap-3 ${tone === 'wrong' ? 'bg-amber-50 border-amber-200' : 'bg-surface-2 border-line'}`}>
    <span className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${tone === 'wrong' ? 'bg-amber-100 text-amber-600' : 'bg-surface-3 text-brand'}`}>
      <Lightbulb size={24} />
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-content font-bold leading-relaxed">{children}</p>
    </div>
  </div>
);

/* ---- ResultPanel（クリア時の共通パネル：プロセス称賛＋アイコン） ---- */
export const ResultPanel: React.FC<{ perfect: boolean; detail?: React.ReactNode; onNext: () => void; nextLabel?: string; accentClass?: string }> = ({ perfect, detail, onNext, nextLabel = 'つぎの もんだい', accentClass = 'bg-emerald-500 hover:bg-emerald-600' }) => (
  <div className="flex flex-col items-center text-center p-6 bg-surface-2 border border-line rounded-3xl">
    <motion.div initial={{ scale: 0.7, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="w-20 h-20 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center">
      <Sparkles size={44} />
    </motion.div>
    <h3 className="text-xl font-black text-content mt-2 mb-1">{perfect ? 'パーフェクト！' : 'できたね！'}</h3>
    <p className="text-muted font-bold mb-2">{praiseClear(perfect)}</p>
    {detail && <div className="text-content font-bold mb-2">{detail}</div>}
    <button onClick={onNext} className={`w-full py-4 mt-3 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95 ${accentClass}`}>{nextLabel}</button>
  </div>
);

/* ---- SetupScreen（モジュール設定画面の共通枠） ---- */
export const SetupScreen: React.FC<{ title: string; subtitle?: string; onBack: () => void; children: React.ReactNode }> = ({ title, subtitle, onBack, children }) => (
  <div className="w-full h-full overflow-y-auto">
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button onClick={onBack} className="flex items-center gap-2 text-muted hover:text-content font-bold px-3 py-2 rounded-xl hover:bg-surface-3 transition-colors mb-2">
        <ChevronLeft size={24} /> わり算ランドへ
      </button>
      <h1 className="text-3xl font-black text-content text-center mb-1">{title}</h1>
      {subtitle && <p className="text-muted text-center font-medium mb-6">{subtitle}</p>}
      {!subtitle && <div className="mb-6" />}
      {children}
    </div>
  </div>
);

/* ---- LevelCard（レベル選択カード＋習熟度＋きょうのクリア数） ---- */
export const LevelCard: React.FC<{ label: string; desc: string; mastery?: number; todayCount?: number; onClick: () => void; accentBorder?: string }> = ({ label, desc, mastery, todayCount, onClick, accentBorder = 'hover:border-emerald-400' }) => (
  <button onClick={onClick} className={`relative p-5 rounded-3xl bg-surface border-2 border-line ${accentBorder} hover:shadow-lg text-left transition-all active:scale-[0.98]`}>
    {todayCount !== undefined && (
      <span className={`absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${todayCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-3 text-faint'}`}>
        きょう ✓{todayCount}
      </span>
    )}
    <div className="text-lg font-black text-content mb-1 pr-20">{label}</div>
    <div className="text-sm text-muted font-medium mb-2">{desc}</div>
    {mastery !== undefined && <MasteryBar value={mastery} />}
  </button>
);
