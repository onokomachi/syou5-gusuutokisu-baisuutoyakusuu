/**
 * 隠しデバッグコマンド：画面左下の「presented by onokomachi」を3回連続でタップすると
 * パスワード入力欄が出て、正しいコードを入れると「全バッジ獲得あつかい」になる。
 * 出来映え（全バッジ・全テーマ・ボス戦などの解放後の見た目）を確認するための開発者用の仕掛け。
 */
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Check, X } from 'lucide-react';
import { useProgressStore } from '../store/progressStore';

const UNLOCK_CODE = '444325';
const TAP_COUNT = 3;
const TAP_WINDOW_MS = 1500;

export const DebugUnlock: React.FC = () => {
  const debugAllBadges = useProgressStore((s) => s.debugAllBadges);
  const setDebugAllBadges = useProgressStore((s) => s.setDebugAllBadges);
  const [showPrompt, setShowPrompt] = useState(false);
  const [code, setCode] = useState('');
  const [shake, setShake] = useState(false);
  const tapTimesRef = useRef<number[]>([]);

  const handleTap = () => {
    const now = Date.now();
    tapTimesRef.current = [...tapTimesRef.current, now].filter((t) => now - t <= TAP_WINDOW_MS);
    if (tapTimesRef.current.length >= TAP_COUNT) {
      tapTimesRef.current = [];
      setCode('');
      setShowPrompt(true);
    }
  };

  const submit = () => {
    if (code === UNLOCK_CODE) {
      setDebugAllBadges(true);
      setShowPrompt(false);
      setCode('');
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setCode('');
    }
  };

  return (
    <>
      <button
        onClick={handleTap}
        className="fixed bottom-0 left-1 z-50 text-[10px] leading-none text-faint/60 select-none bg-transparent border-0 px-2 py-2"
        aria-hidden
        tabIndex={-1}
      >
        presented by onokomachi{debugAllBadges ? ' ★' : ''}
      </button>

      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPrompt(false)}
            className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0, x: shake ? [0, -8, 8, -8, 0] : 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface border border-line rounded-[28px] p-7 max-w-xs w-full shadow-2xl text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-surface-2 text-muted flex items-center justify-center mx-auto mb-4">
                <Lock size={26} />
              </div>
              <h2 className="text-lg font-black text-content mb-1">かいはつしゃ コード</h2>
              <p className="text-xs text-muted font-bold mb-4">コードを入力してください</p>
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="w-full text-center text-2xl font-black tracking-[0.3em] py-3 rounded-2xl border-2 border-line bg-surface-2 text-content mb-4 focus:outline-none focus:border-brand"
                placeholder="------"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPrompt(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-surface-2 text-muted font-bold hover:bg-surface-3 transition-all"
                >
                  <X size={16} /> やめる
                </button>
                <button
                  onClick={submit}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-brand text-on-brand font-bold hover:bg-brand-strong transition-all"
                >
                  <Check size={16} /> けってい
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
