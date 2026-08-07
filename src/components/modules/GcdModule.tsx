/**
 * 公約数・最大公約数。求める・選ぶ・文章題から、素数の判定（発展）まで。
 */
import { createLevelModule } from '../shared/GenericModule';
import { GCD_LEVELS, generateGcd } from '../../lib/problems';

export const GcdModule = createLevelModule({
  moduleId: 'gcd',
  title: '公約数・最大公約数',
  subtitle: '2つの数に 共通する約数の中で、いちばん大きい数を さがそう',
  levels: GCD_LEVELS,
  generate: generateGcd,
  accent: { border: 'hover:border-teal-400', bg: 'bg-teal-500 border-teal-500', button: 'bg-teal-500 hover:bg-teal-600' },
});
