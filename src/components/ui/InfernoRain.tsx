/**
 * インフェルノテーマ専用の背景：画面の底から本物の炎のような「炎の舌」が
 * 何本も ゆらめきながら 立ちのぼり、溶岩だまりが脈動し、火の粉が舞い上がる。
 * theme === 'inferno' のときだけ描画する。
 */
import React, { useEffect, useRef } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

interface Ember {
  x: number;
  y: number;
  r: number;       // 火の粉の大きさ
  vy: number;      // 上昇速度
  sway: number;
  swaySpeed: number;
  life: number;    // 0..1（上へ行くほど消える）
  decay: number;
  heat: number;    // 0=深紅 1=白熱
}

interface FlameTongue {
  baseX: number;        // 根もとのx座標
  width: number;        // 根もとの幅
  heightBase: number;   // 平均の高さ
  heightAmp: number;    // 高さのゆらぎ幅
  swayAmp: number;      // 先端の左右ゆれ幅
  swaySpeed: number;
  swayPhase: number;
  flickerSpeed: number; // 高さの ちらつき速さ
  flickerPhase: number;
}

export const InfernoRain: React.FC = () => {
  const theme = useSettingsStore((s) => s.theme);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (theme !== 'inferno') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let embers: Ember[] = [];
    let backTongues: FlameTongue[] = [];
    let midTongues: FlameTongue[] = [];
    let frontTongues: FlameTongue[] = [];

    const spawnEmber = (): Ember => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 10 + Math.random() * 60,
      r: 1 + Math.random() * 2.8,
      vy: 0.8 + Math.random() * 2.4,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.02 + Math.random() * 0.05,
      life: 1,
      decay: 0.0015 + Math.random() * 0.004,
      heat: Math.random(),
    });

    const makeTongues = (count: number, widthScale: number, heightScale: number): FlameTongue[] =>
      Array.from({ length: count }, (_, i) => {
        const baseX = ((i + 0.5) / count) * canvas.width + (Math.random() - 0.5) * 30;
        return {
          baseX,
          width: (canvas.width / count) * widthScale * (0.8 + Math.random() * 0.5),
          heightBase: canvas.height * (0.22 + Math.random() * 0.14) * heightScale,
          heightAmp: canvas.height * 0.06 * heightScale,
          swayAmp: 14 + Math.random() * 22,
          swaySpeed: 0.0012 + Math.random() * 0.0018,
          swayPhase: Math.random() * Math.PI * 2,
          flickerSpeed: 0.003 + Math.random() * 0.004,
          flickerPhase: Math.random() * Math.PI * 2,
        };
      });

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const emberCount = Math.min(240, Math.floor((canvas.width * canvas.height) / 6000));
      embers = Array.from({ length: emberCount }, () => {
        const e = spawnEmber();
        e.y = Math.random() * canvas.height;
        e.life = Math.random();
        return e;
      });
      // 奥(背が高くて淡い)・中・手前(背が低くて濃い)の3層でゆらめく炎の舌を重ねる
      backTongues = makeTongues(Math.max(6, Math.floor(canvas.width / 130)), 1.6, 1.25);
      midTongues = makeTongues(Math.max(8, Math.floor(canvas.width / 100)), 1.3, 1.0);
      frontTongues = makeTongues(Math.max(10, Math.floor(canvas.width / 80)), 1.1, 0.72);
    };
    resize();
    window.addEventListener('resize', resize);

    let last = 0;
    const interval = 33; // ~30fps

    /** 1本の炎の舌を、先端が左右にゆれる しずく形（ベジェ曲線）で描く。 */
    const drawTongue = (tg: FlameTongue, t: number, alpha: number, colorCore: string, colorMid: string, colorTip: string) => {
      const flicker = 0.75 + 0.25 * Math.sin(t * tg.flickerSpeed + tg.flickerPhase) + 0.15 * Math.sin(t * tg.flickerSpeed * 2.3 + tg.flickerPhase);
      const height = Math.max(10, tg.heightBase + tg.heightAmp * Math.sin(t * tg.flickerSpeed * 0.6 + tg.flickerPhase)) * flicker;
      const tipDX = Math.sin(t * tg.swaySpeed + tg.swayPhase) * tg.swayAmp;
      const baseY = canvas.height + 6;
      const hw = tg.width / 2;
      const x = tg.baseX;

      ctx.beginPath();
      ctx.moveTo(x - hw, baseY);
      ctx.bezierCurveTo(
        x - hw * 1.15, baseY - height * 0.42,
        x - hw * 0.22 + tipDX * 0.5, baseY - height * 0.82,
        x + tipDX, baseY - height
      );
      ctx.bezierCurveTo(
        x + hw * 0.22 + tipDX * 0.5, baseY - height * 0.82,
        x + hw * 1.15, baseY - height * 0.42,
        x + hw, baseY
      );
      ctx.closePath();

      const g = ctx.createLinearGradient(x, baseY, x + tipDX * 0.3, baseY - height);
      g.addColorStop(0, colorCore.replace('ALPHA', String(alpha)));
      g.addColorStop(0.45, colorMid.replace('ALPHA', String(alpha * 0.85)));
      g.addColorStop(0.8, colorTip.replace('ALPHA', String(alpha * 0.5)));
      g.addColorStop(1, colorTip.replace('ALPHA', '0'));
      ctx.fillStyle = g;
      ctx.fill();
    };

    const draw = (t: number) => {
      rafRef.current = requestAnimationFrame(draw);
      if (t - last < interval) return;
      last = t;

      // 闇
      ctx.fillStyle = '#0a0100';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 底に脈動する溶岩だまりの光（横いっぱいに広がる暖色グロー）
      const pulse = 0.16 + Math.sin(t * 0.0012) * 0.06 + Math.sin(t * 0.0021) * 0.03;
      ctx.globalCompositeOperation = 'lighter';
      const lavaPool = ctx.createRadialGradient(
        canvas.width / 2, canvas.height + 40, canvas.width * 0.05,
        canvas.width / 2, canvas.height + 40, canvas.width * 0.75
      );
      lavaPool.addColorStop(0, `rgba(255, 140, 30, ${pulse})`);
      lavaPool.addColorStop(0.5, `rgba(255, 70, 0, ${pulse * 0.6})`);
      lavaPool.addColorStop(1, 'rgba(255, 40, 0, 0)');
      ctx.fillStyle = lavaPool;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 炎の舌（奥→中→手前の順に重ねて奥行きを出す）
      for (const tg of backTongues) {
        drawTongue(tg, t, 0.28, 'rgba(200, 30, 0, ALPHA)', 'rgba(255, 90, 0, ALPHA)', 'rgba(255, 180, 60, ALPHA)');
      }
      for (const tg of midTongues) {
        drawTongue(tg, t, 0.42, 'rgba(230, 40, 0, ALPHA)', 'rgba(255, 110, 10, ALPHA)', 'rgba(255, 200, 80, ALPHA)');
      }
      for (const tg of frontTongues) {
        drawTongue(tg, t, 0.62, 'rgba(255, 60, 0, ALPHA)', 'rgba(255, 150, 20, ALPHA)', 'rgba(255, 230, 140, ALPHA)');
      }

      // 根もとの白熱コア（いちばん熱い部分をひときわ明るく）
      const coreGlow = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - canvas.height * 0.18);
      coreGlow.addColorStop(0, `rgba(255, 210, 120, ${0.35 + pulse * 0.4})`);
      coreGlow.addColorStop(1, 'rgba(255, 210, 120, 0)');
      ctx.fillStyle = coreGlow;
      ctx.fillRect(0, canvas.height - canvas.height * 0.18, canvas.width, canvas.height * 0.18);

      // 火の粉（上昇して消える。熱いほど白く、冷めるほど赤く）
      for (const e of embers) {
        e.sway += e.swaySpeed;
        e.x += Math.sin(e.sway) * 0.8;
        e.y -= e.vy;
        e.life -= e.decay;
        if (e.life <= 0 || e.y < -10) Object.assign(e, spawnEmber());
        const a = Math.max(0, e.life) * 0.95;
        const g = Math.round(90 + e.heat * 140);
        const b = Math.round(e.heat * 90);
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, ${g}, ${b}, ${a})`;
        ctx.fill();
        // 明るい火の粉には小さな光暈をつけて リッチに見せる
        if (e.heat > 0.6) {
          const halo = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 4);
          halo.addColorStop(0, `rgba(255, 220, 160, ${a * 0.35})`);
          halo.addColorStop(1, 'rgba(255, 220, 160, 0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r * 4, 0, Math.PI * 2);
          ctx.fill();
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

  if (theme !== 'inferno') return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0 opacity-90"
      style={{ willChange: 'transform', transform: 'translateZ(0)' }}
    />
  );
};
