/**
 * 筆算シミュレーターモジュール（本アプリの中核）。
 * 既存の DivisionSimulator（位置選択・0の指導・仮商の修正つき）をラップし、
 * レベル選択＋「おまかせ（適応難易度）」モードと進捗記録・効果音を付ける。
 */
import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { ProblemSelector } from '../ProblemSelector';
import { DivisionSimulator } from '../DivisionSimulator';
import { generateProblem } from '../ProblemGenerator';
import { Difficulty, Problem, StartOptions } from '../../types';
import { AdaptiveBar } from '../shared/AdaptiveBar';
import { useProgressStore } from '../../store/progressStore';
import { useAdaptive } from '../../lib/useAdaptive';
import { ChevronLeft } from 'lucide-react';

interface Props { onExit: () => void; }

const LEVEL_IDS: Difficulty[] = ['2-1', '3-1', '2-2', '3-2', '3-3'];
const AUTO_OPTIONS: StartOptions = { allowRemainder: true, masterMode: false, zeroFocus: true, zeroShortcut: false };

export const HissanModule: React.FC<Props> = ({ onExit }) => {
  const [mode, setMode] = useState<'setup' | 'level' | 'auto'>('setup');
  const [settings, setSettings] = useState<{ diff: Difficulty; options: StartOptions } | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const recordResult = useProgressStore((s) => s.recordResult);
  const getTodaySkillCount = useProgressStore((s) => s.getTodaySkillCount);
  const adaptive = useAdaptive<Difficulty>(LEVEL_IDS, 'hissan');

  // ProblemSelector のクリア数バッジ用（きょうのスキル別クリア数）
  const todayStats: Record<string, number> = {};
  LEVEL_IDS.forEach((d) => { todayStats[`${d}_no_rem`] = getTodaySkillCount(`hissan-${d}`); });

  const handleStart = (diff: Difficulty, options: StartOptions) => {
    setSettings({ diff, options });
    setProblem(generateProblem(diff, options.allowRemainder, options.zeroFocus));
    setMode('level');
  };

  const startAuto = () => {
    setProblem(generateProblem(adaptive.level, AUTO_OPTIONS.allowRemainder, AUTO_OPTIONS.zeroFocus));
    setMode('auto');
  };

  const activeDiff = mode === 'auto' ? adaptive.level : settings?.diff ?? '2-1';
  const activeOptions = mode === 'auto' ? AUTO_OPTIONS : settings?.options ?? AUTO_OPTIONS;

  const handleFinish = (results: { isPerfect: boolean; dividend: number; divisor: number }) => {
    recordResult({
      moduleId: 'hissan',
      skillId: `hissan-${activeDiff}`,
      label: `${results.dividend} ÷ ${results.divisor}`,
      correct: results.isPerfect,
    });
    if (mode === 'auto') adaptive.onResult(results.isPerfect);
  };

  const handleNext = () => {
    // おまかせモードは（レベルアップしていれば）新しいレベルで次の問題を出す
    const diff = mode === 'auto' ? adaptive.level : activeDiff;
    const opts = mode === 'auto' ? AUTO_OPTIONS : activeOptions;
    setProblem(generateProblem(diff, opts.allowRemainder, opts.zeroFocus));
  };

  if (mode === 'setup' || !problem) {
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <button onClick={onExit} className="flex items-center gap-2 text-muted hover:text-content font-bold px-3 py-2 rounded-xl hover:bg-surface-3 transition-colors mb-2">
            <ChevronLeft size={24} /> わり算ランドへ
          </button>
          <h1 className="text-3xl font-black text-content text-center mb-1">筆算シミュレーター</h1>
          <p className="text-muted text-center font-medium mb-4">たてる → かける → ひく → おろす</p>
          <div className="max-w-2xl mx-auto mb-2">
            <button
              onClick={startAuto}
              className="w-full p-5 rounded-3xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-black text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Wand2 size={22} /> おまかせモード（じどうで レベルアップ）
            </button>
          </div>
          <ProblemSelector
            onStart={handleStart}
            stats={todayStats}
            initialDifficulty={settings?.diff}
            initialOptions={settings?.options}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {mode === 'auto' && (
        <AdaptiveBar index={adaptive.index} total={adaptive.total} leveledUp={adaptive.leveledUp} onClearLevelUp={adaptive.clearLevelUp} />
      )}
      <div className="flex-1 min-h-0">
        <DivisionSimulator
          key={`${problem.dividend}-${problem.divisor}-${activeDiff}`}
          problem={problem}
          onBack={() => setMode('setup')}
          onFinish={handleFinish}
          onNext={handleNext}
          isMasterMode={activeOptions.masterMode}
          zeroShortcut={activeOptions.zeroShortcut}
        />
      </div>
    </div>
  );
};
