/**
 * 実力の階段 ── この単元の中で、自分がどこまで確実にできるかを測る。
 *
 * 画面と決まり（極限・無限・セーブ・予想点・記録）は learning-app-kit の TrialScreen。
 * このアプリが決めるのは、段（trialConfig）と、1問の作り方・出し方だけ。
 * 問題は本番テストと同じ GenericRound（足場なし）で出す。
 */
import React from 'react';
import confetti from 'canvas-confetti';
import { TrialScreen } from 'learning-app-kit/react';
import { TRIAL, ENDLESS_FLOORS, trialProblem } from '../../lib/trialConfig';
import { practiceModuleOf } from '../../lib/testConfig';
import type { ModuleId } from '../../store/progressStore';
import { playClear, playCorrect, playSoftTry } from '../../lib/sound';
import { GenericRound } from '../shared/GenericModule';

const ACCENT = { border: 'hover:border-blue-400', bg: 'bg-blue-500 border-blue-500', button: 'bg-blue-500 hover:bg-blue-600' };

interface Props {
  onExit: () => void;
  /** 結果から「やるべき段」の練習へ飛ぶ */
  onPractice: (id: ModuleId) => void;
}

export const TrialModule: React.FC<Props> = ({ onExit, onPractice }) => (
  <TrialScreen<ReturnType<typeof trialProblem>>
    appId="suusei"
    supabaseUrl={import.meta.env.VITE_SUPABASE_URL as string | undefined}
    supabaseKey={import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined}
    floors={TRIAL.floors}
    endlessFloors={ENDLESS_FLOORS}
    testReqs={TRIAL.reqs}
    testMax={TRIAL.max}
    generate={(skillId) => trialProblem(skillId)}
    render={({ level, moduleId, problem }, h) => (
      // 本番テストと同じ出題画面を、明るい面の上に置く（読みやすさを優先）
      <div className="rounded-[28px] bg-bg text-content p-2 sm:p-4 shadow-[0_0_60px_-20px_rgba(103,232,249,0.45)]">
        <GenericRound
          level={level}
          problem={problem}
          moduleId={moduleId}
          generate={() => problem}
          accent={ACCENT}
          onNext={() => {}}
          onResult={h.onResult}
          onMiss={h.onMiss}
          nextLabel="つぎへ"
          scaffold="none"
        />
      </div>
    )}
    onExit={onExit}
    exitLabel="もどる"
    onPractice={(skillId) => {
      const m = practiceModuleOf(skillId);
      if (m) onPractice(m);
    }}
    sound={{
      correct: playCorrect,
      miss: playSoftTry,
      clear: () => {
        playClear();
        confetti({ particleCount: 160, spread: 90, origin: { y: 0.4 }, colors: ['#67e8f9', '#f0abfc', '#fde68a'] });
      },
    }}
  />
);
