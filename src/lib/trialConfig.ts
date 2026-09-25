/**
 * 神域の試練の層。
 *
 * いまは本番テストの設問から**仮に**組んでいる（設問の順＝やさしい順、同じモジュールはまとめる）。
 * 実際の紙のテストに合わせるときは、ここを手で書きかえる
 * （floors と reqs を直接書く。倍の見方の trialConfig.ts が見本）。
 *
 * このアプリの設問は level を項目の記号として持っている。
 */
import { floorsFromTestSteps } from 'learning-app-kit/trial';
import { TEST_STEPS, type TestStep } from './testConfig';
import type { Problem } from './problems';

export const TRIAL = floorsFromTestSteps(TEST_STEPS.map((s) => ({ ...s, skillId: s.level })));
export const FLOOR_COUNT = TRIAL.floors.length;

/** その項目の本番テストの設問を1つ選んで作る。出すときに moduleId も要るので、設問ごと返す */
export function trialProblem(skillId: string): { step: TestStep; problem: Problem } {
  const pool = TEST_STEPS.filter((s) => s.level === skillId);
  const step = pool[Math.floor(Math.random() * pool.length)] ?? TEST_STEPS[0]!;
  return { step, problem: step.gen() };
}
