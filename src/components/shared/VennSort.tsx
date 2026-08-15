/**
 * ベン図に数を振り分ける回答UI。
 *
 * 2つの数の約数を「左だけ・両方・右だけ」の3つの部屋に分けることで、
 * 公約数＝2つの集合の重なり、最大公約数＝その中で最大、という構造を可視化する。
 * ドラッグは小さな指では失敗しやすいので、「チップを選ぶ → 部屋を押す」の2タップ方式にしている。
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';

type Zone = 'tray' | 'left' | 'both' | 'right';

interface Props {
  chips: number[];
  leftLabel: string;
  rightLabel: string;
  onSubmit: (placed: { left: number[]; both: number[]; right: number[] }) => void;
  accentBg?: string;
}

const Chip: React.FC<{ v: number; selected: boolean; onClick: () => void }> = ({ v, selected, onClick }) => (
  <motion.button
    layout
    onClick={onClick}
    className={`px-3.5 py-2 rounded-xl text-lg font-black tabular-nums border-2 transition-colors ${
      selected ? 'bg-amber-400 border-amber-500 text-slate-900 shadow-lg' : 'bg-surface border-line text-content hover:border-brand'
    }`}
  >
    {v}
  </motion.button>
);

export const VennSort: React.FC<Props> = ({ chips, leftLabel, rightLabel, onSubmit, accentBg = 'bg-teal-500' }) => {
  const [zones, setZones] = useState<Record<number, Zone>>(() => Object.fromEntries(chips.map((c) => [c, 'tray' as Zone])));
  const [selected, setSelected] = useState<number | null>(null);

  const inZone = (z: Zone) => chips.filter((c) => zones[c] === z).sort((a, b) => a - b);
  const place = (z: Zone) => {
    if (selected === null) return;
    setZones({ ...zones, [selected]: z });
    setSelected(null);
  };

  const allPlaced = chips.every((c) => zones[c] !== 'tray');

  const ZoneBox: React.FC<{ zone: Zone; title: string; sub?: string; tone: string }> = ({ zone, title, sub, tone }) => (
    <button
      onClick={() => place(zone)}
      disabled={selected === null}
      className={`flex-1 min-h-28 rounded-2xl border-2 p-2.5 text-left transition-all ${tone} ${
        selected !== null ? 'ring-2 ring-brand/40 cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="text-[11px] font-black text-muted mb-1.5">{title}{sub && <span className="text-faint font-bold">　{sub}</span>}</div>
      <div className="flex flex-wrap gap-1.5">
        {inZone(zone).map((v) => (
          <span
            key={v}
            onClick={(e) => { e.stopPropagation(); setZones({ ...zones, [v]: 'tray' }); }}
            className="px-2.5 py-1 rounded-lg text-base font-black tabular-nums bg-surface border border-line text-content"
          >
            {v}
          </span>
        ))}
      </div>
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* まだ入れていないチップ */}
      <div className="rounded-2xl bg-surface-2 border-2 border-line p-3">
        <div className="text-[11px] font-black text-muted mb-2">まだ 入れていない数（タップして えらぶ）</div>
        <div className="flex flex-wrap gap-2">
          {inZone('tray').length === 0 && <span className="text-sm font-bold text-faint px-1">ぜんぶ 入れたよ！</span>}
          {inZone('tray').map((v) => (
            <Chip key={v} v={v} selected={selected === v} onClick={() => setSelected(selected === v ? null : v)} />
          ))}
        </div>
      </div>

      {/* 3つの部屋 */}
      <div className="flex gap-2">
        <ZoneBox zone="left" title={leftLabel} tone="bg-cyan-50 border-cyan-200" />
        <ZoneBox zone="both" title="りょうほう" sub="＝公約数" tone="bg-amber-50 border-amber-300" />
        <ZoneBox zone="right" title={rightLabel} tone="bg-violet-50 border-violet-200" />
      </div>
      <p className="text-xs font-bold text-faint text-center -mt-1">
        入れた数を タップすると 上に もどせるよ
      </p>

      <button
        onClick={() => allPlaced && onSubmit({ left: inZone('left'), both: inZone('both'), right: inZone('right') })}
        disabled={!allPlaced}
        className={`w-full py-5 rounded-3xl text-xl font-black shadow-lg transition-all active:scale-95 ${
          allPlaced ? `${accentBg} text-white hover:brightness-110` : 'bg-surface-3 text-faint'
        }`}
      >
        これで こたえる
      </button>
    </div>
  );
};
