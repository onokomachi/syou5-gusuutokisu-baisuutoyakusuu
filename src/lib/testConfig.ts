/**
 * 「本番テストモード」の設定表。
 * 単元テスト（表＝知識・技能100点／裏＝思考・判断・表現50点）と同じ構成で再現する
 * （数値はランダム生成）。GenericRound 1つで全設問を描画できる。
 * 採点: ノーミス完答=満点、ミスありで完答=0点（＝一発正解を採点）。
 *
 * 裏面は、単元テストで最頻出の「しきつめ・切り分け」（幾何文脈の公倍数・公約数）を
 * 中心に構成している。表面には「小さい順に□つ書きましょう」「約数を全部書きましょう」
 * という書き出し形式を入れ、選択式だけで済ませないようにしている。
 */
import {
  generateEvenOdd, generateEor, generateMultiples, generateLcm, generateDivisors, generateGcd,
  Problem,
} from './problems';
import { ModuleId } from '../store/progressStore';

export type Section = '表' | '裏';

export interface TestStep {
  daimon: number;
  sub?: string;
  title: string;
  section: Section;
  points: number;
  moduleId: ModuleId;
  level: string;
  gen: () => Problem;
}

export const TEST_STEPS: TestStep[] = [
  /* ===== 表・知識技能（計100点、20問×5点） ===== */
  { daimon: 1, sub: '①', title: 'ぐうすう・きすうの はんてい', section: '表', points: 5, moduleId: 'even-odd', level: 'eo-basic', gen: () => generateEvenOdd('eo-basic') },
  { daimon: 1, sub: '②', title: 'ぐうすう・きすうの はんてい', section: '表', points: 5, moduleId: 'even-odd', level: 'eo-basic', gen: () => generateEvenOdd('eo-basic') },
  { daimon: 2, title: '大きい数の ぐうすう・きすう', section: '表', points: 5, moduleId: 'even-odd', level: 'eo-big', gen: () => generateEvenOdd('eo-big') },
  { daimon: 3, title: '0の せいしつ（正しい？まちがい？）', section: '表', points: 5, moduleId: 'even-odd', level: 'eo-zero', gen: () => generateEvenOdd('eo-zero') },
  { daimon: 4, title: '2×□ の 形で 書く', section: '表', points: 5, moduleId: 'even-odd', level: 'eo-expr', gen: () => generateEvenOdd('eo-expr') },
  { daimon: 5, sub: '①', title: 'たし算の 結果の予想', section: '表', points: 5, moduleId: 'even-odd-rule', level: 'eor-add', gen: () => generateEor('eor-add') },
  { daimon: 5, sub: '②', title: 'かけ算の 結果の予想', section: '表', points: 5, moduleId: 'even-odd-rule', level: 'eor-mul', gen: () => generateEor('eor-mul') },
  { daimon: 6, title: 'つまずきポイント クイズ', section: '表', points: 5, moduleId: 'even-odd-rule', level: 'eor-trap', gen: () => generateEor('eor-trap') },
  { daimon: 7, title: '□番目の 倍数', section: '表', points: 5, moduleId: 'multiples', level: 'mul-basic', gen: () => generateMultiples('mul-basic') },
  { daimon: 8, title: '倍数を 小さい順に 書き出す', section: '表', points: 5, moduleId: 'multiples', level: 'mul-list', gen: () => generateMultiples('mul-list') },
  { daimon: 9, title: '倍数の 判定', section: '表', points: 5, moduleId: 'multiples', level: 'mul-judge', gen: () => generateMultiples('mul-judge') },
  { daimon: 10, title: '倍数を えらぶ', section: '表', points: 5, moduleId: 'multiples', level: 'mul-pick', gen: () => generateMultiples('mul-pick') },
  { daimon: 11, title: '最小公倍数を もとめる', section: '表', points: 5, moduleId: 'lcm', level: 'lcm-find', gen: () => generateLcm('lcm-find') },
  { daimon: 12, title: '公倍数を 小さい順に 書き出す', section: '表', points: 5, moduleId: 'lcm', level: 'lcm-list', gen: () => generateLcm('lcm-list') },
  { daimon: 13, title: '約数の 判定', section: '表', points: 5, moduleId: 'divisors', level: 'div-judge', gen: () => generateDivisors('div-judge') },
  { daimon: 14, title: '約数を ぜんぶ 書き出す', section: '表', points: 5, moduleId: 'divisors', level: 'div-list', gen: () => generateDivisors('div-list') },
  { daimon: 15, title: '約数の 個数', section: '表', points: 5, moduleId: 'divisors', level: 'div-count', gen: () => generateDivisors('div-count') },
  { daimon: 16, title: '最大公約数を もとめる', section: '表', points: 5, moduleId: 'gcd', level: 'gcd-find', gen: () => generateGcd('gcd-find') },
  { daimon: 17, title: '公約数を えらぶ', section: '表', points: 5, moduleId: 'gcd', level: 'gcd-pick', gen: () => generateGcd('gcd-pick') },
  { daimon: 18, title: '3つの数の 最大公約数', section: '表', points: 5, moduleId: 'gcd', level: 'gcd-three', gen: () => generateGcd('gcd-three') },

  /* ===== 裏・思考判断表現（計50点、5問×10点） =====
     しきつめ・切り分けという 幾何文脈の2題を中心に据える。 */
  { daimon: 19, title: 'タイルで 正方形を つくる（しきつめ）', section: '裏', points: 10, moduleId: 'lcm', level: 'lcm-tile', gen: () => generateLcm('lcm-tile') },
  { daimon: 20, title: '正方形に 切り分ける', section: '裏', points: 10, moduleId: 'gcd', level: 'gcd-cut', gen: () => generateGcd('gcd-cut') },
  { daimon: 21, title: '文章題（同時に そろうのは いつ？）', section: '裏', points: 10, moduleId: 'lcm', level: 'lcm-word', gen: () => generateLcm('lcm-word') },
  { daimon: 22, title: 'ベン図で 公約数を 整理する', section: '裏', points: 10, moduleId: 'gcd', level: 'gcd-venn', gen: () => generateGcd('gcd-venn') },
  { daimon: 23, title: 'わけを 説明する（並べかえ）', section: '裏', points: 10, moduleId: 'even-odd-rule', level: 'eor-why', gen: () => generateEor('eor-why') },
];

export const OMOTE_MAX = TEST_STEPS.filter((s) => s.section === '表').reduce((a, s) => a + s.points, 0); // 100
export const URA_MAX = TEST_STEPS.filter((s) => s.section === '裏').reduce((a, s) => a + s.points, 0);   // 50
export const TOTAL_MAX = OMOTE_MAX + URA_MAX; // 150
