/**
 * エラーハンター（誤り例の発見・修正・理由の言語化）モジュール。
 * 「偶数と奇数」「倍数と約数」で最頻出の誤解（0は奇数・1は素数・約数の1と自分自身の抜け・
 * 最大公約数と最小公倍数の混同・倍数の飛ばし・奇数+奇数の勘違い）を
 * 「見つけて → 直して → 理由を選ぶ」3ステップで学ぶ。
 * 誤答例の同定・修正は遅延テストで効果が大きい（Adams 2014; Durkin & Rittle-Johnson 2012）。
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Lightbulb, Search, Check, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppShell } from '../shared/AppShell';
import { AnswerEntry } from '../shared/AnswerEntry';
import { ChoiceButtons } from '../shared/ChoiceButtons';
import { NumError, generateNumError } from '../../lib/problems';
import { useProgressStore } from '../../store/progressStore';
import { playClear, playSoftTry } from '../../lib/sound';

interface Props { onExit: () => void; }

export const ErrorHunterModule: React.FC<Props> = ({ onExit }) => {
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);

  if (!started) {
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button onClick={onExit} className="flex items-center gap-2 text-muted hover:text-content font-bold px-3 py-2 rounded-xl hover:bg-surface-3 transition-colors mb-2">
            <ChevronLeft size={24} /> ホームへ
          </button>
          <div className="bg-surface rounded-[36px] shadow-2xl border border-line p-8 md:p-12 text-center mt-4">
            <div className="w-24 h-24 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-6"><Search size={44} /></div>
            <h1 className="text-3xl font-black text-content mb-2">エラーハンター</h1>
            <p className="text-muted font-bold leading-relaxed mb-8">
              ともだちの 考えを チェック！「正しい？ まちがい？」を 見ぬいて、まちがいは 正しく なおそう。<br />
              よくある かんちがいに 気づけると、理解が ぐっと深まるよ。まちがいは 学びの たからもの！
            </p>
            <button onClick={() => setStarted(true)} className="px-10 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95">スタート！</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell title="エラーハンター" subtitle="まちがい さがし" onBack={onExit}>
      <NumErrorRound key={round} onNext={() => setRound((r) => r + 1)} />
    </AppShell>
  );
};

export const NumErrorRound: React.FC<{
  example?: NumError;
  startStage?: 'judge' | 'fix';
  onNext: () => void;
  onResult?: (perfect: boolean) => void;
  nextLabel?: string;
}> = ({ example, startStage = 'judge', onNext, onResult, nextLabel = 'つぎの もんだいへ' }) => {
  const [ex] = useState<NumError>(() => example ?? generateNumError());
  const [stage, setStage] = useState<'judge' | 'fix' | 'reason' | 'done'>(startStage);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const recordResult = useProgressStore((s) => s.recordResult);

  const finish = () => {
    setStage('done');
    playClear();
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    recordResult({
      moduleId: 'error-hunter',
      skillId: ex.isCorrect ? 'eh-judge' : 'eh-fix',
      label: ex.statement,
      correct: mistakes === 0,
    });
    onResult?.(mistakes === 0);
  };

  const judge = (saysCorrect: boolean) => {
    setHint(null);
    if (saysCorrect === ex.isCorrect) {
      if (ex.isCorrect) finish();
      else setStage('fix');
    } else {
      playSoftTry();
      setMistakes((m) => m + 1);
      setHint(
        ex.isCorrect
          ? 'もう一度 よく見て。ぐ体的な数で たしかめてみよう。'
          : 'もう一度 よく見て。約数・倍数の 意味を 考えなおしてみよう。'
      );
    }
  };

  const submitFixChoice = (i: number) => {
    const gotFirst = i === 0;
    if (gotFirst === !!ex.correctChoiceIsFirst) {
      setHint(null);
      setStage('reason');
    } else {
      playSoftTry();
      setMistakes((m) => m + 1);
      setHint(ex.fixHint);
    }
  };

  const submitFixNumeric = (v: string) => {
    if (Number(v) === ex.correctNumeric) {
      setHint(null);
      setStage('reason');
    } else {
      playSoftTry();
      setMistakes((m) => m + 1);
      setHint(ex.fixHint);
    }
  };

  const chooseReason = (i: number) => {
    if (i === ex.correctReasonIndex) finish();
    else {
      playSoftTry();
      setMistakes((m) => m + 1);
      setHint('うーん、ちがうみたい。もとの文と 正しい答えを くらべて、何を わすれていたか 考えよう。');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-surface rounded-[36px] shadow-2xl border border-line p-6 md:p-10">
          {/* 出題（ともだちの考え） */}
          <div className="bg-surface-2 rounded-3xl p-6 mb-6 border border-line">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-black text-faint">{ex.character}さんの 考え</span>
            </div>
            <p className="text-xl md:text-2xl font-black text-content text-center py-3 leading-relaxed">{ex.statement}</p>
          </div>

          {hint && (
            <div className="mb-4 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-2">
              <Lightbulb className="text-amber-500 shrink-0" size={20} /><p className="text-muted font-bold">{hint}</p>
            </div>
          )}

          {stage === 'judge' && (
            <>
              <p className="text-center text-muted font-bold mb-4">この 考えは…？</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => judge(true)} className="flex items-center gap-2 px-8 py-5 rounded-2xl bg-surface border-2 border-emerald-200 text-emerald-600 font-black text-xl hover:bg-emerald-50 active:scale-95 transition-all"><Check size={28} /> 正しい</button>
                <button onClick={() => judge(false)} className="flex items-center gap-2 px-8 py-5 rounded-2xl bg-surface border-2 border-rose-200 text-rose-500 font-black text-xl hover:bg-rose-50 active:scale-95 transition-all"><X size={28} /> まちがい</button>
              </div>
            </>
          )}

          {stage === 'fix' && ex.fixKind === 'choice2' && (
            <>
              <p className="text-center text-muted font-black mb-4">{ex.fixPrompt}</p>
              <ChoiceButtons choices={ex.choice2Labels ?? []} onChoose={submitFixChoice} accentBorder="hover:border-rose-400" columns={2} />
            </>
          )}

          {stage === 'fix' && ex.fixKind === 'numeric' && (
            <>
              <p className="text-center text-muted font-black mb-4">{ex.fixPrompt}</p>
              <AnswerEntry onSubmit={submitFixNumeric} allowDecimal={false} submitLabel="なおす！" accentText="text-rose-600" />
            </>
          )}

          {stage === 'reason' && (
            <>
              <p className="text-center text-muted font-black mb-4">{ex.character}さんは、なぜ まちがえたのかな？</p>
              <div className="flex flex-col gap-3">
                {ex.reasonOptions.map((r, i) => (
                  <button key={i} onClick={() => chooseReason(i)} className="text-left p-4 rounded-2xl bg-surface border-2 border-line text-content font-bold hover:border-rose-400 active:scale-[0.99] transition-all">{r}</button>
                ))}
              </div>
            </>
          )}

          {stage === 'done' && (
            <div className="text-center">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-6xl mb-3">{mistakes === 0 ? '🏆' : '🎉'}</motion.div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-black px-5 py-3 rounded-2xl">
                {ex.explain}
              </div>
              <div><button onClick={onNext} className="mt-6 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95">{nextLabel}</button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
