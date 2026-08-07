/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hub } from './components/Hub';
import { HissanModule } from './components/modules/HissanModule';
import { MentalModule } from './components/modules/MentalModule';
import { RulesModule } from './components/modules/RulesModule';
import { EstimateModule } from './components/modules/EstimateModule';
import { CheckModule } from './components/modules/CheckModule';
import { WordProblemModule } from './components/modules/WordProblemModule';
import { ErrorHunterModule } from './components/modules/ErrorHunterModule';
import { MockTestModule } from './components/modules/MockTestModule';
import { LogView } from './components/LogView';
import { ModuleId } from './store/progressStore';
import { useApplySettings } from './lib/useApplySettings';
import { useSettingsStore } from './store/settingsStore';
import { MatrixRain } from './components/ui/MatrixRain';
import { AuroraRain } from './components/ui/AuroraRain';
import { SakuraRain } from './components/ui/SakuraRain';
import { InfernoRain } from './components/ui/InfernoRain';
import { TenkuuRain } from './components/ui/TenkuuRain';

type View = { kind: 'HUB' } | { kind: 'LOG' } | { kind: 'TEST' } | { kind: 'MODULE'; id: ModuleId };

export default function App() {
  const [view, setView] = useState<View>({ kind: 'HUB' });
  const theme = useSettingsStore((s) => s.theme);
  useApplySettings();

  const goHub = () => setView({ kind: 'HUB' });

  const renderModule = (id: ModuleId) => {
    switch (id) {
      case 'hissan':
        return <HissanModule onExit={goHub} />;
      case 'mental':
        return <MentalModule onExit={goHub} />;
      case 'rules':
        return <RulesModule onExit={goHub} />;
      case 'estimate':
        return <EstimateModule onExit={goHub} />;
      case 'check':
        return <CheckModule onExit={goHub} />;
      case 'word-problem':
        return <WordProblemModule onExit={goHub} />;
      case 'error-hunter':
        return <ErrorHunterModule onExit={goHub} />;
      default:
        return <HissanModule onExit={goHub} />;
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden select-none bg-bg">
      {/* テーマ別の動く背景（各コンポーネントが自分のテーマ以外では何も描画しない） */}
      <MatrixRain />
      <AuroraRain />
      <SakuraRain />
      <InfernoRain />
      <TenkuuRain />

      <div className="relative z-10 w-full h-full">
        <AnimatePresence mode="wait">
          {view.kind === 'HUB' && (
            <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
              <Hub onSelectModule={(id) => setView({ kind: 'MODULE', id })} onOpenLog={() => setView({ kind: 'LOG' })} onStartTest={() => setView({ kind: 'TEST' })} />
            </motion.div>
          )}

          {view.kind === 'TEST' && (
            <motion.div key="test" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
              <MockTestModule onExit={goHub} />
            </motion.div>
          )}

          {view.kind === 'MODULE' && (
            <motion.div key={`module-${view.id}`} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
              {renderModule(view.id)}
            </motion.div>
          )}

          {view.kind === 'LOG' && (
            <motion.div key="log" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full h-full">
              <LogView onBack={goHub} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 背景のドット装飾（ライトテーマのみ。ダーク=レイン / クリーム=和紙テクスチャと干渉させない） */}
      {theme === 'light' && (
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1] overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(#1e293b 1.5px, transparent 1.5px)`, backgroundSize: '40px 40px' }} />
        </div>
      )}

      {/* 画面左下のクレジット表記（ごく小さく） */}
      <div className="fixed bottom-1 left-2 z-50 pointer-events-none text-[10px] leading-none text-faint/60 select-none">
        presented by onokomachi
      </div>
    </div>
  );
}
