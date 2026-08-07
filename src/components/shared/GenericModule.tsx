/**
 * レベル選択＋おまかせモード＋出題ラウンドの共通実装。
 * 「偶数・奇数」「倍数・約数」系の6モジュールは、すべて同じ Problem 型
 * （judge / choice / multi / numeric）で出題できるため、この1つの実装を使い回す。
 * 本番テストモードからも GenericRound をそのまま再利用する。
 */
import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Wand2 } from 'lucide-react';
import { AppShell } from './AppShell';
import { AdaptiveBar } from './AdaptiveBar';
import { AnswerEntry } from './AnswerEntry';
import { ChoiceButtons } from './ChoiceButtons';
import { MultiPick } from './MultiPick';
import { HintBox, ResultPanel, SetupScreen, LevelCard } from '../ui/primitives';
import { Problem } from '../../lib/problems';
import { useProgressStore, ModuleId } from '../../store/progressStore';
import { useAdaptive } from '../../lib/useAdaptive';
import { playClear, playSoftTry } from '../../lib/sound';

export interface LevelDescriptor<L extends string> { id: L; label: string; desc: string; }

export interface Accent {
  /** ボタン枠のホバー色（例: 'hover:border-blue-400'） */
  border: string;
  /** MultiPick の選択中の背景色（例: 'bg-blue-500 border-blue-500'） */
  bg: string;
  /** ResultPanel の「つぎへ」ボタン色（例: 'bg-blue-500 hover:bg-blue-600'） */
  button: string;
}

export function arraysEqualAsSets(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

export const GenericRound: React.FC<{
  level: string;
  problem?: Problem;
  moduleId: ModuleId;
  generate: (level: string) => Problem;
  accent: Accent;
  onNext: () => void;
  onResult?: (perfect: boolean) => void;
  nextLabel?: string;
}> = ({ level, problem: given, moduleId, generate, accent, onNext, onResult, nextLabel }) => {
  const [problem] = useState<Problem>(() => given ?? generate(level));
  const [stage, setStage] = useState<'answer' | 'done'>('answer');
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [pickedWrong, setPickedWrong] = useState<number | null>(null);
  const recordResult = useProgressStore((s) => s.recordResult);

  const finish = () => {
    playClear();
    confetti({ particleCount: 110, spread: 65, origin: { y: 0.6 } });
    recordResult({ moduleId, skillId: level, label: problem.label, correct: mistakes === 0 });
    onResult?.(mistakes === 0);
    setStage('done');
  };

  const wrong = () => {
    playSoftTry();
    setMistakes((m) => m + 1);
    setHint(problem.hint);
  };

  const submitJudge = (chooseFirst: boolean) => {
    if (chooseFirst === !!problem.judgeAnswer) finish();
    else { setPickedWrong(chooseFirst ? 0 : 1); wrong(); }
  };

  const submitChoice = (i: number) => {
    if (i === problem.answerIndex) finish();
    else { setPickedWrong(i); wrong(); }
  };

  const submitMulti = (selected: number[]) => {
    if (arraysEqualAsSets(selected, problem.answerIndices ?? [])) finish();
    else wrong();
  };

  const submitNumeric = (v: string) => {
    if (Number(v) === problem.answerValue) finish();
    else wrong();
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-xl mx-auto space-y-5">
        <div className="bg-surface border border-line rounded-[28px] shadow-xl p-6 md:p-8 text-center">
          {problem.display && (
            <div className="text-4xl md:text-5xl font-black text-content tabular-nums tracking-wide mb-3">{problem.display}</div>
          )}
          <p className="text-lg md:text-xl font-black text-content leading-relaxed">{problem.prompt}</p>
        </div>

        {hint && <HintBox tone="wrong">{hint}</HintBox>}

        {stage === 'answer' && problem.kind === 'judge' && (
          <ChoiceButtons
            choices={problem.judgeLabels as string[]}
            onChoose={(i) => submitJudge(i === 0)}
            pickedWrongIndex={pickedWrong}
            accentBorder={accent.border}
            columns={2}
          />
        )}
        {stage === 'answer' && problem.kind === 'choice' && (
          <ChoiceButtons choices={problem.choices ?? []} onChoose={submitChoice} pickedWrongIndex={pickedWrong} accentBorder={accent.border} columns={1} />
        )}
        {stage === 'answer' && problem.kind === 'multi' && (
          <MultiPick choices={problem.choices ?? []} onSubmit={submitMulti} accentBg={accent.bg} accentBorder={accent.border} />
        )}
        {stage === 'answer' && problem.kind === 'numeric' && (
          <AnswerEntry onSubmit={submitNumeric} allowDecimal={false} accentText="text-content" />
        )}

        {stage === 'done' && (
          <ResultPanel
            perfect={mistakes === 0}
            detail={<span>{problem.explain}</span>}
            onNext={onNext}
            nextLabel={nextLabel}
            accentClass={accent.button}
          />
        )}
      </div>
    </div>
  );
};

export function createLevelModule<L extends string>(config: {
  moduleId: ModuleId;
  title: string;
  subtitle: string;
  levels: LevelDescriptor<L>[];
  generate: (level: L) => Problem;
  accent: Accent;
}): React.FC<{ onExit: () => void }> {
  const { moduleId, title, subtitle, levels, generate, accent } = config;
  const levelIds = levels.map((l) => l.id);

  const Module: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    const [mode, setMode] = useState<'setup' | 'level' | 'auto'>('setup');
    const [level, setLevel] = useState<L>(levelIds[0]);
    const [round, setRound] = useState(0);
    const getMasteryStreak = useProgressStore((s) => s.getMasteryStreak);
    const getTodaySkillCount = useProgressStore((s) => s.getTodaySkillCount);
    const adaptive = useAdaptive<L>(levelIds, moduleId);

    if (mode === 'setup') {
      return (
        <SetupScreen title={title} subtitle={subtitle} onBack={onExit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {levels.map((l) => (
              <LevelCard
                key={l.id}
                label={l.label}
                desc={l.desc}
                mastery={getMasteryStreak(l.id)}
                todayCount={getTodaySkillCount(l.id)}
                accentBorder={accent.border}
                onClick={() => { setLevel(l.id); setRound((r) => r + 1); setMode('level'); }}
              />
            ))}
          </div>
          <button
            onClick={() => { setRound((r) => r + 1); setMode('auto'); }}
            className="w-full p-5 rounded-3xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-black text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Wand2 size={22} /> おまかせモード（じどうで レベルアップ）
          </button>
        </SetupScreen>
      );
    }

    const activeLevel = mode === 'auto' ? adaptive.level : level;

    return (
      <AppShell title={title} subtitle={levels.find((l) => l.id === activeLevel)?.label} onBack={() => setMode('setup')}>
        <div className="flex flex-col h-full">
          {mode === 'auto' && (
            <AdaptiveBar index={adaptive.index} total={adaptive.total} leveledUp={adaptive.leveledUp} onClearLevelUp={adaptive.clearLevelUp} />
          )}
          <div className="flex-1 min-h-0">
            <GenericRound
              key={`${activeLevel}-${round}`}
              level={activeLevel}
              moduleId={moduleId}
              generate={generate as (level: string) => Problem}
              accent={accent}
              onNext={() => setRound((r) => r + 1)}
              onResult={mode === 'auto' ? adaptive.onResult : undefined}
            />
          </div>
        </div>
      </AppShell>
    );
  };

  return Module;
}
