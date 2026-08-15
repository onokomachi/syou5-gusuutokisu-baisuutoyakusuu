/**
 * ボス戦モード（インフェルノ限定・スペシャルステージ）。
 * wari-hissann3 の「天空神」ボス戦システム（動画演出・ティア・RPS風の2本立てシステム）を
 * そのまま移植したもの。
 * - ボスは プレイヤーの解答状況と無関係に、難易度ごとの一定間隔で行動ゲージが満ちて
 *   通常攻撃／タメ攻撃（必殺技・予告あり）を自動発動する。
 * - プレイヤーは問題に正解すると「アクションポイント」を獲得し、貯めた分をいつでも使って
 *   「こうげき／かいふく／ガード（次の1回のボス攻撃を防ぐ）」から最適な行動を選ぶ。
 * 出題は本番テストと同じ大問プールから、苦手なスキルほど出やすいように重みづけして選ぶ。
 * Normal / Hard / GOD の3ティアで、ボスの行動間隔・タメ攻撃の頻度・ダメージ量が変わる。
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ChevronLeft, Cloud, Heart, Home, Lock, RotateCcw, Shield, ShieldCheck, Skull, Swords, Trophy, Zap,
} from 'lucide-react';
import { useProgressStore } from '../../store/progressStore';
import { useBadgeRatio } from '../../lib/useBadgeRatio';
import { THEME_UNLOCK, isThemeUnlocked } from '../../lib/themeUnlock';
import {
  BOSS_TIERS, BossTier, BossActionKind, BossQuestion, pickBossQuestions, rollBossAction, damageToPlayer,
} from '../../lib/bossBattle';
import { playCorrect, playClear, playSoftTry } from '../../lib/sound';
import { GenericRound } from '../shared/GenericModule';

interface Props { onExit: () => void; }

const BOSS_NAME = '天空神';
const VIDEO = {
  idle: '/videos/boss/idle.mp4',
  normal: '/videos/boss/attack-normal.mp4',
  special: '/videos/boss/attack-special.mp4',
};

type Phase = 'INTRO' | 'BATTLE' | 'RESULT';
type AttackKind = 'normal' | 'special' | null;
type ActionChoice = 'attack' | 'heal' | 'guard';
type FeedbackKind = 'boss-dmg' | 'heal' | 'guard-set' | 'guard-block' | 'player-dmg' | 'point' | 'nopoint';

/* ---------------- HPバー ---------------- */
const HpBar: React.FC<{ label: string; hp: number; max: number; color: string; icon: React.ReactNode }> = ({ label, hp, max, color, icon }) => {
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1 text-white drop-shadow">
        <span className="flex items-center gap-1.5 font-black text-sm">{icon}{label}</span>
        <span className="font-black text-sm tabular-nums">{Math.max(0, Math.round(hp))} / {max}</span>
      </div>
      <div className="h-3.5 rounded-full bg-black/50 border border-white/20 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
};

/* ---------------- アクションボタン ----------------
 * コンポーネント本体の中で定義すると、100ms間隔のタイマーで再レンダーされるたびに
 * 「まったく新しいコンポーネント型」として扱われ、DOMが毎回作り直されてしまい、
 * タップの途中でボタンが差し替わって反応しない（＝2回押さないと効かない）不具合になる。
 * モジュール直下に固定して、同じコンポーネント型として再利用されるようにする。 */
const ActionButton: React.FC<{ action: ActionChoice; icon: React.ReactNode; label: string; disabled: boolean; onUse: (action: ActionChoice) => void }> = ({ action, icon, label, disabled, onUse }) => (
  <button
    onClick={() => onUse(action)}
    disabled={disabled}
    className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-2xl font-black text-xs transition-all ${
      disabled ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/15 text-white hover:bg-white/25 active:scale-95 shadow-md'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export const BossBattleModule: React.FC<Props> = ({ onExit }) => {
  const ratio = useBadgeRatio();
  const unlocked = isThemeUnlocked('inferno', ratio);
  const mastery = useProgressStore((s) => s.mastery);
  const recordResult = useProgressStore((s) => s.recordResult);

  const [phase, setPhase] = useState<Phase>('INTRO');
  const [tier, setTier] = useState<BossTier>('normal');
  const [questions, setQuestions] = useState<BossQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [questionsExhausted, setQuestionsExhausted] = useState(false);
  const [playerHp, setPlayerHp] = useState(100);
  const [bossHp, setBossHp] = useState(100);
  const [actionPoints, setActionPoints] = useState(0);
  const [guardActive, setGuardActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [resolveKey, setResolveKey] = useState(0);
  const [bossGaugePct, setBossGaugePct] = useState(0);
  const [bossTelegraph, setBossTelegraph] = useState<BossActionKind | null>(null);
  const [attackPlaying, setAttackPlaying] = useState<AttackKind>(null);
  const [feedback, setFeedback] = useState<{ kind: FeedbackKind; text: string } | null>(null);
  const [outcome, setOutcome] = useState<'win' | 'lose' | null>(null);

  const resolvedRef = useRef(false);
  const gaugeRef = useRef(0);
  const telegraphedRef = useRef(false);
  const pendingActionRef = useRef<BossActionKind>('normal');
  // 割り込みタイマー（ボスの行動ゲージ）は複数レンダーをまたいで動き続けるため、
  // 最新のstateを常にrefへミラーして stale closure を避ける。
  const liveRef = useRef({ phase, guardActive, playerHp, attackPlaying });
  liveRef.current = { phase, guardActive, playerHp, attackPlaying };

  const config = BOSS_TIERS[tier];
  const q = questions[qIndex];

  const MAX_POINTS = 5;

  /* 問題が切り替わるたびにタイマーをリセットして開始（1問ごとの制限時間。ボスの行動とは独立） */
  useEffect(() => {
    if (phase !== 'BATTLE' || !q || questionsExhausted) return;
    resolvedRef.current = false;
    setTimeLeft(q.timeLimitSec);
    const start = Date.now();
    const id = setInterval(() => {
      const left = Math.max(0, q.timeLimitSec - (Date.now() - start) / 1000);
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(id);
        handleTimeout();
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qIndex, resolveKey, questionsExhausted]);

  /* ボスの行動ゲージ。プレイヤーの解答状況とは無関係に、一定間隔で満ちて自動発動する。 */
  useEffect(() => {
    if (phase !== 'BATTLE') return;
    gaugeRef.current = 0;
    telegraphedRef.current = false;
    setBossGaugePct(0);
    setBossTelegraph(null);
    const cycleMs = config.actionCycleSec * 1000;
    const id = setInterval(() => {
      if (liveRef.current.phase !== 'BATTLE' || liveRef.current.attackPlaying) return;
      gaugeRef.current += 100 / cycleMs;
      if (gaugeRef.current >= 0.6 && !telegraphedRef.current) {
        telegraphedRef.current = true;
        pendingActionRef.current = rollBossAction(tier);
        setBossTelegraph(pendingActionRef.current);
      }
      if (gaugeRef.current >= 1) {
        gaugeRef.current = 0;
        telegraphedRef.current = false;
        setBossTelegraph(null);
        resolveBossAction(pendingActionRef.current);
      }
      setBossGaugePct(Math.min(1, gaugeRef.current));
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, tier]);

  const startBattle = (t: BossTier) => {
    const qs = pickBossQuestions(t, mastery);
    setTier(t);
    setQuestions(qs);
    setQIndex(0);
    setQuestionsExhausted(false);
    setPlayerHp(BOSS_TIERS[t].hp);
    setBossHp(BOSS_TIERS[t].hp);
    setActionPoints(0);
    setGuardActive(false);
    setOutcome(null);
    setResolveKey((k) => k + 1);
    setPhase('BATTLE');
  };

  const finishBattle = (win: boolean) => {
    if (liveRef.current.phase !== 'BATTLE') return; // 勝敗が同時に成立しても二重記録しない
    setOutcome(win ? 'win' : 'lose');
    recordResult({
      moduleId: 'boss-battle',
      skillId: `boss-${tier}`,
      label: `ボス戦（${BOSS_TIERS[tier].label}）${win ? '勝利' : '敗北'}`,
      correct: win,
    });
    if (win) {
      playClear();
      confetti({ particleCount: 180, spread: 80, origin: { y: 0.5 } });
    }
    setPhase('RESULT');
  };

  /* ---------------- ボス側：行動ゲージが満ちたときに自動発動 ---------------- */
  const resolveBossAction = (action: BossActionKind) => {
    setAttackPlaying(action === 'charge' ? 'special' : 'normal');
    if (liveRef.current.guardActive) {
      setGuardActive(false);
      setFeedback({ kind: 'guard-block', text: action === 'charge' ? '必殺技を ガードした！' : 'こうげきを ガードした！' });
      playCorrect();
    } else {
      const dmg = damageToPlayer(tier, action);
      const nextHp = Math.max(0, liveRef.current.playerHp - dmg);
      setPlayerHp(nextHp);
      setFeedback({ kind: 'player-dmg', text: `${action === 'charge' ? '必殺技を うけた！' : 'こうげきを うけた！'} -${dmg}` });
      playSoftTry();
    }
    // フィードバックの文言だけ短めに消す。攻撃動画（約10秒）は onEnded が来るまで最後まで流す。
    setTimeout(() => setFeedback(null), 1600);
    // 動画の onEnded が何らかの理由で発火しなかったときの保険（実際の動画は10秒強）
    setTimeout(() => {
      setAttackPlaying((prev) => (prev !== null ? null : prev));
      if (liveRef.current.playerHp <= 0) finishBattle(false);
    }, 12000);
  };

  /* ---------------- プレイヤー側：アクションポイントを使って行動を選ぶ ---------------- */
  const useAction = (action: ActionChoice) => {
    if (phase !== 'BATTLE' || actionPoints < 1) return;
    if (action === 'guard' && guardActive) return; // ガードは同時に1回分だけ
    setActionPoints((p) => p - 1);
    if (action === 'attack') {
      const dmg = config.attackDamageToBoss;
      const nextBossHp = Math.max(0, bossHp - dmg);
      setBossHp(nextBossHp);
      playCorrect();
      setFeedback({ kind: 'boss-dmg', text: `-${dmg}！ こうげき せいこう！` });
      setTimeout(() => { setFeedback(null); if (nextBossHp <= 0) finishBattle(true); }, 900);
    } else if (action === 'heal') {
      const healed = Math.min(config.hp, playerHp + config.healAmount);
      setPlayerHp(healed);
      playCorrect();
      setFeedback({ kind: 'heal', text: `+${config.healAmount}！ かいふく！` });
      setTimeout(() => setFeedback(null), 900);
    } else {
      setGuardActive(true);
      playCorrect();
      setFeedback({ kind: 'guard-set', text: 'ガード たいせい！ つぎの こうげきを ふせぐ' });
      setTimeout(() => setFeedback(null), 900);
    }
  };

  /* ---------------- 出題：正解でアクションポイントを獲得（直接ダメージにはしない） ---------------- */
  const advanceQuestion = () => {
    if (qIndex >= questions.length - 1) { setQuestionsExhausted(true); return; }
    setQIndex((i) => i + 1);
    setResolveKey((k) => k + 1);
  };

  const handleCorrect = () => {
    if (resolvedRef.current || !q) return;
    resolvedRef.current = true;
    playCorrect();
    setActionPoints((p) => Math.min(MAX_POINTS, p + q.pointReward));
    setFeedback({ kind: 'point', text: `せいかい！ ポイント +${q.pointReward}` });
    setTimeout(() => { setFeedback(null); advanceQuestion(); }, 700);
  };

  const handleTimeout = () => {
    if (resolvedRef.current || !q) return;
    resolvedRef.current = true;
    playSoftTry();
    setFeedback({ kind: 'nopoint', text: 'ポイント ならず…' });
    setTimeout(() => { setFeedback(null); advanceQuestion(); }, 700);
  };

  /* ---------------- INTRO（ティア選択・未解放ならロック） ---------------- */
  if (phase === 'INTRO') {
    const req = THEME_UNLOCK.inferno.label;
    return (
      <div className="w-full h-full overflow-y-auto bg-[#03060f]">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button onClick={onExit} className="flex items-center gap-2 text-white/70 hover:text-white font-bold px-3 py-2 rounded-xl hover:bg-white/10 transition-colors mb-2">
            <ChevronLeft size={24} /> ホームへ
          </button>

          <div className="text-center mt-4 mb-8">
            <div className="w-24 h-24 rounded-3xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mx-auto mb-4 ring-2 ring-cyan-400/40">
              <Cloud size={48} />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">ボス戦：{BOSS_NAME}</h1>
            <p className="text-white/70 font-bold">雷を まとった 天空神と、正解で貯めたポイントを つかって たたかおう！</p>
          </div>

          {!unlocked && (
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-8 text-center">
              <Lock size={40} className="mx-auto mb-4 text-white/50" />
              <p className="text-white font-black text-lg mb-1">まだ 挑戦できません</p>
              <p className="text-white/60 font-bold text-sm">テーマ「インフェルノ」を 解放すると 挑戦できます（{req}）</p>
              <p className="text-white/40 font-bold text-xs mt-2">いまの バッジ獲得率：{Math.round(ratio * 100)}%</p>
            </div>
          )}

          {unlocked && (
            <div className="space-y-4">
              {(['normal', 'hard', 'god'] as BossTier[]).map((t) => {
                const c = BOSS_TIERS[t];
                const tone = t === 'normal' ? 'from-emerald-500 to-teal-500' : t === 'hard' ? 'from-amber-500 to-orange-500' : 'from-indigo-600 to-violet-700';
                return (
                  <button
                    key={t}
                    onClick={() => startBattle(t)}
                    className={`w-full p-5 rounded-[24px] bg-gradient-to-r ${tone} text-white shadow-lg hover:shadow-xl text-left transition-all active:scale-[0.99] flex items-center gap-4`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                      <Swords size={28} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xl font-black">{c.label}</div>
                      <div className="text-sm text-white/85 font-medium">{c.subtitle}</div>
                      <div className="text-xs text-white/70 font-bold mt-1">さいだい{c.questionCount}問・表と裏を まぜて出題</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- RESULT ---------------- */
  if (phase === 'RESULT') {
    const win = outcome === 'win';
    return (
      <div className="w-full h-full overflow-y-auto bg-[#03060f]">
        <div className="max-w-xl mx-auto px-4 py-10 text-center">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 ${win ? 'bg-amber-500/20 text-amber-400 ring-2 ring-amber-400/40' : 'bg-white/10 text-white/60 ring-2 ring-white/20'}`}>
            {win ? <Trophy size={48} /> : <Skull size={48} />}
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-2">{win ? `${BOSS_NAME}を たおした！` : 'やられてしまった…'}</h1>
          <p className="text-white/70 font-bold mb-8">
            {win ? `${config.label} クリア！ すごい実力だ！` : 'おしい！ もう一度 ちょうせんしてみよう。'}
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={() => startBattle(tier)} className="flex items-center justify-center gap-2 py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95">
              <RotateCcw size={20} /> もういちど（{config.label}）
            </button>
            <button onClick={() => setPhase('INTRO')} className="flex items-center justify-center gap-2 py-4 bg-white/10 hover:bg-white/15 text-white rounded-2xl font-black text-lg transition-all active:scale-95">
              ティアを えらびなおす
            </button>
            <button onClick={onExit} className="flex items-center justify-center gap-2 py-4 bg-white/10 hover:bg-white/15 text-white rounded-2xl font-black text-lg transition-all active:scale-95">
              <Home size={20} /> ホームへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- BATTLE ---------------- */
  const timePct = q ? Math.max(0, Math.min(100, (timeLeft / q.timeLimitSec) * 100)) : 0;
  const urgent = !questionsExhausted && timePct < 25;
  const gaugePct = Math.round(bossGaugePct * 100);
  const gaugeUrgent = bossGaugePct >= 0.6;

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      {/* ボス動画レイヤー */}
      <video src={VIDEO.idle} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
      <AnimatePresence>
        {attackPlaying && (
          <motion.video
            key={attackPlaying}
            src={attackPlaying === 'special' ? VIDEO.special : VIDEO.normal}
            autoPlay
            muted
            playsInline
            onEnded={() => {
              setAttackPlaying(null);
              if (liveRef.current.playerHp <= 0) finishBattle(false);
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </AnimatePresence>

      {/* 残り時間が少ないときの琥珀色ビネット（このもんだいの締め切りを知らせる。被弾とは無関係） */}
      {urgent && !attackPlaying && (
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 110px 36px rgba(245,158,11,0.35)' }} />
      )}

      {/* 画面全体をおおう縦並びレイアウト：上＝HP・ゲージ、下＝行動＆解答パネル。
          予告バナー・演出フィードバックはレイアウトの高さを取らない絶対配置にして、
          その分の高さを解答パネル（キーパッドなど）にゆずる。 */}
      <div className="absolute inset-0 z-20 flex flex-col pointer-events-none">
        {/* ヘッダ */}
        <div className="relative p-3 md:p-4 bg-gradient-to-b from-black/75 to-transparent pointer-events-auto shrink-0">
          <div className="max-w-3xl mx-auto space-y-1.5">
            <div className="flex items-center justify-between">
              <button onClick={onExit} className="flex items-center gap-1 text-white/80 hover:text-white font-bold text-sm">
                <ChevronLeft size={18} /> やめる
              </button>
              <span className="text-white/80 font-black text-xs">{config.label}　{questionsExhausted ? 'もんだい終了' : `${qIndex + 1}/${questions.length}問`}</span>
            </div>
            <HpBar label={BOSS_NAME} hp={bossHp} max={config.hp} color="bg-gradient-to-r from-cyan-400 to-indigo-500" icon={<Cloud size={16} />} />
            <div>
              <div className="h-1.5 rounded-full bg-black/40 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${gaugeUrgent ? 'bg-violet-400' : 'bg-white/50'}`}
                  style={{ width: `${gaugePct}%` }}
                />
              </div>
            </div>
            <HpBar label="あなた" hp={playerHp} max={config.hp} color="bg-gradient-to-r from-emerald-400 to-teal-400" icon={<Heart size={16} />} />
          </div>

          {/* 予告バナー・演出フィードバック（ヘッダの直下に重ねる。高さは消費しない） */}
          <div className="absolute top-full inset-x-0 mt-2 flex flex-col items-center gap-2 px-4 z-10">
            <AnimatePresence>
              {bossTelegraph && !attackPlaying && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-white font-black text-xs md:text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 ${
                    bossTelegraph === 'charge' ? 'bg-violet-600/90' : 'bg-black/60'
                  }`}
                >
                  <Zap size={16} />
                  {bossTelegraph === 'charge' ? '天空神が 必殺技を ためている！ ガードで そなえよう！' : '天空神が 力を ためている…'}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className={`px-6 py-3 rounded-2xl font-black text-lg md:text-xl shadow-2xl ${
                    feedback.kind === 'boss-dmg' ? 'bg-emerald-500 text-white'
                      : feedback.kind === 'heal' ? 'bg-teal-500 text-white'
                      : feedback.kind === 'guard-set' || feedback.kind === 'guard-block' ? 'bg-sky-500 text-white'
                      : feedback.kind === 'player-dmg' ? 'bg-rose-600 text-white'
                      : feedback.kind === 'point' ? 'bg-amber-500 text-white'
                      : 'bg-slate-600 text-white'
                  }`}
                >
                  {feedback.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* フッタ：行動選択＋タイマー＋解答パネル。ヘッダ以外の残り高さをすべてここに割り当てる
            （バナーを絶対配置にしたぶん、キーパッドなど背の高いコンテンツにも高さをゆずれる）。 */}
        <div className="flex-1 min-h-0 p-3 md:p-5 pointer-events-auto flex flex-col">
          <div className="mx-auto w-full flex-1 min-h-0 flex flex-col max-w-md portrait:max-w-xl">
            <div className="flex items-center gap-2 mb-2 shrink-0">
              <span className="flex items-center gap-1 bg-amber-400/90 text-slate-900 text-xs font-black px-3 py-1.5 rounded-full shrink-0">
                <Zap size={14} /> ポイント {actionPoints}
              </span>
              <ActionButton action="attack" icon={<Swords size={18} />} label="こうげき" disabled={actionPoints < 1} onUse={useAction} />
              <ActionButton action="heal" icon={<Heart size={18} />} label="かいふく" disabled={actionPoints < 1} onUse={useAction} />
              <ActionButton action="guard" icon={guardActive ? <ShieldCheck size={18} /> : <Shield size={18} />} label={guardActive ? 'ガード中' : 'ガード'} disabled={actionPoints < 1 || guardActive} onUse={useAction} />
            </div>

            {!questionsExhausted && (
              <>
                <div className="h-1.5 rounded-full bg-black/40 overflow-hidden mb-2 shrink-0">
                  <div
                    className={`h-full rounded-full transition-all duration-100 ${urgent ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${timePct}%` }}
                  />
                </div>
                {/* 残り高さいっぱいまで使い、横スクロールも許可して マスの取りこぼしタップを防ぐ */}
                <div className="bg-surface/95 backdrop-blur-md rounded-[26px] shadow-2xl border border-line overflow-y-auto overflow-x-auto flex-1 min-h-0">
                  <div key={resolveKey}>
                    {q && (
                      <GenericRound
                        level={q.step.level}
                        problem={q.problem}
                        moduleId={q.step.moduleId}
                        generate={() => q.problem}
                        accent={{ border: 'hover:border-cyan-400', bg: 'bg-cyan-500 border-cyan-500', button: 'bg-cyan-500 hover:bg-cyan-600' }}
                        onNext={() => {}}
                        onResult={() => handleCorrect()}
                        nextLabel="つぎへ"
                      />
                    )}
                  </div>
                </div>
              </>
            )}
            {questionsExhausted && (
              <div className="bg-surface/95 backdrop-blur-md rounded-[26px] shadow-2xl border border-line p-6 text-center shrink-0">
                <p className="font-black text-content mb-1">もんだいは ぜんぶ といた！</p>
                <p className="text-sm text-muted font-bold">のこった ポイントを つかって、天空神を たおそう！</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
