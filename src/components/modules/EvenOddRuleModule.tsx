/**
 * ぐうすう・きすうのせいしつ。たし算・かけ算の結果予想から、逆算・つまずき対策まで。
 */
import { createLevelModule } from '../shared/GenericModule';
import { EOR_LEVELS, generateEor } from '../../lib/problems';

export const EvenOddRuleModule = createLevelModule({
  moduleId: 'even-odd-rule',
  title: 'ぐうすう・きすうのせいしつ',
  subtitle: '計算しなくても、答えの種類が わかるようになろう',
  levels: EOR_LEVELS,
  generate: generateEor,
  accent: { border: 'hover:border-violet-400', bg: 'bg-violet-500 border-violet-500', button: 'bg-violet-500 hover:bg-violet-600' },
});
