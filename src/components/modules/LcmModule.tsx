/**
 * 公倍数・最小公倍数。求める・選ぶ・文章題から、3数の最小公倍数（発展）まで。
 */
import { createLevelModule } from '../shared/GenericModule';
import { LCM_LEVELS, generateLcm } from '../../lib/problems';

export const LcmModule = createLevelModule({
  moduleId: 'lcm',
  title: '公倍数・最小公倍数',
  subtitle: '2つの数に 共通する倍数を さがそう',
  levels: LCM_LEVELS,
  generate: generateLcm,
  accent: { border: 'hover:border-cyan-400', bg: 'bg-cyan-500 border-cyan-500', button: 'bg-cyan-500 hover:bg-cyan-600' },
});
