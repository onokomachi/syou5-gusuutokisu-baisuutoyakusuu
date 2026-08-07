/**
 * 「本番テストモード」の設定表。
 * 実際の単元テスト「偶数と奇数／倍数と約数」（表=知識・技能100点 / 裏=思考・判断・表現50点）
 * と同じような大問構成・配点で再現する（数値はランダム生成）。
 * 全レベルが同じ Problem 型を返すため、GenericRound 1つで全設問を描画できる。
 * 採点: ノーミス完答=満点、ミスありで完答=0点（＝一発正解を採点）。
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
  { daimon: 4, title: 'すうれつの あなうめ', section: '表', points: 5, moduleId: 'even-odd', level: 'eo-seq', gen: () => generateEvenOdd('eo-seq') },
  { daimon: 5, title: 'たし算の 結果の予想', section: '表', points: 5, moduleId: 'even-odd-rule', level: 'eor-add', gen: () => generateEor('eor-add') },
  { daimon: 6, title: 'かけ算の 結果の予想', section: '表', points: 5, moduleId: 'even-odd-rule', level: 'eor-mul', gen: () => generateEor('eor-mul') },
  { daimon: 7, title: 'つまずきポイント クイズ', section: '表', points: 5, moduleId: 'even-odd-rule', level: 'eor-trap', gen: () => generateEor('eor-trap') },
  { daimon: 8, title: '□番目の 倍数', section: '表', points: 5, moduleId: 'multiples', level: 'mul-basic', gen: () => generateMultiples('mul-basic') },
  { daimon: 9, title: '倍数の 判定', section: '表', points: 5, moduleId: 'multiples', level: 'mul-judge', gen: () => generateMultiples('mul-judge') },
  { daimon: 10, title: '倍数を えらぶ', section: '表', points: 5, moduleId: 'multiples', level: 'mul-pick', gen: () => generateMultiples('mul-pick') },
  { daimon: 11, title: '範囲内の 倍数の数', section: '表', points: 5, moduleId: 'multiples', level: 'mul-count', gen: () => generateMultiples('mul-count') },
  { daimon: 12, title: '最小公倍数を もとめる', section: '表', points: 5, moduleId: 'lcm', level: 'lcm-find', gen: () => generateLcm('lcm-find') },
  { daimon: 13, title: '公倍数を えらぶ', section: '表', points: 5, moduleId: 'lcm', level: 'lcm-pick', gen: () => generateLcm('lcm-pick') },
  { daimon: 14, title: '約数の 判定', section: '表', points: 5, moduleId: 'divisors', level: 'div-judge', gen: () => generateDivisors('div-judge') },
  { daimon: 15, title: '約数を えらぶ', section: '表', points: 5, moduleId: 'divisors', level: 'div-pick', gen: () => generateDivisors('div-pick') },
  { daimon: 16, title: '約数の 個数', section: '表', points: 5, moduleId: 'divisors', level: 'div-count', gen: () => generateDivisors('div-count') },
  { daimon: 17, title: '最大公約数を もとめる', section: '表', points: 5, moduleId: 'gcd', level: 'gcd-find', gen: () => generateGcd('gcd-find') },
  { daimon: 18, title: '公約数を えらぶ', section: '表', points: 5, moduleId: 'gcd', level: 'gcd-pick', gen: () => generateGcd('gcd-pick') },
  { daimon: 19, title: '素数(そすう)の 判定', section: '表', points: 5, moduleId: 'gcd', level: 'gcd-prime', gen: () => generateGcd('gcd-prime') },

  /* ===== 裏・思考判断表現（計50点、5問×10点） ===== */
  { daimon: 20, title: '文章題（最小公倍数の考え方）', section: '裏', points: 10, moduleId: 'lcm', level: 'lcm-word', gen: () => generateLcm('lcm-word') },
  { daimon: 21, title: '文章題（最大公約数の考え方）', section: '裏', points: 10, moduleId: 'gcd', level: 'gcd-word', gen: () => generateGcd('gcd-word') },
  { daimon: 22, title: '□に あてはまる数の しゅるい', section: '裏', points: 10, moduleId: 'even-odd-rule', level: 'eor-blank', gen: () => generateEor('eor-blank') },
  { daimon: 23, title: '約数を ぜんぶ みつける', section: '裏', points: 10, moduleId: 'divisors', level: 'div-all', gen: () => generateDivisors('div-all') },
  { daimon: 24, title: '3つの数の 最小公倍数（発展）', section: '裏', points: 10, moduleId: 'lcm', level: 'lcm-three', gen: () => generateLcm('lcm-three') },
];

export const OMOTE_MAX = TEST_STEPS.filter((s) => s.section === '表').reduce((a, s) => a + s.points, 0); // 100
export const URA_MAX = TEST_STEPS.filter((s) => s.section === '裏').reduce((a, s) => a + s.points, 0);   // 50
export const TOTAL_MAX = OMOTE_MAX + URA_MAX; // 150
