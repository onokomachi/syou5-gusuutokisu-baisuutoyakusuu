/**
 * 極光テーマ専用の背景：北極の夜空に、緑・紫・青の光のカーテン（オーロラ）が
 * sin波を重ねてゆっくり揺れる。theme === 'aurora' のときだけ描画する。
 */
import React, { useEffect, useRef } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

interface Band {
  color: [number, number, number];
  baseY: number;   // 画面高に対する基準位置(0..1)
  amp: number;     // 縦の揺れ幅(px)
  freq: number;    // 横方向の波の細かさ
  speed: number;   // 揺れる速さ
  thickness: number; // カーテンの厚み(px)
  alpha: number;
}

export const AuroraRain: React.FC = () => {
  const theme = useSettingsStore((s) => s.theme);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (theme !== 'aurora') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bands: Band[] = [
      { color: [80, 255, 150], baseY: 0.30, amp: 60, freq: 0.006, speed: 0.0006, thickness: 220, alpha: 0.22 },
      { color: [150, 90, 255], baseY: 0.42, amp: 80, freq: 0.004, speed: 0.0009, thickness: 260, alpha: 0.18 },
      { color: [60, 200, 255], baseY: 0.24, amp: 50, freq: 0.008, speed: 0.0012, thickness: 180, alpha: 0.16 },
    ];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let last = 0;
    const interval = 33; // ~30fps
    const step = 14; // 波のサンプリング間隔(px)

    const draw = (t: number) => {
      rafRef.current = requestAnimationFrame(draw);
      if (t - last < interval) return;
      last = t;

      // 夜空へフェード
      ctx.fillStyle = 'rgba(2, 3, 9, 0.30)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'lighter';
      for (const b of bands) {
        const [r, g, bl] = b.color;
        for (let x = 0; x <= canvas.width; x += step) {
          // 2つのsin波を重ねて自然な揺らぎに
          const y =
            canvas.height * b.baseY +
            Math.sin(x * b.freq + t * b.speed) * b.amp +
            Math.sin(x * b.freq * 2.3 + t * b.speed * 1.7) * b.amp * 0.4;
          const grad = ctx.createLinearGradient(0, y, 0, y + b.thickness);
          grad.addColorStop(0, `rgba(${r}, ${g}, ${bl}, 0)`);
          grad.addColorStop(0.5, `rgba(${r}, ${g}, ${bl}, ${b.alpha})`);
          grad.addColorStop(1, `rgba(${r}, ${g}, ${bl}, 0)`);
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, step + 1, b.thickness);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [theme]);

  if (theme !== 'aurora') return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0 opacity-70"
      style={{ willChange: 'transform', transform: 'translateZ(0)' }}
    />
  );
};
