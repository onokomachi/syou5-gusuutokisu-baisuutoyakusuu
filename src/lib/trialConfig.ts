/**
 * 実力の階段の段。
 *
 * いまは本番テストの設問から**仮に**組んでいる（設問の順＝やさしい順、同じモジュールはまとめる）。
 * 実際の紙のテストに合わせるときは、ここを手で書きかえる
 * （floors と reqs を直接書く。倍の見方の trialConfig.ts が見本）。
 *
 * このアプリの設問は level を項目の記号として持っている。
 */
import { floorsFromTestSteps, withExtraSkills } from 'learning-app-kit/trial';
import { TEST_STEPS } from './testConfig';
import {
  generateDivisors, generateEvenOdd, generateEor, generateGcd, generateLcm, generateMultiples, type Problem,
} from './problems';
import type { ModuleId } from '../store/progressStore';

export const TRIAL = floorsFromTestSteps(TEST_STEPS.map((s) => ({ ...s, skillId: s.level })));
export const FLOOR_COUNT = TRIAL.floors.length;

/** 1問ぶん。GenericRound に渡すのに level と moduleId が要る */
export interface TrialItem { level: string; moduleId: ModuleId; problem: Problem }

/**
 * 本番テストに出ない項目。極限には出さず（テスト予想を正直に保つ）、無限でだけ出す。
 * 頂点に届いた子は、無限で単元のすべての項目に挑める。
 */
export const EXTRA_SKILLS: readonly string[] = [
  'div-pick', 'div-all', 'div-pairs',
  'eor-blank', 'eo-seq',
  'gcd-word', 'gcd-prime', 'gcd-fraction',
  'lcm-pick', 'lcm-three', 'lcm-fraction',
  'mul-count',
];

/** 無限で出す段（テスト外の項目を、同じモジュールの段に混ぜたもの） */
export const ENDLESS_FLOORS = withExtraSkills(TRIAL.floors, EXTRA_SKILLS);

/** テストに出ない項目を作る。記号の前半でモジュールと生成器が決まる（eor- を eo- より先に見る） */
function extraItem(level: string): TrialItem {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const l = level as any;
  if (level.startsWith('eor-')) return { level, moduleId: 'even-odd-rule', problem: generateEor(l) };
  if (level.startsWith('eo-')) return { level, moduleId: 'even-odd', problem: generateEvenOdd(l) };
  if (level.startsWith('div-')) return { level, moduleId: 'divisors', problem: generateDivisors(l) };
  if (level.startsWith('gcd-')) return { level, moduleId: 'gcd', problem: generateGcd(l) };
  if (level.startsWith('lcm-')) return { level, moduleId: 'lcm', problem: generateLcm(l) };
  return { level, moduleId: 'multiples', problem: generateMultiples(l) };
}

/** その項目の1問を作る。本番テストにある項目は、その設問から（同じ項目が複数あれば、ばらばらに） */
export function trialProblem(skillId: string): TrialItem {
  if (EXTRA_SKILLS.includes(skillId)) return extraItem(skillId);
  const pool = TEST_STEPS.filter((s) => s.level === skillId);
  const step = pool[Math.floor(Math.random() * pool.length)] ?? TEST_STEPS[0]!;
  return { level: step.level, moduleId: step.moduleId, problem: step.gen() };
}
