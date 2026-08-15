/**
 * 多段階の回答UI（「①何をもとめる問題か → ②1辺は何cmか → ③何まいか」）。
 *
 * しきつめ・切り分けのようなテスト裏面の問題は、値を1つ答えて終わりではなく
 * 「立式の判断 → 計算 → 単位つきの答え」という段階を踏む。1つの入力欄に
 * 最終値だけ入れさせると、この判断の過程が評価も指導もされないまま飛ばされてしまう。
 * 1段ごとに理由（explain）を示してから次へ進める。
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, ChevronRight } from 'lucide-react';
import { ProblemStep } from '../../lib/problems';
import { ChoiceButtons } from './ChoiceButtons';
import { AnswerEntry } from './AnswerEntry';
import { HintBox } from '../ui/primitives';
import { playCorrect, playSoftTry } from '../../lib/sound';

interface Props {
  steps: ProblemStep[];
  accentBorder?: string;
  accentButton?: string;
  /** 1段ごとの誤答も含めた「ノーミスだったか」を返して完了 */
  onDone: (perfect: boolean) => void;
}

export const StepAnswer: React.FC<Props> = ({ steps, accentBorder = 'hover:border-blue-400', accentButton = 'bg-blue-500 hover:bg-blue-600', onDone }) => {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'answer' | 'reveal'>('answer');
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [pickedWrong, setPickedWrong] = useState<number | null>(null);

  const step = steps[index];
  const isLast = index === steps.length - 1;

  const correct = () => {
    playCorrect();
    setHint(null);
    setPickedWrong(null);
    setPhase('reveal');
  };

  const wrong = () => {
    playSoftTry();
    setMistakes((m) => m + 1);
    setHint(step.hint);
  };

  const next = () => {
    if (isLast) { onDone(mistakes === 0); return; }
    setIndex((i) => i + 1);
    setPhase('answer');
  };

  return (
    <div className="space-y-4">
      {/* 進行状況 */}
      <div className="flex items-center gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < index ? 'bg-emerald-400' : i === index ? 'bg-brand' : 'bg-surface-3'}`}
          />
        ))}
        <span className="text-xs font-black text-faint shrink-0 ml-1">{index + 1}/{steps.length}</span>
      </div>

      <div className="bg-surface-2 border border-line rounded-3xl p-5">
        <p className="text-base md:text-lg font-black text-content leading-relaxed">
          <span className="text-brand mr-1">{'①②③④⑤'[index] ?? `${index + 1}.`}</span>
          {step.prompt}
        </p>
      </div>

      {hint && <HintBox tone="wrong">{hint}</HintBox>}

      {phase === 'answer' && step.kind === 'choice' && (
        <ChoiceButtons
          choices={step.choices ?? []}
          onChoose={(i) => { if (i === step.answerIndex) correct(); else { setPickedWrong(i); wrong(); } }}
          pickedWrongIndex={pickedWrong}
          accentBorder={accentBorder}
          columns={1}
        />
      )}

      {phase === 'answer' && step.kind === 'numeric' && (
        <AnswerEntry
          key={index}
          onSubmit={(v) => { if (Number(v) === step.answerValue) correct(); else wrong(); }}
          allowDecimal={false}
          submitLabel={step.unit ? `こたえる（${step.unit}）` : 'こたえる'}
        />
      )}

      {phase === 'reveal' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-2.5 mb-3">
            <span className="shrink-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check size={18} /></span>
            <p className="text-content font-bold leading-relaxed flex-1">{step.explain}</p>
          </div>
          <button
            onClick={next}
            className={`w-full py-4 rounded-2xl text-lg font-black text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 ${accentButton}`}
          >
            {isLast ? 'こたえあわせ' : 'つぎへ'} <ChevronRight size={20} />
          </button>
        </motion.div>
      )}
    </div>
  );
};
