/**
 * マトリックス風「デジタルレイン」背景。
 * ダークテーマのときだけ描画する（settingsStore の theme を参照）。
 * canvas に カタカナ・数字 を緑で降らせる。学習の邪魔にならないよう低い不透明度に抑える。
 */
import React, { useEffect, useRef } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

const GLYPHS = 'アカサタナハマヤラワ0123456789ｱｲｳｴｵｶｷｸ.+-=×÷'.split('');

export const MatrixRain: React.FC = () => {
  const theme = useSettingsStore((s) => s.theme);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (theme !== 'dark') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fontSize = 18;
    let columns = 0;
    let drops: number[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array.from({ length: columns }, () => Math.floor((Math.random() * canvas.height) / fontSize));
    };
    resize();
    window.addEventListener('resize', resize);

    let last = 0;
    const interval = 45; // ms ごとに 1 ステップ

    const draw = (t: number) => {
      rafRef.current = requestAnimationFrame(draw);
      if (t - last < interval) return;
      last = t;

      // 残像を残しつつ純黒へフェード（背景が灰色がからず真っ黒に保たれる）
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      for (let i = 0; i < drops.length; i++) {
        const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        // 先頭の落下点だけ明るい緑、あとは落ち着いた緑（白は使わない）
        ctx.fillStyle = Math.random() > 0.975 ? 'rgba(120, 255, 140, 0.85)' : 'rgba(0, 220, 60, 0.5)';
        ctx.fillText(ch, x, y);
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [theme]);

  if (theme !== 'dark') return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0 opacity-40"
      style={{ willChange: 'transform', transform: 'translateZ(0)' }}
    />
  );
};
