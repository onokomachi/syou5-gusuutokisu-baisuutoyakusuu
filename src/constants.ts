import { ModuleId } from './store/progressStore';

/**
 * 「かずのせいしつラボ」のモジュール一覧。
 * 単元「偶数と奇数」「倍数と約数」（小学5年）で身につける知識・技能を段階的に網羅する。
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
    id: 'even-odd',
    title: 'ぐうすう・きすうチェック',
    description: '一の位に 注目して すばやく はんてい！',
    icon: 'Hash',
    accent: 'blue',
    status: 'ready',
  },
  {
    id: 'even-odd-rule',
    title: 'ぐうすう・きすうのせいしつ',
    description: 'たし算・かけ算の 結果を 予想しよう',
    icon: 'Scale',
    accent: 'violet',
    status: 'ready',
  },
  {
    id: 'multiples',
    title: '倍数みつけ隊',
    description: '○の倍数を すばやく さがそう',
    icon: 'Repeat',
    accent: 'amber',
    status: 'ready',
  },
  {
    id: 'lcm',
    title: '公倍数・最小公倍数',
    description: '2つの数の 倍数が そろう ところは？',
    icon: 'GitMerge',
    accent: 'cyan',
    status: 'ready',
  },
  {
    id: 'divisors',
    title: '約数みつけ隊',
    description: 'ペアで さがせば 見落とさない！',
    icon: 'Grid3x3',
    accent: 'emerald',
    status: 'ready',
  },
  {
    id: 'gcd',
    title: '公約数・最大公約数',
    description: 'あまりなく 分けられる 一番大きい数は？',
    icon: 'Boxes',
    accent: 'teal',
    status: 'ready',
  },
  {
    id: 'error-hunter',
    title: 'エラーハンター',
    description: 'よくある かんちがいを 見つけて なおそう',
    icon: 'Search',
    accent: 'rose',
    status: 'ready',
  },
];
