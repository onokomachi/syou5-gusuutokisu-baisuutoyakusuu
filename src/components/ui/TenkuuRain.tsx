/**
 * 天空神テーマ専用の背景：黄昏の大空を 雲がゆっくり流れ、天から金色の光条が差し、
 * 光の粒が きらめく。ときおり ゼウスを思わせる水色の稲妻が 雲間から走る。
 * theme === 'tenkuu' のときだけ描画する。
 */
import React, { useEffect, useRef } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

interface CloudPuff {
  x: number;
  y: number;
  r: number;
  vx: number;
  alpha: number;
}

interface Mote {
  x: number;
  y: number;
  r: number;
  tw: number;
  twSpeed: number;
  vy: number;
}

interface Bolt {
  main: { x: number; y: number }[];
  branches: { x: number; y: number }[][];
  age: number;     // ms 経過
  duration: number; // 表示しつづける時間(ms)
}

/** 上から下へ、ランダムに折れ曲がる稲妻の経路を作る（中点変位法）。 */
function buildBoltPath(x0: number, y0: number, x1: number, y1: number, depth: number): { x: number; y: number }[] {
  if (depth <= 0) return [{ x: x0, y: y0 }, { x: x1, y: y1 }];
  const mx = (x0 + x1) / 2 + (Math.random() - 0.5) * (y1 - y0) * 0.3;
  const my = (y0 + y1) / 2;
  const left = buildBoltPath(x0, y0, mx, my, depth - 1);
  const right = buildBoltPath(mx, my, x1, y1, depth - 1);
  return [...left, ...right.slice(1)];
}

/** 画面を大きく使う、ダイナミックな1本の稲妻（本線＋数本の枝、枝からさらに小枝）を作る。 */
function spawnOneBolt(canvas: HTMLCanvasElement): Bolt {
  // 天の高いところから、画面の下（地上）まで一気に貫くスケール
  const x0 = Math.random() * canvas.width;
  const y0 = canvas.height * (-0.05 + Math.random() * 0.1);
  const x1 = x0 + (Math.random() - 0.5) * canvas.width * 1.2;
  const y1 = canvas.height * (0.92 + Math.random() * 0.18);
  const main = buildBoltPath(x0, y0, x1, y1, 6);

  // 本線から2〜5本、大きく広がる枝を生やす
  const branchCount = 2 + Math.floor(Math.random() * 4);
  const branches: { x: number; y: number }[][] = [];
  for (let i = 0; i < branchCount; i++) {
    const startIdx = Math.floor(main.length * (0.12 + Math.random() * 0.55));
    const start = main[startIdx];
    const bx = start.x + (Math.random() - 0.5) * canvas.width * 0.7;
    const by = start.y + (canvas.height - start.y) * (0.35 + Math.random() * 0.5);
    const branch = buildBoltPath(start.x, start.y, bx, by, 4);
    branches.push(branch);

    // 半分くらいの確率で、枝からさらに小枝を1本（フラクタルな迫力を足す）
    if (Math.random() < 0.6 && branch.length > 2) {
      const subIdx = Math.floor(branch.length * (0.2 + Math.random() * 0.5));
      const subStart = branch[subIdx];
      const sx = subStart.x + (Math.random() - 0.5) * canvas.width * 0.3;
      const sy = subStart.y + (canvas.height - subStart.y) * (0.25 + Math.random() * 0.35);
      branches.push(buildBoltPath(subStart.x, subStart.y, sx, sy, 3));
    }
  }

  return { main, branches, age: 0, duration: 340 + Math.random() * 160 };
}

/** 1〜4本、画面のいろいろな場所に ランダムな本数で まとめて走らせる。 */
function spawnBolts(canvas: HTMLCanvasElement): Bolt[] {
  const r = Math.random();
  const count = r < 0.35 ? 1 : r < 0.65 ? 2 : r < 0.88 ? 3 : 4;
  return Array.from({ length: count }, () => spawnOneBolt(canvas));
}

export const TenkuuRain: React.FC = () => {
  const theme = useSettingsStore((s) => s.theme);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (theme !== 'tenkuu') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let clouds: CloudPuff[] = [];
    let motes: Mote[] = [];
    let bolts: Bolt[] = [];
    let boltTimer = 500 + Math.random() * 900; // 最初の一発は すぐに

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      clouds = Array.from({ length: 14 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height * (0.45 + Math.random() * 0.55),
        r: 80 + Math.random() * 180,
        vx: 0.08 + Math.random() * 0.22,
        alpha: 0.05 + Math.random() * 0.08,
      }));
      motes = Array.from({ length: Math.min(140, Math.floor(canvas.width / 10)) }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 0.5 + Math.random() * 1.6,
        tw: Math.random() * Math.PI * 2,
        twSpeed: 0.02 + Math.random() * 0.05,
        vy: 0.05 + Math.random() * 0.2,
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    let last = 0;
    const interval = 33; // ~30fps

    const draw = (t: number) => {
      rafRef.current = requestAnimationFrame(draw);
      if (t - last < interval) return;
      last = t;

      // 黄昏の空のグラデーション
      const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
      sky.addColorStop(0, '#020a18');
      sky.addColorStop(0.5, '#041022');
      sky.addColorStop(1, '#0a2038');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 稲妻のタイミング管理: 短い間隔で くり返し発生させ、いろいろな場所に
      // 複数本が ランダムな本数で 走るようにする（前の稲妻が消える前でも 重ねて発生できる）
      boltTimer -= interval;
      if (boltTimer <= 0 && bolts.length < 8) {
        bolts = [...bolts, ...spawnBolts(canvas)];
        boltTimer = 900 + Math.random() * 1600;
      }
      if (bolts.length > 0) {
        for (const b of bolts) b.age += interval;
        bolts = bolts.filter((b) => b.age <= b.duration);
      }

      // 稲妻がひかった瞬間、空ぜんたいを 水色に大きくフラッシュさせる（画面を覆うほどの一撃感）
      let maxFlash = 0;
      for (const b of bolts) {
        const t01 = b.age / b.duration;
        // 立ち上がりは一瞬、その後すぐ減衰（本物の雷光に近い揺らぎ）
        const flash = Math.max(0, 1 - t01) * (0.5 + 0.5 * Math.sin(t01 * 30));
        maxFlash = Math.max(maxFlash, flash);
      }
      if (maxFlash > 0) {
        ctx.fillStyle = `rgba(160, 225, 255, ${maxFlash * 0.32})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 天からの金色の光条（ゆっくり明滅・ゆらぐ）
      ctx.globalCompositeOperation = 'lighter';
      const rayCount = 5;
      for (let i = 0; i < rayCount; i++) {
        const cx = canvas.width * (0.12 + (i / (rayCount - 1)) * 0.76);
        const swing = Math.sin(t * 0.0003 + i * 1.7) * canvas.width * 0.05;
        const a = 0.05 + Math.max(0, Math.sin(t * 0.0006 + i * 2.1)) * 0.06;
        const w = canvas.width * (0.05 + (i % 3) * 0.02);
        const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
        g.addColorStop(0, `rgba(255, 225, 140, ${a})`);
        g.addColorStop(1, 'rgba(255, 225, 140, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.25 + swing, 0);
        ctx.lineTo(cx + w * 0.25 + swing, 0);
        ctx.lineTo(cx + w + swing * 1.6, canvas.height);
        ctx.lineTo(cx - w + swing * 1.6, canvas.height);
        ctx.closePath();
        ctx.fill();
      }

      // 金色の光の粒（ゆっくり上へただよう）
      for (const m of motes) {
        m.tw += m.twSpeed;
        m.y -= m.vy;
        if (m.y < -5) { m.y = canvas.height + 5; m.x = Math.random() * canvas.width; }
        const a = 0.25 + Math.max(0, Math.sin(m.tw)) * 0.5;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 220, 130, ${a})`;
        ctx.fill();
      }

      // ゼウスを思わせる 水色の稲妻（本線＋枝分かれ。画面いっぱいに広がる巨大なグローを重ねて発光させる）
      if (bolts.length > 0) {
        // 画面サイズに応じて線の太さ・グローの大きさをスケール（スマホでも大画面でも見映えを保つ）
        const scale = Math.max(0.6, Math.min(2.4, Math.max(canvas.width, canvas.height) / 1100));
        const strokePath = (path: { x: number; y: number }[], width: number, color: string) => {
          if (path.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(path[0].x, path[0].y);
          for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.stroke();
        };

        for (const b of bolts) {
          const t01 = b.age / b.duration;
          const boltAlpha = Math.max(0, 1 - t01 * t01);

          // 着地点（地上へのインパクト）に大きな光の爆発を1つ
          const tip = b.main[b.main.length - 1];
          const burstR = 260 * scale * (0.6 + 0.4 * boltAlpha);
          const burst = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, burstR);
          burst.addColorStop(0, `rgba(230, 250, 255, ${boltAlpha * 0.55})`);
          burst.addColorStop(0.35, `rgba(150, 220, 255, ${boltAlpha * 0.28})`);
          burst.addColorStop(1, 'rgba(150, 220, 255, 0)');
          ctx.fillStyle = burst;
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, burstR, 0, Math.PI * 2);
          ctx.fill();

          // 経路ぜんたいに、画面を覆うほどの巨大な外側グロー（極太・低アルファ）→ 中間グロー → 白い芯、の順に重ねる
          strokePath(b.main, 46 * scale, `rgba(90, 190, 255, ${boltAlpha * 0.10})`);
          strokePath(b.main, 22 * scale, `rgba(110, 205, 255, ${boltAlpha * 0.20})`);
          strokePath(b.main, 9 * scale, `rgba(150, 220, 255, ${boltAlpha * 0.5})`);
          strokePath(b.main, 3.2 * scale, `rgba(235, 250, 255, ${boltAlpha * 0.95})`);
          for (const branch of b.branches) {
            strokePath(branch, 16 * scale, `rgba(100, 200, 255, ${boltAlpha * 0.14})`);
            strokePath(branch, 6 * scale, `rgba(140, 220, 255, ${boltAlpha * 0.4})`);
            strokePath(branch, 2 * scale, `rgba(210, 240, 255, ${boltAlpha * 0.75})`);
          }
        }
      }
      ctx.globalCompositeOperation = 'source-over';

      // 流れる雲（やわらかい多重円）
      for (const c of clouds) {
        c.x += c.vx;
        if (c.x - c.r > canvas.width) c.x = -c.r;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        g.addColorStop(0, `rgba(180, 205, 235, ${c.alpha})`);
        g.addColorStop(1, 'rgba(180, 205, 235, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [theme]);

  if (theme !== 'tenkuu') return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0 opacity-85"
      style={{ willChange: 'transform', transform: 'translateZ(0)' }}
    />
  );
};
