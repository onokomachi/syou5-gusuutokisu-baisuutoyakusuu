
import React, { useState } from 'react';
import { Difficulty, StartOptions } from '../types';
import { LEVEL_CONFIG } from '../constants';
import { Settings, Play, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  onStart: (diff: Difficulty, options: StartOptions) => void;
  stats: Record<string, number>;
  initialDifficulty?: Difficulty;
  initialOptions?: Partial<StartOptions>;
}

export const ProblemSelector: React.FC<Props> = ({
  onStart,
  stats,
  initialDifficulty = '2-1',
  initialOptions = {} as Partial<StartOptions>
}) => {
  const [selected, setSelected] = useState<Difficulty>(initialDifficulty);
  const [allowRemainder, setAllowRemainder] = useState(initialOptions.allowRemainder ?? true);
  const [masterMode, setMasterMode] = useState(initialOptions.masterMode ?? false);
  const [zeroFocus, setZeroFocus] = useState(initialOptions.zeroFocus ?? true);
  const [zeroShortcut, setZeroShortcut] = useState(initialOptions.zeroShortcut ?? false);

  const getSolvedCount = (diff: Difficulty) => {
    const rem = stats[`${diff}_rem`] || 0;
    const noRem = stats[`${diff}_no_rem`] || 0;
    return rem + noRem;
  };

  // 2けた÷2けた・3けた÷3けたは商が1桁になるため「0がたつ問題」は存在しない
  const zeroFocusAvailable = selected !== '2-2' && selected !== '3-3';

  const Toggle = ({ on, onClick, color = 'bg-blue-500', disabled = false }: { on: boolean; onClick: () => void; color?: string; disabled?: boolean }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 shrink-0 ${disabled ? 'bg-slate-200 opacity-50' : (on ? color : 'bg-slate-300')}`}
    >
      <motion.div
        animate={{ x: on && !disabled ? 24 : 0 }}
        className="w-6 h-6 bg-white rounded-full shadow-sm"
      />
    </button>
  );

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-[32px] shadow-lg p-8 border border-slate-100"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
            <Settings size={22} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 font-sans tracking-tight">がくしゅうせってい</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">レベルをえらぶ</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(LEVEL_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelected(key as Difficulty)}
                  className={`p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${
                    selected === key
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="text-xl font-bold mb-1 text-slate-800">{config.label}</div>
                      <div className="text-sm text-slate-500">{config.description}</div>
                    </div>
                    {getSolvedCount(key as Difficulty) > 0 && (
                      <div className="mt-4 flex items-center gap-1.5 self-start bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 shadow-sm">
                        <Check size={14} strokeWidth={3} />
                        クリア: {getSolvedCount(key as Difficulty)}
                      </div>
                    )}
                  </div>
                  {selected === key && (
                    <motion.div
                      layoutId="check"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500"
                    >
                      <Check size={24} />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="font-bold text-slate-800 text-sm leading-tight">あまりのある問題</div>
                <Toggle on={allowRemainder} onClick={() => setAllowRemainder(!allowRemainder)} />
              </div>
              <div className="flex flex-col items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="font-bold text-slate-800 text-sm leading-tight">0がたつ問題</div>
                <Toggle
                  on={zeroFocus && zeroFocusAvailable}
                  onClick={() => setZeroFocus(!zeroFocus)}
                  disabled={!zeroFocusAvailable}
                />
              </div>
              <div className="flex flex-col items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="font-bold text-slate-800 text-sm leading-tight">0がたつ計算をはぶく</div>
                <Toggle on={zeroShortcut} onClick={() => setZeroShortcut(!zeroShortcut)} />
              </div>
            </div>
            {!zeroFocusAvailable && (
              <div className="text-sm text-slate-500 px-1">このレベルは商が1けたなので、0がたつ問題はありません。</div>
            )}
          </div>

          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <div className="font-bold text-slate-800">マスターモード</div>
              <div className="text-sm text-slate-500">ヒントが出ず、さいごにまとめて 答え合わせ をするモードだよ！</div>
            </div>
            <Toggle on={masterMode} onClick={() => setMasterMode(!masterMode)} color="bg-amber-500" />
          </div>

        <button
          onClick={() => onStart(selected, {
            allowRemainder,
            masterMode,
            zeroFocus: zeroFocus && zeroFocusAvailable,
            zeroShortcut
          })}
          className="w-full mt-6 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] font-black text-xl flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all"
        >
          <Play size={24} fill="currentColor" />
          <span>スタート！</span>
        </button>
        </div>
      </motion.div>
    </div>
  );
};
