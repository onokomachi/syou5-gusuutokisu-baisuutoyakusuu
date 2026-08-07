/**
 * きょうの目標リング（目標設定理論, エビI）。今日の正解数 / 目標。
 * タップで目標を 5→10→15→20 と切替（自律性）。達成で色が変わる。
 */
import React from 'react';
import { Target, Check } from 'lucide-react';
import { useProgressStore } from '../../store/progressStore';

const GOALS = [5, 10, 15, 20];

export const GoalRing: React.FC = () => {
  const goal = useProgressStore((s) => s.dailyGoal);
  const setGoal = useProgressStore((s) => s.setDailyGoal);
  const count = useProgressStore((s) => s.getTodayCount());

  const done = count >= goal;
  const ratio = Math.min(1, count / goal);
  const R = 26, C = 2 * Math.PI * R;
  const cycle = () => setGoal(GOALS[(GOALS.indexOf(goal) + 1) % GOALS.length] ?? 10);

  return (
    <button onClick={cycle} className="flex items-center gap-3 bg-surface px-4 py-2 rounded-full shadow-sm border border-line hover:bg-surface-2 transition-all" aria-label="きょうの目標">
      <span className="relative inline-flex items-center justify-center" style={{ width: 40, height: 40 }}>
        <svg width="40" height="40" viewBox="0 0 64 64" className="-rotate-90">
          <circle cx="32" cy="32" r={R} fill="none" stroke="var(--color-surface-3)" strokeWidth="8" />
          <circle cx="32" cy="32" r={R} fill="none" stroke={done ? '#10b981' : 'var(--color-brand)'} strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - ratio)} style={{ transition: 'stroke-dashoffset .5s' }} />
        </svg>
        <span className="absolute">{done ? <Check size={18} className="text-emerald-500" /> : <Target size={16} className="text-brand" />}</span>
      </span>
      <span className="text-left leading-tight">
        <span className="block text-[10px] font-black text-faint uppercase tracking-wider">きょうの目標</span>
        <span className="block text-sm font-black text-content tabular-nums">{count} / {goal} 問</span>
      </span>
    </button>
  );
};
