/**
 * レベル選択＋おまかせモード＋出題ラウンドの共通実装。
 * 「偶数・奇数」「倍数・約数」系の6モジュールは、すべて同じ Problem 型で出題できるため、
 * この1つの実装を使い回す。本番テスト・ボス戦からも GenericRound をそのまま再利用する。
 *
 * ここが担う中核は3つ：
 *  1. 回答形式（judge/choice/multi/numeric/list/pairs/venn/steps/sequence）のディスパッチ
 *  2. 足場（倍数の帯・書き出し欄の一部記入）の 習熟度連動フェーディング
 *  3. 誤答特異的フィードバック（最大公約数と最小公倍数の取り違え 等）
 */
import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Wand2, Eye, EyeOff } from 'lucide-react';
import { AppShell } from './AppShell';
import { AdaptiveBar } from './AdaptiveBar';
import { AnswerEntry } from './AnswerEntry';
import { ChoiceButtons } from './ChoiceButtons';
import { MultiPick } from './MultiPick';
import { ListEntry } from './ListEntry';
import { MultipleStrip } from './MultipleStrip';
import { DivisorPairGrid } from './DivisorPairGrid';
import { VennSort } from './VennSort';
import { StepAnswer } from './StepAnswer';
import { SequenceSort } from './SequenceSort';
import { HintBox, ResultPanel, SetupScreen, LevelCard } from '../ui/primitives';
import { Problem, ScaffoldMode, scaffoldFromStreak } from '../../lib/problems';
import { useProgressStore, ModuleId } from '../../store/progressStore';
import { useAdaptive } from '../../lib/useAdaptive';
import { playClear, playSoftTry } from '../../lib/sound';

export interface LevelDescriptor<L extends string> { id: L; label: string; desc: string; }

export interface Accent {
  /** ボタン枠のホバー色（例: 'hover:border-blue-400'） */
  border: string;
  /** 複数選択の選択中の背景色（例: 'bg-blue-500 border-blue-500'） */
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

function sameOrder(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** 書き出し形式の誤答に、何がどう足りないかを具体的に伝える。 */
function listFeedback(given: number[], answers: number[], kind: Problem['listKind']): string {
  if (arraysEqualAsSets(given, answers) && !sameOrder(given, answers)) {
    return '数は ぜんぶ 合っているよ！ でも 小さい順に なっていないみたい。ならべかえて もう一度。';
  }
  const missing = answers.filter((v) => !given.includes(v));
  const extra = given.filter((v) => !answers.includes(v));
  const hit = answers.filter((v) => given.includes(v)).length;

  if (kind === 'divisors') {
    if (missing.includes(1) && missing.includes(answers[answers.length - 1])) {
      return `おしい！ 1と その数自身も 約数だよ。わすれずに 入れよう。（${answers.length}こ中 ${hit}こ 合っているよ）`;
    }
    if (missing.includes(1)) return `おしい！ 1も 約数だよ（どんな数も 1で わりきれる）。（${answers.length}こ中 ${hit}こ 合っているよ）`;
    if (missing.includes(answers[answers.length - 1])) return `おしい！ その数自身も 約数だよ。（${answers.length}こ中 ${hit}こ 合っているよ）`;
  }
  if (extra.length > 0) {
    return `${extra[0]} は ちがうみたい。もう一度 たしかめよう。（${answers.length}こ中 ${hit}こ 合っているよ）`;
  }
  return `${answers.length}こ中 ${hit}こ 合っているよ。あと ${missing.length}こ さがそう。`;
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
  /** 本番テスト・ボス戦では 'none' に固定する。未指定なら習熟度から自動で決まる。 */
  scaffold?: ScaffoldMode;
}> = ({ level, problem: given, moduleId, generate, accent, onNext, onResult, nextLabel, scaffold }) => {
  const [problem] = useState<Problem>(() => given ?? generate(level));
  const [stage, setStage] = useState<'answer' | 'done'>('answer');
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [pickedWrong, setPickedWrong] = useState<number | null>(null);
  const recordResult = useProgressStore((s) => s.recordResult);
  const streak = useProgressStore((s) => s.getMasteryStreak(level));

  // 足場は「連続ノーミス0〜2＝常時表示／3〜4＝ヒントで任意表示／5＝なし」と自動で外れる。
  // 熟達者に足場を出しつづけると かえって邪魔になる（熟達度反転効果）ため。
  const mode: ScaffoldMode = scaffold ?? scaffoldFromStreak(streak);
  const [stripOpen, setStripOpen] = useState(false);
  const showStrip = !!problem.strip && (mode === 'full' || (mode === 'hint' && stripOpen));

  const finish = () => {
    playClear();
    confetti({ particleCount: 110, spread: 65, origin: { y: 0.6 } });
    recordResult({ moduleId, skillId: level, label: problem.label, correct: mistakes === 0 });
    onResult?.(mistakes === 0);
    setStage('done');
  };

  const wrong = (message?: string) => {
    playSoftTry();
    setMistakes((m) => m + 1);
    setHint(message ?? problem.hint);
  };

  /** 入力値がよくある誤答なら、その誤りに特化した説明を返す。 */
  const misconceptionFor = (value: number): string | undefined =>
    problem.misconceptions?.find((m) => m.value === value)?.message;

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
    const n = Number(v);
    if (n === problem.answerValue) finish();
    else wrong(misconceptionFor(n));
  };

  const submitList = (values: number[]) => {
    const answers = problem.listAnswers ?? [];
    if (sameOrder(values, answers)) finish();
    else wrong(listFeedback(values, answers, problem.listKind));
  };

  const submitVenn = (placed: { left: number[]; both: number[]; right: number[] }) => {
    const ok =
      arraysEqualAsSets(placed.left, problem.vennLeftOnly ?? []) &&
      arraysEqualAsSets(placed.both, problem.vennBoth ?? []) &&
      arraysEqualAsSets(placed.right, problem.vennRightOnly ?? []);
    if (ok) finish();
    else wrong(`まん中には「両方の約数になっている数」だけを 入れよう。（${problem.hint}）`);
  };

  const submitSequence = (orderedIndices: number[]) => {
    if (orderedIndices.every((v, i) => v === i)) finish();
    else wrong('じゅんばんが ちがうみたい。「どんな形で書けるか」から はじめて、「だから○○」で おわるよ。');
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

        {/* 足場：倍数の帯（習熟度に応じて 常時 / ボタン / なし） */}
        {stage === 'answer' && problem.strip && mode === 'hint' && !stripOpen && (
          <button
            onClick={() => setStripOpen(true)}
            className="w-full py-3 rounded-2xl font-black text-muted bg-surface-2 border-2 border-dashed border-line hover:bg-surface-3 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Eye size={18} /> 倍数を 書き出して たしかめる
          </button>
        )}
        {stage === 'answer' && showStrip && (
          <div className="space-y-2">
            <MultipleStrip a={problem.strip!.a} b={problem.strip!.b} upto={problem.strip!.upto} />
            {mode === 'hint' && (
              <button
                onClick={() => setStripOpen(false)}
                className="w-full py-2 rounded-xl text-sm font-bold text-faint hover:bg-surface-2 transition-all flex items-center justify-center gap-1.5"
              >
                <EyeOff size={14} /> とじる
              </button>
            )}
          </div>
        )}

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
          <AnswerEntry
            onSubmit={submitNumeric}
            allowDecimal={false}
            accentText="text-content"
            submitLabel={problem.answerUnit ? `こたえる（${problem.answerUnit}）` : 'こたえる'}
          />
        )}
        {stage === 'answer' && problem.kind === 'list' && (
          <ListEntry
            exact={!!problem.listExact}
            targetCount={problem.listAnswers?.length}
            prefill={mode === 'full' ? (problem.listAnswers ?? []).slice(0, problem.listPrefill ?? 0) : []}
            onSubmit={submitList}
            accentBg={accent.bg.split(' ')[0]}
          />
        )}
        {stage === 'answer' && problem.kind === 'pairs' && (
          <DivisorPairGrid target={problem.pairTarget ?? 12} onSubmit={() => finish()} accentBg={accent.bg.split(' ')[0]} />
        )}
        {stage === 'answer' && problem.kind === 'venn' && (
          <VennSort
            chips={problem.vennChips ?? []}
            leftLabel={problem.vennLeftLabel ?? ''}
            rightLabel={problem.vennRightLabel ?? ''}
            onSubmit={submitVenn}
            accentBg={accent.bg.split(' ')[0]}
          />
        )}
        {stage === 'answer' && problem.kind === 'steps' && (
          <StepAnswer
            steps={problem.steps ?? []}
            accentBorder={accent.border}
            accentButton={accent.button}
            onDone={(perfect) => { if (!perfect) setMistakes((m) => m + 1); finish(); }}
          />
        )}
        {stage === 'answer' && problem.kind === 'sequence' && (
          <SequenceSort items={problem.sequenceItems ?? []} onSubmit={submitSequence} accentBg={accent.bg.split(' ')[0]} />
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
