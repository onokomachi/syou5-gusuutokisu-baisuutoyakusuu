/**
 * モジュール画面の共通枠。ヘッダー（もどる・タイトル・設定）を提供し、
 * 設定パネルの開閉を内包する。各モジュールは children に本体を渡すだけ。
 */
import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { ChevronLeft, Settings as SettingsIcon } from 'lucide-react';
import { Settings } from '../Settings';

interface Props {
  title: string;
  subtitle?: string;
  onBack: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<Props> = ({ title, subtitle, onBack, children }) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 md:p-6 bg-surface border-b border-line shadow-sm shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted hover:text-content font-bold px-3 py-2 rounded-xl hover:bg-surface-2 transition-colors"
        >
          <ChevronLeft size={24} />
          もどる
        </button>

        <div className="flex items-center gap-2 text-center">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-content leading-tight">{title}</h1>
            {subtitle && <p className="text-xs md:text-sm text-faint font-bold">{subtitle}</p>}
          </div>
        </div>

        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 text-muted hover:text-content font-bold px-3 py-2 rounded-xl hover:bg-surface-2 transition-colors"
          aria-label="せってい"
        >
          <SettingsIcon size={22} />
          <span className="hidden md:inline">せってい</span>
        </button>
      </header>

      <div className="flex-1 overflow-hidden relative">{children}</div>

      <AnimatePresence>
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </div>
  );
};
