/**
 * 候補の中から あてはまるものを 複数選ぶ共通パーツ（個数は問題ごとに異なる）。
 * 倍数・約数・公倍数・公約数を「候補から ぜんぶ えらぶ」形式の問題で使う。
 * 選択状態は保持したまま再チェックできるので、まちがえても やり直しやすい。
 */
import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface Props {
  choices: string[];
  onSubmit: (selected: number[]) => void;
  accentBg?: string;
  accentBorder?: string;
  submitLabel?: string;
  wrongFlash?: boolean;
}

export const MultiPick: React.FC<Props> = ({
  choices,
  onSubmit,
  accentBg = 'bg-emerald-500 border-emerald-500',
  accentBorder = 'hover:border-emerald-400',
  submitLabel = 'これで こたえる',
  wrongFlash = false,
}) => {
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (i: number) => {
    setSelected((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  return (
    <div>
      <div className={`grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-4 ${wrongFlash ? 'animate-pulse' : ''}`}>
        {choices.map((c, i) => {
          const on = selected.includes(i);
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={`relative py-4 rounded-2xl border-2 text-lg font-black tabular-nums transition-all active:scale-[0.96] flex items-center justify-center ${
                on ? `${accentBg} text-white shadow-lg` : `bg-surface border-line text-content ${accentBorder}`
              }`}
            >
              {on && <Check size={14} className="absolute top-1.5 right-1.5 opacity-80" />}
              {c}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onSubmit(selected)}
        className={`w-full py-5 rounded-3xl text-xl font-black shadow-lg transition-all active:scale-95 text-white ${accentBg.split(' ')[0]} hover:brightness-110`}
      >
        {submitLabel}（{selected.length}こ えらんだ）
      </button>
    </div>
  );
};
