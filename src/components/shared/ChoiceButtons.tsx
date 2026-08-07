/**
 * 選択肢（2〜4個）から1つ選ぶ共通パーツ。
 * judge（2択の正誤・はい/いいえ）と choice（3〜4択）の両方で使う。
 */
import React from 'react';

interface Props {
  choices: string[];
  onChoose: (index: number) => void;
  pickedWrongIndex?: number | null;
  accentBorder?: string;
  columns?: 1 | 2;
}

export const ChoiceButtons: React.FC<Props> = ({ choices, onChoose, pickedWrongIndex = null, accentBorder = 'hover:border-blue-400', columns = 1 }) => {
  return (
    <div className={`grid grid-cols-1 ${columns === 2 ? 'sm:grid-cols-2' : ''} gap-3`}>
      {choices.map((c, i) => (
        <button
          key={i}
          onClick={() => onChoose(i)}
          className={`p-5 rounded-2xl border-2 text-xl md:text-2xl font-black tabular-nums transition-all active:scale-[0.98] ${
            pickedWrongIndex === i ? 'bg-amber-50 border-amber-300 text-amber-500' : `bg-surface border-line text-content ${accentBorder}`
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
};
