/**
 * おまかせ（適応難易度）モードの表示バー。現在レベルと「レベルアップ！」演出。
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wand2, ArrowUp } from 'lucide-react';
import { playLevelUp } from '../../lib/sound';

interface Props {
  index: number;
  total: number;
  leveledUp: boolean;
  onClearLevelUp: () => void;
}

export const AdaptiveBar: React.FC<Props> = ({ index, total, leveledUp, onClearLevelUp }) => {
  useEffect(() => {
    if (!leveledUp) return;
    playLevelUp();
    const t = setTimeout(onClearLevelUp, 1800);
    return () => clearTimeout(t);
  }, [leveledUp, onClearLevelUp]);

  return (
    <div className="relative flex items-center justify-center gap-2 py-2 bg-surface border-b border-line">
      <Wand2 size={16} className="text-indigo-500" />
      <span className="text-sm font-black text-indigo-600">おまかせモード</span>
      <span className="text-sm font-bold text-faint">レベル {index + 1} / {total}</span>
      <AnimatePresence>
        {leveledUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute right-4 flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black px-4 py-1.5 rounded-full shadow-lg"
          >
            <ArrowUp size={16} /> レベルアップ！
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
