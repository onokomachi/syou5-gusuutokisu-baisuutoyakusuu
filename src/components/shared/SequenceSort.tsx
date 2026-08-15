/**
 * 「説明の並べかえ」回答UI。
 *
 * 「なぜ きすう＋きすうは ぐうすうに なるのか」のような 思考・判断・表現の問いは、
 * 本来は記述で答えるものだが自動採点できない。そこで説明の断片を正しい順に
 * ならべかえさせることで、記述させずに 論理の筋道そのものを扱う。
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Undo2 } from 'lucide-react';

interface Props {
  /** 正しい順に並んだ説明。表示時はシャッフルする */
  items: string[];
  onSubmit: (orderedIndices: number[]) => void;
  accentBg?: string;
}

export const SequenceSort: React.FC<Props> = ({ items, onSubmit, accentBg = 'bg-violet-500' }) => {
  // 表示順（元の index の並び）を一度だけシャッフルして固定する
  const [display] = useState<number[]>(() => {
    const idx = items.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    // 偶然そのままの順になったら1つずらす
    if (idx.every((v, i) => v === i)) idx.push(idx.shift() as number);
    return idx;
  });
  const [order, setOrder] = useState<number[]>([]);

  const tap = (originalIndex: number) => {
    if (order.includes(originalIndex)) return;
    setOrder([...order, originalIndex]);
  };
  const undo = () => setOrder(order.slice(0, -1));

  const allPicked = order.length === items.length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold text-faint px-1">上から 順番に なるように、じゅんばんに タップしよう</p>

      <div className="flex flex-col gap-2.5">
        {display.map((oi) => {
          const pos = order.indexOf(oi);
          const picked = pos >= 0;
          return (
            <motion.button
              key={oi}
              onClick={() => tap(oi)}
              disabled={picked}
              whileTap={picked ? undefined : { scale: 0.98 }}
              className={`flex items-start gap-3 text-left p-4 rounded-2xl border-2 transition-all ${
                picked ? 'bg-violet-50 border-violet-300' : 'bg-surface border-line hover:border-violet-400'
              }`}
            >
              <span
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                  picked ? 'bg-violet-500 text-white' : 'bg-surface-3 text-faint'
                }`}
              >
                {picked ? pos + 1 : '?'}
              </span>
              <span className="font-bold text-content leading-relaxed flex-1">{items[oi]}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={undo}
          disabled={order.length === 0}
          className={`px-5 py-4 rounded-2xl font-black transition-all active:scale-95 flex items-center gap-1.5 ${
            order.length === 0 ? 'bg-surface-3 text-faint' : 'bg-surface-2 border-2 border-line text-muted hover:bg-surface-3'
          }`}
        >
          <Undo2 size={18} /> もどす
        </button>
        <button
          onClick={() => allPicked && onSubmit(order)}
          disabled={!allPicked}
          className={`flex-1 py-4 rounded-2xl text-lg font-black shadow-lg transition-all active:scale-95 ${
            allPicked ? `${accentBg} text-white hover:brightness-110` : 'bg-surface-3 text-faint'
          }`}
        >
          この順で こたえる
        </button>
      </div>
    </div>
  );
};
