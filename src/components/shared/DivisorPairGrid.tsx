/**
 * 約数の「ペア探索」UI。
 *
 * 1×N、2×？、3×？… と左の数を1から順に提示し、相手の数を入れさせる。
 * わりきれない行は「わりきれない」を選ぶ。相手が左の数以下になったら探索終了で、
 * 「どこまで調べればよいか」という停止条件も体験できる。
 * 約数の見落としを防ぐ核心技能を、ヒント文ではなく手続きそのものとして指導する。
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Ban } from 'lucide-react';
import { Keypad } from './Keypad';

interface Props {
  target: number;
  onSubmit: (allCorrect: boolean) => void;
  accentBg?: string;
}

interface RowState { left: number; answer: number | null; /** null = わりきれない */ }

export const DivisorPairGrid: React.FC<Props> = ({ target, onSubmit, accentBg = 'bg-emerald-500' }) => {
  // 左の数は 1 から √N まで。ここまで調べれば すべての約数がペアで見つかる。
  const lastLeft = Math.floor(Math.sqrt(target));
  const [rows, setRows] = useState<RowState[]>([]);
  const [input, setInput] = useState('');
  const [wrongFlash, setWrongFlash] = useState(false);

  const currentLeft = rows.length + 1;
  const done = rows.length >= lastLeft;

  const flashWrong = () => {
    setWrongFlash(true);
    setTimeout(() => setWrongFlash(false), 400);
  };

  const submitNumber = () => {
    if (input === '') return;
    const v = Number(input);
    if (target % currentLeft !== 0 || currentLeft * v !== target) {
      flashWrong();
      setInput('');
      return;
    }
    setRows([...rows, { left: currentLeft, answer: v }]);
    setInput('');
  };

  const submitNotDivisible = () => {
    if (target % currentLeft === 0) {
      flashWrong();
      return;
    }
    setRows([...rows, { left: currentLeft, answer: null }]);
    setInput('');
  };

  const found: number[] = [];
  rows.forEach((r) => { if (r.answer !== null) found.push(r.left, r.answer); });
  const uniqueFound = Array.from(new Set(found)).sort((x, y) => x - y);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-surface-2 border-2 border-line p-3 space-y-1.5">
        {rows.map((r) => (
          <motion.div
            key={r.left}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-xl font-black tabular-nums text-content"
          >
            <span className="w-8 text-right">{r.left}</span>
            <span className="text-muted">×</span>
            {r.answer !== null ? (
              <>
                <span className="w-12 text-center px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700">{r.answer}</span>
                <span className="text-muted">＝ {target}</span>
                <Check size={18} className="text-emerald-500" />
              </>
            ) : (
              <span className="text-sm font-bold text-faint">…では わりきれない</span>
            )}
          </motion.div>
        ))}

        {!done && (
          <div className={`flex items-center gap-2 text-xl font-black tabular-nums ${wrongFlash ? 'animate-pulse' : ''}`}>
            <span className="w-8 text-right text-content">{currentLeft}</span>
            <span className="text-muted">×</span>
            <span className={`w-12 text-center px-2 py-0.5 rounded-lg border-2 ${wrongFlash ? 'border-rose-400 bg-rose-50 text-rose-500' : 'border-brand bg-surface text-content'}`}>
              {input || '？'}
            </span>
            <span className="text-muted">＝ {target}</span>
          </div>
        )}

        {done && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-black text-emerald-700 pt-2">
            {currentLeft} × {currentLeft} は {target} をこえるので、ここで おしまい！<br />
            見つかった約数：{uniqueFound.join('、 ')}（{uniqueFound.length}こ）
          </motion.p>
        )}
      </div>

      {!done && (
        <>
          <Keypad
            onInput={(d) => { if (input.length < 4) setInput(input + d); }}
            onBackspace={() => setInput(input.slice(0, -1))}
            onSubmit={submitNumber}
            submitLabel="この数で ペアにする"
            submitEnabled={input !== ''}
          />
          <button
            onClick={submitNotDivisible}
            className="w-full py-3 rounded-2xl font-black text-muted bg-surface-2 border-2 border-line hover:bg-surface-3 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Ban size={18} /> {currentLeft}では わりきれない
          </button>
        </>
      )}

      {done && (
        <button
          onClick={() => onSubmit(true)}
          className={`w-full py-5 rounded-3xl text-xl font-black shadow-lg transition-all active:scale-95 text-white ${accentBg} hover:brightness-110`}
        >
          ぜんぶ 見つけた！
        </button>
      )}
    </div>
  );
};
