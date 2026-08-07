/**
 * 学習のきろく。全モジュール横断（progressStore）の進捗・連続記録・履歴・ごほうびバッジ。
 */
import React from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft, Calendar, CheckCircle2, History, Trophy, TrendingUp, Award as AwardIcon,
  Star, Sparkles, Award, Flame, Crown, Divide, Zap, Compass, CheckCheck, Scale, Search, BookOpen, Lock,
  ChevronDown, ClipboardCheck, Medal, Target, Rocket, Gem, ShieldCheck,
} from 'lucide-react';
import { useProgressStore, ModuleId } from '../store/progressStore';
import { MODULES } from '../constants';
import { computeBadges } from '../lib/badges';

interface Props { onBack: () => void; }

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Star, Sparkles, Award, Trophy, Flame, Crown, Divide, Zap, Compass, CheckCheck, Scale, Search, BookOpen,
  Medal, Target, Rocket, Gem, ClipboardCheck, ShieldCheck,
};

export const LogView: React.FC<Props> = ({ onBack }) => {
  const logs = useProgressStore((s) => s.logs);
  const maxStreak = useProgressStore((s) => s.maxStreak);
  const currentStreak = useProgressStore((s) => s.currentStreak);
  const totalCorrect = useProgressStore((s) => s.totalCorrect);
  const moduleCountsAll = useProgressStore((s) => s.moduleCounts);
  const bestTestOmote = useProgressStore((s) => s.bestTestOmote);
  const bestTestUra = useProgressStore((s) => s.bestTestUra);
  const bestTestTotal = useProgressStore((s) => s.bestTestTotal);
  const testPerfectCounts = useProgressStore((s) => s.testPerfectCounts);
  const masteredModulesAll = useProgressStore((s) => s.masteredModules);
  const [scope, setScope] = React.useState<'all' | 'today'>('all');
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  const countToday = logs.filter((l) => l.ts >= todayTs && l.correct).length;

  // バッジ判定・「すべて」は累計カウンタ（頭打ちしない）を使う
  const moduleCounts: Record<string, number> = {};
  MODULES.forEach((m) => (moduleCounts[m.id] = moduleCountsAll[m.id] ?? 0));
  // 「今日」は当日の logs（直近なので 200件キャップ内に収まる）から集計
  const moduleCountsToday: Record<string, number> = {};
  MODULES.forEach((m) => (moduleCountsToday[m.id] = logs.filter((l) => l.moduleId === m.id && l.correct && l.ts >= todayTs).length));
  const moduleCountsView = scope === 'all' ? moduleCounts : moduleCountsToday;

  const masteredModules: Record<string, boolean> = {};
  MODULES.forEach((m) => (masteredModules[m.id] = !!masteredModulesAll[m.id]));
  const badges = computeBadges({ totalCorrect, maxStreak, moduleCounts, bestTestOmote, bestTestUra, bestTestTotal, testPerfectCounts, masteredModules });
  const earnedCount = badges.filter((b) => b.earned).length;

  const moduleTitle = (id: ModuleId) => MODULES.find((m) => m.id === id)?.title ?? (id === 'mock-test' ? 'テスト' : id);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-surface-2">
      <div className="flex items-center justify-between p-6 bg-surface border-b border-line shadow-sm sticky top-0 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-muted hover:text-content transition-colors font-bold">
          <ChevronLeft size={20} /><span>もどる</span>
        </button>
        <div className="flex items-center gap-2 text-blue-600">
          <History size={24} /><h2 className="text-xl font-black tracking-tight">学習のきろく</h2>
        </div>
        <div className="w-20" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* サマリー */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard color="bg-blue-600" label="きょう クリア" value={countToday} icon={<CheckCircle2 size={64} />} />
            <SummaryCard color="bg-indigo-600" label="ぜんぶで クリア" value={totalCorrect} icon={<Trophy size={64} />} />
            <SummaryCard color="bg-gradient-to-br from-amber-500 to-orange-600" label="いま 連続ノーミス" value={currentStreak} icon={<TrendingUp size={64} />} />
            <SummaryCard color="bg-gradient-to-br from-rose-500 to-pink-600" label="最高 連続記録" value={maxStreak} icon={<Flame size={64} />} />
          </div>

          {/* モジュール別 */}
          <div>
            <div className="flex items-center justify-between gap-2 px-2 mb-3">
              <span className="text-faint text-xs font-black uppercase tracking-widest">コースべつ クリア数</span>
              <div className="inline-flex rounded-full bg-surface-3 p-1">
                {(['all', 'today'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScope(s)}
                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-colors ${scope === s ? 'bg-blue-600 text-white shadow' : 'text-muted hover:text-content'}`}
                  >
                    {s === 'all' ? 'すべて' : '今日'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MODULES.map((m) => {
                const Icon = ICONS[m.icon] ?? Divide;
                return (
                  <div key={m.id} className="bg-surface rounded-2xl border border-line shadow-sm p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-2 text-muted flex items-center justify-center shrink-0"><Icon size={20} /></div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-muted truncate">{m.title}</div>
                      <div className="text-xl font-black text-content tabular-nums">{moduleCountsView[m.id]}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* バッジ（横一列・横スクロールで全部たしかめられる） */}
          <div>
            <div className="flex items-center gap-2 px-2 mb-3">
              <AwardIcon size={16} className="text-amber-400" />
              <span className="text-faint text-xs font-black uppercase tracking-widest">ごほうびバッジ（{earnedCount}/{badges.length}）</span>
              <span className="text-faint text-[10px] font-bold">← よこに スクロール →</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3 px-1 snap-x snap-mandatory">
              {badges.map((b) => {
                const Icon = ICONS[b.icon] ?? Star;
                const isGod = b.id === 'god';
                // 「神」は最上位称号なので獲得時は金のグラデで特別に強調
                const cardCls = b.earned
                  ? isGod
                    ? 'bg-gradient-to-br from-amber-200 to-yellow-400 border-amber-500 ring-2 ring-amber-300'
                    : 'bg-amber-50 border-amber-200'
                  : 'bg-surface border-line opacity-60';
                const iconCls = b.earned
                  ? isGod ? 'bg-amber-500 text-white' : 'bg-amber-400 text-white'
                  : 'bg-surface-3 text-faint';
                return (
                  <div key={b.id} className={`snap-start shrink-0 w-28 rounded-2xl p-4 flex flex-col items-center text-center border ${cardCls}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${iconCls}`}>
                      {b.earned ? <Icon size={24} /> : <Lock size={20} />}
                    </div>
                    <div className={`text-xs font-black ${b.earned ? (isGod ? 'text-amber-900' : 'text-amber-700') : 'text-faint'}`}>{b.title}</div>
                    <div className="text-[10px] text-faint font-bold mt-0.5">{b.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 履歴 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2">
              <History size={16} className="text-faint" />
              <span className="text-faint text-xs font-black uppercase tracking-widest">これまでのきろく</span>
            </div>
            {logs.length === 0 ? (
              <div className="text-center py-16 bg-surface rounded-3xl border border-dashed border-line">
                <Calendar className="mx-auto text-faint mb-4" size={48} />
                <p className="text-muted font-bold">まだ きろくが ありません。やってみよう！</p>
              </div>
            ) : (
              logs.slice(0, 50).map((log, idx) => {
                const isTest = !!log.detail;
                const expanded = expandedId === log.id;
                return (
                  <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                    className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
                    <div
                      role={isTest ? 'button' : undefined}
                      onClick={isTest ? () => setExpandedId(expanded ? null : log.id) : undefined}
                      className={`p-4 flex items-center justify-between ${isTest ? 'cursor-pointer hover:bg-surface-2 transition-colors' : ''}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isTest ? 'bg-blue-50 text-blue-500' : log.correct ? 'bg-emerald-50 text-emerald-500' : 'bg-surface-2 text-faint'}`}>
                          {isTest ? <ClipboardCheck size={20} /> : <CheckCircle2 size={20} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-faint text-xs font-bold">{formatDate(log.ts)}</span>
                            <span className="px-2 py-0.5 bg-surface-3 text-muted rounded text-[10px] font-black truncate">{moduleTitle(log.moduleId)}</span>
                          </div>
                          <div className="text-lg font-black text-content truncate">{log.label}</div>
                        </div>
                      </div>
                      {isTest ? (
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-black tabular-nums">{log.detail!.total}/{log.detail!.totalMax}点</span>
                          <ChevronDown size={18} className={`text-faint transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </div>
                      ) : log.correct ? (
                        <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-black shrink-0 ml-2">
                          <AwardIcon size={14} /><span>ノーミス！</span>
                        </div>
                      ) : null}
                    </div>

                    {isTest && expanded && (
                      <div className="px-4 pb-4 border-t border-line/60 pt-3 space-y-1">
                        {log.detail!.steps.map((st, i) => (
                          <div key={i} className="flex items-start justify-between gap-2 py-1.5 border-b border-line/40 last:border-0">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-faint">大問{st.daimon}{st.sub ?? ''}</span>
                                <span className="text-xs font-bold text-content truncate">{st.title}</span>
                              </div>
                              <div className="text-xs text-muted font-bold mt-0.5">
                                {st.q}　→　<span className="text-content">{st.a}</span>
                              </div>
                            </div>
                            <span className={`font-black tabular-nums shrink-0 text-sm ${st.correct ? 'text-emerald-600' : 'text-rose-400'}`}>
                              {st.correct ? '○' : '×'} {st.earned}/{st.points}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ color: string; label: string; value: number; icon: React.ReactNode }> = ({ color, label, value, icon }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${color} p-5 rounded-[28px] text-white shadow-lg flex items-center justify-between overflow-hidden relative`}>
    <div className="relative z-10">
      <div className="text-white/80 text-[11px] font-black uppercase tracking-wider mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black tabular-nums">{value}</span>
        <span className="text-white/80 text-sm font-bold">問</span>
      </div>
    </div>
    <div className="text-white/10 absolute -right-2 -bottom-2">{icon}</div>
  </motion.div>
);
