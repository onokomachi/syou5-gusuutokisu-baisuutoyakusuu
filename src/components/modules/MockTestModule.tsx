/**
 * 本番テストモード。単元テストと同じ大問順・同じ問題数で通しで解く。
 * 開始前に 表だけ / 裏だけ / 表＋裏（ぜんぶ）の範囲を選べる。
 * GenericRound を「1問だけ出す」形で再利用し、ノーミス完答（一発正解）を採点する。
 * 表=知識技能100点 / 裏=思考判断表現50点。結果は学習のきろくに詳細つきで残す。
 */
import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ClipboardCheck, Home, RotateCcw, Trophy } from 'lucide-react';
import { TEST_STEPS, TestStep, OMOTE_MAX, URA_MAX, TOTAL_MAX } from '../../lib/testConfig';
import { describeProblem, Problem } from '../../lib/problems';
import { useProgressStore, TestDetail } from '../../store/progressStore';
import { GenericRound } from '../shared/GenericModule';

interface Props { onExit: () => void; }

type Phase = 'INTRO' | 'RUN' | 'RESULT';
type Mode = '表' | '裏' | 'ぜんぶ';

const stepsForMode = (mode: Mode): TestStep[] => {
  if (mode === '表') return TEST_STEPS.filter((s) => s.section === '表');
  if (mode === '裏') return TEST_STEPS.filter((s) => s.section === '裏');
  return TEST_STEPS;
};

const ACCENT = { border: 'hover:border-blue-400', bg: 'bg-blue-500 border-blue-500', button: 'bg-blue-500 hover:bg-blue-600' };

export const MockTestModule: React.FC<Props> = ({ onExit }) => {
  const [phase, setPhase] = useState<Phase>('INTRO');
  const [mode, setMode] = useState<Mode>('ぜんぶ');
  const [seed, setSeed] = useState(0); // 「もう一度」で問題を作り直す
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<number, boolean>>({}); // index -> ノーミス
  const recordResult = useProgressStore((s) => s.recordResult);
  const [recorded, setRecorded] = useState(false);

  const activeSteps = useMemo<TestStep[]>(() => stepsForMode(mode), [mode]);
  const problems = useMemo<Problem[]>(() => activeSteps.map((s) => s.gen()), [activeSteps, seed]);

  const choose = (m: Mode) => {
    setMode(m);
    setIndex(0);
    setResults({});
    setRecorded(false);
    setPhase('RUN');
  };
  const restart = () => {
    setSeed((s) => s + 1);
    setIndex(0);
    setResults({});
    setRecorded(false);
    setPhase('RUN');
  };

  const onResult = (perfect: boolean) => {
    setResults((r) => (index in r ? r : { ...r, [index]: perfect }));
  };

  const advance = () => {
    if (index < activeSteps.length - 1) setIndex((i) => i + 1);
    else setPhase('RESULT');
  };

  const earnedAt = (i: number) => (results[i] ? activeSteps[i].points : 0);
  const omoteMax = activeSteps.filter((s) => s.section === '表').reduce((a, s) => a + s.points, 0);
  const uraMax = activeSteps.filter((s) => s.section === '裏').reduce((a, s) => a + s.points, 0);
  const totalMax = omoteMax + uraMax;
  const omoteScore = activeSteps.reduce((a, s, i) => a + (s.section === '表' ? earnedAt(i) : 0), 0);
  const uraScore = activeSteps.reduce((a, s, i) => a + (s.section === '裏' ? earnedAt(i) : 0), 0);
  const totalScore = omoteScore + uraScore;

  if (phase === 'RESULT' && !recorded) {
    const detail: TestDetail = {
      mode,
      omoteScore, omoteMax, uraScore, uraMax,
      total: totalScore, totalMax,
      steps: activeSteps.map((s, i) => {
        const d = describeProblem(problems[i]);
        return { daimon: s.daimon, sub: s.sub, title: s.title, section: s.section, q: d.q, a: d.a, points: s.points, earned: earnedAt(i), correct: !!results[i] };
      }),
    };
    recordResult({ moduleId: 'mock-test', skillId: 'mock-test', label: `本番テスト（${mode}）${totalScore}/${totalMax}点`, correct: totalScore === totalMax, detail });
    setRecorded(true);
  }

  /* ---------------- INTRO ---------------- */
  if (phase === 'INTRO') {
    const RangeButton: React.FC<{ m: Mode; title: string; sub: string; max: number; color: string }> = ({ m, title, sub, max, color }) => (
      <button onClick={() => choose(m)} className={`flex-1 min-w-[8rem] rounded-2xl border-2 ${color} p-5 text-left transition-all active:scale-95 hover:shadow-lg`}>
        <div className="text-xl font-black text-content">{title}</div>
        <div className="text-sm font-bold text-muted mt-0.5">{sub}</div>
        <div className="text-2xl font-black tabular-nums mt-2">{max}<span className="text-base text-muted">点</span></div>
      </button>
    );
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button onClick={onExit} className="flex items-center gap-2 text-muted hover:text-content font-bold px-3 py-2 rounded-xl hover:bg-surface-3 transition-colors mb-2">
            <ChevronLeft size={24} /> ホームへ
          </button>
          <div className="bg-surface rounded-[36px] shadow-2xl border border-line p-8 md:p-12 text-center mt-4">
            <div className="w-24 h-24 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-6"><ClipboardCheck size={44} /></div>
            <h1 className="text-3xl font-black text-content mb-2">本番テストモード</h1>
            <p className="text-muted font-bold leading-relaxed mb-2">「偶数と奇数」「倍数と約数」の テストに ちょうせん！</p>
            <p className="text-faint font-bold text-sm mb-6">どこに ちょうせんする？ 範囲を えらんでね。一発で 正解できると 点が もらえるよ。</p>
            <div className="flex flex-wrap gap-3">
              <RangeButton m="表" title="表だけ" sub="知識・ぎのう" max={OMOTE_MAX} color="border-blue-300 hover:border-blue-400 bg-blue-50/40" />
              <RangeButton m="裏" title="裏だけ" sub="考える力" max={URA_MAX} color="border-rose-300 hover:border-rose-400 bg-rose-50/40" />
              <RangeButton m="ぜんぶ" title="表＋裏" sub="ぜんぶ通し" max={TOTAL_MAX} color="border-amber-300 hover:border-amber-400 bg-amber-50/40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- RESULT ---------------- */
  if (phase === 'RESULT') {
    const omoteSteps = activeSteps.map((s, i) => ({ s, i })).filter((x) => x.s.section === '表');
    const uraSteps = activeSteps.map((s, i) => ({ s, i })).filter((x) => x.s.section === '裏');
    const Row: React.FC<{ s: TestStep; i: number }> = ({ s, i }) => {
      const d = describeProblem(problems[i]);
      return (
        <div className="flex items-start justify-between gap-2 py-1.5 border-b border-line/60 last:border-0">
          <div className="min-w-0">
            <span className="font-bold text-content text-sm">大問{s.daimon}{s.sub ?? ''}　{s.title}</span>
            <div className="text-xs text-muted font-bold mt-0.5 truncate">{d.q}　→　<span className="text-content">{d.a}</span></div>
          </div>
          <span className={`font-black tabular-nums shrink-0 ${results[i] ? 'text-emerald-600' : 'text-rose-400'}`}>
            {results[i] ? '○' : '×'} {earnedAt(i)}/{s.points}
          </span>
        </div>
      );
    };
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-surface rounded-[36px] shadow-2xl border border-line p-6 md:p-10 mt-4">
            <div className="text-center mb-6">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 mb-3"><Trophy size={40} /></motion.div>
              <h1 className="text-2xl font-black text-content">テスト けっか（{mode}）</h1>
              <div className="text-5xl font-black text-blue-600 tabular-nums mt-2">{totalScore}<span className="text-2xl text-muted"> / {totalMax}点</span></div>
              <div className="flex justify-center gap-3 mt-3">
                {omoteMax > 0 && <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 font-black text-sm">表 {omoteScore}/{omoteMax}</span>}
                {uraMax > 0 && <span className="px-4 py-1.5 rounded-full bg-rose-50 text-rose-600 font-black text-sm">裏 {uraScore}/{uraMax}</span>}
              </div>
            </div>

            {omoteSteps.length > 0 && (
              <div className="rounded-2xl border border-line p-4 mb-3">
                <p className="text-xs font-black text-blue-600 mb-2">表・知識ぎのう</p>
                {omoteSteps.map(({ s, i }) => <Row key={i} s={s} i={i} />)}
              </div>
            )}
            {uraSteps.length > 0 && (
              <div className="rounded-2xl border border-line p-4 mb-6">
                <p className="text-xs font-black text-rose-500 mb-2">裏・思考はんだん表現</p>
                {uraSteps.map(({ s, i }) => <Row key={i} s={s} i={i} />)}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={restart} className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95">
                <RotateCcw size={20} /> もう一度
              </button>
              <button onClick={() => setPhase('INTRO')} className="flex-1 flex items-center justify-center gap-2 py-4 bg-surface border-2 border-line text-content rounded-2xl font-black text-lg hover:bg-surface-2 transition-all active:scale-95">
                範囲をえらぶ
              </button>
              <button onClick={onExit} className="flex-1 flex items-center justify-center gap-2 py-4 bg-surface border-2 border-line text-content rounded-2xl font-black text-lg hover:bg-surface-2 transition-all active:scale-95">
                <Home size={20} /> ホームへ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- RUN ---------------- */
  const step = activeSteps[index];
  const problem = problems[index];
  const progress = (index / activeSteps.length) * 100;

  const sectionColor = step.section === '表' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-600';

  return (
    <div className="w-full h-full flex flex-col bg-bg">
      <div className="shrink-0 border-b border-line bg-surface/80 backdrop-blur px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={onExit} className="flex items-center gap-1 text-muted hover:text-content font-bold px-2 py-1.5 rounded-lg hover:bg-surface-3 transition-colors shrink-0">
            <ChevronLeft size={20} /> やめる
          </button>
          <span className={`px-3 py-1 rounded-full text-xs font-black shrink-0 ${sectionColor}`}>{step.section}</span>
          <div className="font-black text-content truncate">大問{step.daimon}{step.sub ?? ''}　<span className="text-muted font-bold">{step.title}</span></div>
          <div className="ml-auto text-sm font-black text-muted tabular-nums shrink-0">{index + 1} / {activeSteps.length}問</div>
        </div>
        <div className="max-w-5xl mx-auto mt-2 h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 min-h-0" key={`${mode}-${seed}-${index}`}>
        <GenericRound
          level={step.level}
          problem={problem}
          moduleId={step.moduleId}
          generate={() => problem}
          accent={ACCENT}
          onNext={advance}
          onResult={onResult}
          nextLabel="つぎの もんだいへ"
          scaffold="none"
        />
      </div>
    </div>
  );
};
