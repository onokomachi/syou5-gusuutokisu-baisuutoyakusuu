/**
 * 約数みつけ隊。判定・選択・個数から、ぜんぶ探す（1〜Nを確認）まで。
 */
import { createLevelModule } from '../shared/GenericModule';
import { DIVISORS_LEVELS, generateDivisors } from '../../lib/problems';

export const DivisorsModule = createLevelModule({
  moduleId: 'divisors',
  title: '約数みつけ隊',
  subtitle: 'ある数を わりきれる数が 約数だよ。ペアで さがそう',
  levels: DIVISORS_LEVELS,
  generate: generateDivisors,
  accent: { border: 'hover:border-emerald-400', bg: 'bg-emerald-500 border-emerald-500', button: 'bg-emerald-500 hover:bg-emerald-600' },
});
