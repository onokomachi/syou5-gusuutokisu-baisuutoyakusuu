/**
 * 倍数みつけ隊。□番目の倍数から、倍数判定・複数選択・範囲内の個数まで。
 */
import { createLevelModule } from '../shared/GenericModule';
import { MULTIPLES_LEVELS, generateMultiples } from '../../lib/problems';

export const MultiplesModule = createLevelModule({
  moduleId: 'multiples',
  title: '倍数みつけ隊',
  subtitle: 'ある数を 1倍、2倍、3倍…した数が 倍数だよ',
  levels: MULTIPLES_LEVELS,
  generate: generateMultiples,
  accent: { border: 'hover:border-amber-400', bg: 'bg-amber-500 border-amber-500', button: 'bg-amber-500 hover:bg-amber-600' },
});
