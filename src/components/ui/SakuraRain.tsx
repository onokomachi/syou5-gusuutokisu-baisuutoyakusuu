/**
 * 桜吹雪テーマ専用の背景：漆黒の夜空に、桜の花びらが くるくる回りながら
 * 舞い散り、月がほのかに光る。theme === 'sakura' のときだけ描画する。
 */
import React, { useEffect, useRef } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

interface Petal {
  x: number;
  y: number;
  size: number;      // 花びらの大きさ(px)
  vy: number;        // 落下速度
  sway: number;      // 横ゆれの位相
  swaySpeed: number;
  swayAmp: number;   // 横ゆれの幅
  rot: number;       // 回転角
  rotSpeed: number;
  alpha: number;
  hue: number;       // ピンクの濃さ（330〜350）
}

export const SakuraRain: React.FC = () => {
  const theme = useSettingsStore((s) => s.theme);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (theme !== 'sakura') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let petals: Petal[] = [];

    const spawn = (fromTop: boolean): Petal => ({
      x: Math.random() * canvas.width,
      y: fromTop ? -20 : Math.random() * canvas.height,
      size: 4 + Math.random() * 7,
      vy: 0.6 + Math.random() * 1.4,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.02,
      swayAmp: 0.6 + Math.random() * 1.6,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.08,
      alpha: 0.5 + Math.random() * 0.5,
      hue: 330 + Math.random() * 20,
    });

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.min(160, Math.floor((canvas.width * canvas.height) / 9000));
      petals = Array.from({ length: count }, () => spawn(false));
    };
    resize();
    window.addEventListener('resize', resize);

    let last = 0;
    const interval = 33; // ~30fps

    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // 花びら（先端が少しへこんだ楕円）を2つの弧で描く
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.quadraticCurveTo(p.size * 0.9, -p.size * 0.3, 0, p.size);
      ctx.quadraticCurveTo(-p.size * 0.9, -p.size * 0.3, 0, -p.size);
      const g = ctx.createLinearGradient(0, -p.size, 0, p.size);
      g.addColorStop(0, `hsla(${p.hue}, 100%, 88%, ${p.alpha})`);
      g.addColorStop(1, `hsla(${p.hue}, 90%, 72%, ${p.alpha * 0.85})`);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    };

    const draw = (t: number) => {
      rafRef.current = requestAnimationFrame(draw);
      if (t - last < interval) return;
      last = t;

      // 夜空
      ctx.fillStyle = '#0d0416';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // おぼろ月
      const mx = canvas.width * 0.82;
      const my = canvas.height * 0.16;
      const moon = ctx.createRadialGradient(mx, my, 0, mx, my, canvas.width * 0.18);
      moon.addColorStop(0, 'rgba(255, 230, 240, 0.22)');
      moon.addColorStop(0.25, 'rgba(255, 200, 225, 0.10)');
      moon.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = moon;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 地平の桜あかり
      const glow = ctx.createLinearGradient(0, canvas.height * 0.75, 0, canvas.height);
      glow.addColorStop(0, 'rgba(0,0,0,0)');
      glow.addColorStop(1, 'rgba(255, 120, 175, 0.10)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 花びら
      for (const p of petals) {
        p.sway += p.swaySpeed;
        p.rot += p.rotSpeed;
        p.x += Math.sin(p.sway) * p.swayAmp + 0.3; // ゆるい横風
        p.y += p.vy;
        drawPetal(p);
        if (p.y > canvas.height + 20 || p.x > canvas.width + 30) {
          Object.assign(p, spawn(true), { x: Math.random() * canvas.width - 20 });
        }
      }
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [theme]);

  if (theme !== 'sakura') return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
      style={{ willChange: 'transform', transform: 'translateZ(0)' }}
    />
  );
};
