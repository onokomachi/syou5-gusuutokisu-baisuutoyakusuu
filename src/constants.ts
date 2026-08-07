import { Difficulty } from './types';
import { ModuleId } from './store/progressStore';

/** 筆算シミュレーターのレベル定義（既存） */
export const LEVEL_CONFIG: Record<Difficulty, { label: string; description: string }> = {
  '2-1': {
    label: '2けた ÷ 1けた',
    description: 'まずはここから！基本の筆算。'
  },
  '3-1': {
    label: '3けた ÷ 1けた',
    description: '少し長くなります。丁寧にやりましょう。'
  },
  '2-2': {
    label: '2けた ÷ 2けた',
    description: '「たてる」数の見当をつけよう。'
  },
  '3-2': {
    label: '3けた ÷ 2けた',
    description: '4年生のクライマックス！'
  },
  '3-3': {
    label: '3けた ÷ 3けた',
    description: '大きなわる数も 見当づけで たおせる！'
  }
};

/**
 * 「わり算ランド」のモジュール一覧。
 * 単元「わり算の筆算（÷1けた・÷2けた）」で身につける知識・技能を段階的に網羅する。
 */
export interface ModuleMeta {
  id: ModuleId;
  title: string;
  description: string;
  /** lucide-react のアイコン名 */
  icon: string;
  /** Tailwind の色トークン（カードのアクセント） */
  accent: string;
  status: 'ready' | 'soon';
}

export const MODULES: ModuleMeta[] = [
  {
    id: 'mental',
    title: 'あんざん わり算',
    description: '九九・何十・何百のわり算を すばやく！',
    icon: 'Zap',
    accent: 'amber',
    status: 'ready',
  },
  {
    id: 'hissan',
    title: '筆算シミュレーター',
    description: 'たてる・かける・ひく・おろす をマスター',
    icon: 'Divide',
    accent: 'blue',
    status: 'ready',
  },
  {
    id: 'estimate',
    title: '商の見当づけ',
    description: 'どの位に たつ？いくつ たつ？',
    icon: 'Compass',
    accent: 'violet',
    status: 'ready',
  },
  {
    id: 'check',
    title: 'たしかめ算',
    description: 'わる数×商＋あまり で かくにん',
    icon: 'CheckCheck',
    accent: 'emerald',
    status: 'ready',
  },
  {
    id: 'rules',
    title: 'わり算のきまり',
    description: '同じ数で わっても 商は 同じ！',
    icon: 'Scale',
    accent: 'cyan',
    status: 'ready',
  },
  {
    id: 'word-problem',
    title: 'ことばの もんだい',
    description: 'あまりを どうする？ しきを 考えよう',
    icon: 'BookOpen',
    accent: 'teal',
    status: 'ready',
  },
  {
    id: 'error-hunter',
    title: 'エラーハンター',
    description: 'まちがいを 見つけて なおそう',
    icon: 'Search',
    accent: 'rose',
    status: 'ready',
  },
];
