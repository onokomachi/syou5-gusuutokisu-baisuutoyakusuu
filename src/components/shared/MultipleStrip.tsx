/**
 * 「倍数の帯」— 最小公倍数・公倍数をもとめるときの足場（scaffold）。
 *
 * 2つの数の倍数を、児童がタップして1つずつ出していく。両方に出てきた数は
 * 自動でハイライトされ、「はじめてそろった数＝最小公倍数」が目で見て分かる。
 * これは数直線表現の変形であり、答えだけを暗算で入れてしまうのを防ぎ、
 * 「書き出して共通を探す」という単元の中核手続きを画面上で再現するためのもの。
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye } from 'lucide-react';

interface Props {
  a: number;
  b: number;
  /** ここまでは出せるようにする上限（ふつうは最小公倍数、公倍数の問題ではその倍数まで） */
  upto: number;
}

const Row: React.FC<{ base: number; shown: number; commons: Set<number>; onMore: () => void; color: string }> = ({ base, shown, commons, onMore, color }) => (
  <div className="flex items-center gap-2 min-w-0">
    <span className={`shrink-0 w-16 text-xs font-black ${color}`}>{base}の倍数</span>
    <div className="flex-1 min-w-0 overflow-x-auto">
      <div className="flex items-center gap-1.5 py-1">
        {Array.from({ length: shown }, (_, i) => {
          const v = base * (i + 1);
          const isCommon = commons.has(v);
          return (
            <motion.span
              key={v}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-sm font-black tabular-nums border-2 ${
                isCommon ? 'bg-amber-400 border-amber-500 text-slate-900' : 'bg-surface border-line text-content'
              }`}
            >
              {v}
            </motion.span>
          );
        })}
        <button
          onClick={onMore}
          className="shrink-0 px-3 py-1 rounded-lg text-sm font-black bg-surface-3 text-muted hover:bg-surface-2 active:scale-95 transition-all"
        >
          ＋
        </button>
      </div>
    </div>
  </div>
);

export const MultipleStrip: React.FC<Props> = ({ a, b, upto }) => {
  const [countA, setCountA] = useState(1);
  const [countB, setCountB] = useState(1);

  const listA = Array.from({ length: countA }, (_, i) => a * (i + 1));
  const listB = Array.from({ length: countB }, (_, i) => b * (i + 1));
  const commons = new Set(listA.filter((v) => listB.includes(v)));
  const firstCommon = [...commons].sort((x, y) => x - y)[0];

  // 出しすぎて画面が長くなりすぎないよう、上限の少し先までに制限する
  const maxA = Math.ceil((upto * 1.5) / a);
  const maxB = Math.ceil((upto * 1.5) / b);

  return (
    <div className="rounded-3xl border-2 border-dashed border-line bg-surface-2 p-4 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-black text-muted mb-1">
        <Eye size={14} /> ＋を おして 倍数を 出していこう
      </div>
      <Row base={a} shown={listA.length} commons={commons} onMore={() => setCountA((c) => Math.min(c + 1, maxA))} color="text-cyan-600" />
      <Row base={b} shown={listB.length} commons={commons} onMore={() => setCountB((c) => Math.min(c + 1, maxB))} color="text-violet-600" />
      {firstCommon !== undefined && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-black text-amber-700 pt-1">
          きいろの {firstCommon} が、はじめて そろった数だね！
        </motion.p>
      )}
    </div>
  );
};
