/**
 * 「小さい順に□つ 書きましょう」形式の回答UI。
 *
 * 単元テストで最も頻出する形式であり、選択肢からの再認ではなく
 * 自分で数を生成することを要求する（産出効果）。候補は一切表示しない。
 * 足場（scaffold）が full のときだけ、先頭の何個かをあらかじめ入れておく
 * （補完課題）。hint / none では最初から空にする。
 */
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Keypad } from './Keypad';

interface Props {
  /** 入れる個数が決まっているか（「3つ書きましょう」= true /「ぜんぶ書きましょう」= false） */
  exact: boolean;
  /** exact のときの目標個数 */
  targetCount?: number;
  /** 足場として最初から埋めておく値（順番どおり） */
  prefill?: number[];
  onSubmit: (values: number[]) => void;
  accentBg?: string;
}

export const ListEntry: React.FC<Props> = ({ exact, targetCount, prefill = [], onSubmit, accentBg = 'bg-emerald-500' }) => {
  const [values, setValues] = useState<number[]>(prefill);
  const [input, setInput] = useState('');

  const add = () => {
    if (input === '') return;
    if (exact && targetCount !== undefined && values.length >= targetCount) return;
    setValues([...values, Number(input)]);
    setInput('');
  };

  // 足場で最初から入っている分は消せないようにする（そこが手がかりなので）
  const removeAt = (i: number) => {
    if (i < prefill.length) return;
    setValues(values.filter((_, idx) => idx !== i));
  };

  const canSubmit = exact && targetCount !== undefined ? values.length === targetCount : values.length >= 1;

  return (
    <div className="flex flex-col gap-4">
      {/* 書き出したものの一覧 */}
      <div className="min-h-20 rounded-2xl bg-surface-2 border-2 border-line p-3 flex flex-wrap items-center gap-2">
        {values.length === 0 && <span className="text-faint font-bold px-2">ここに 書き出していこう</span>}
        {values.map((v, i) => {
          const locked = i < prefill.length;
          return (
            <button
              key={`${i}-${v}`}
              onClick={() => removeAt(i)}
              disabled={locked}
              className={`relative px-4 py-2 rounded-xl text-2xl font-black tabular-nums transition-all ${
                locked ? 'bg-surface-3 text-muted cursor-default' : 'bg-surface border-2 border-line text-content hover:border-rose-300 active:scale-95'
              }`}
            >
              {v}
              {!locked && <X size={12} className="absolute top-1 right-1 opacity-40" />}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-black text-muted">
          {exact && targetCount !== undefined ? `${values.length} / ${targetCount} こ` : `${values.length} こ 書いた`}
        </span>
        <span className="text-xs font-bold text-faint">小さい順に 入れてね</span>
      </div>

      {/* 入力中の数 */}
      <div className="h-16 rounded-2xl bg-surface-2 border-2 border-line flex items-center justify-center">
        <span className="text-4xl font-black tabular-nums text-content">
          {input || <span className="text-faint">？</span>}
        </span>
      </div>

      <Keypad
        onInput={(d) => { if (input.length < 5) setInput(input + d); }}
        onBackspace={() => setInput(input.slice(0, -1))}
        onSubmit={add}
        submitLabel="＋ 追加する"
        submitEnabled={input !== '' && !(exact && targetCount !== undefined && values.length >= targetCount)}
      />

      <button
        onClick={() => canSubmit && onSubmit(values)}
        disabled={!canSubmit}
        className={`w-full py-5 rounded-3xl text-xl font-black shadow-lg transition-all active:scale-95 ${
          canSubmit ? `${accentBg} text-white hover:brightness-110` : 'bg-surface-3 text-faint'
        }`}
      >
        これで こたえる
      </button>
    </div>
  );
};
