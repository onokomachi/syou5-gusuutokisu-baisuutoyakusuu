/**
 * ぐうすう・きすうチェック。一の位で判定する基本から、大きい数・0の性質・数列の穴うめまで。
 */
import { createLevelModule } from '../shared/GenericModule';
import { EVEN_ODD_LEVELS, generateEvenOdd } from '../../lib/problems';

export const EvenOddModule = createLevelModule({
  moduleId: 'even-odd',
  title: 'ぐうすう・きすうチェック',
  subtitle: '一の位に 注目して、すばやく はんていしよう',
  levels: EVEN_ODD_LEVELS,
  generate: generateEvenOdd,
  accent: { border: 'hover:border-blue-400', bg: 'bg-blue-500 border-blue-500', button: 'bg-blue-500 hover:bg-blue-600' },
});
