/**
 * インフェルノ限定「ボス戦：天空神」モードの純粋ロジック。
 * wari-hissann3 のボス戦システムを移植したもの（ティア設定・重みづけ抽選・
 * ボス独立タイマー＋プレイヤーはアクションポイントで行動選択、という仕組みは完全に同一）。
 * 本番テストと同じ出題プール（TEST_STEPS）から、習熟度が低いスキルほど出やすいように
 * 重みつきで問題を選ぶ。ボスはプレイヤーの解答状況と無関係に一定間隔で通常攻撃／タメ攻撃を自動発動し、
 * プレイヤーは問題に正解して貯めたアクションポイントを使って「こうげき／かいふく／ガード」を選ぶ。
 * UI（動画・HPバー・ゲージ表示）は BossBattleModule 側が担当する。
 *
 * 移植にあたり baseSeconds() だけは、このアプリの Problem 型（judge/choice/multi/numeric）に
 * 合わせて作り直した（元アプリの問題種別 mental/rules/estimate/check/word/error/hissan とは
 * 出題形式が異なるため）。ティアの数値（HP・ダメージ・行動間隔など）は元アプリと完全に一致させている。
 */
import { TEST_STEPS, TestStep } from './testConfig';
import { Problem } from './problems';

export type BossTier = 'normal' | 'hard' | 'god';

export interface TierConfig {
  id: BossTier;
  label: string;
  subtitle: string;
  /** 1回のバトルで出題される最大問題数（ボスを倒せば途中で終わる） */
  questionCount: number;
  /** 基準タイム（baseSeconds）に掛ける倍率。小さいほど1問の制限時間がきびしい。 */
  timeMultiplier: number;
  hp: number;
  /** ボスの行動ゲージが1周してから次の行動を起こすまでの秒数。短いほど攻撃が速い。 */
  actionCycleSec: number;
  /** ボスの行動が「タメ攻撃（必殺技）」になる確率（0..1）。高いほど大技が多い。 */
  chargeChance: number;
  /** ボスの攻撃が ガードされなかったときに プレイヤーが受けるダメージ */
  attackDamageToPlayer: { normal: number; charge: number };
  /** プレイヤーが「こうげき」を選んだときに ボスへ与えるダメージ */
  attackDamageToBoss: number;
  /** プレイヤーが「かいふく」を選んだときに 回復するHP量 */
  healAmount: number;
}

export const BOSS_TIERS: Record<BossTier, TierConfig> = {
  normal: {
    id: 'normal', label: 'Normal', subtitle: 'ゆっくり戦えるれんしゅう戦',
    questionCount: 15, timeMultiplier: 1.4, hp: 100,
    actionCycleSec: 45, chargeChance: 0.15,
    attackDamageToPlayer: { normal: 12, charge: 26 },
    attackDamageToBoss: 15, healAmount: 20,
  },
  hard: {
    id: 'hard', label: 'Hard', subtitle: '本番テストと同じくらいのペース',
    questionCount: 25, timeMultiplier: 1.0, hp: 100,
    actionCycleSec: 30, chargeChance: 0.25,
    attackDamageToPlayer: { normal: 16, charge: 34 },
    attackDamageToBoss: 11, healAmount: 16,
  },
  god: {
    id: 'god', label: 'GOD', subtitle: '本番テストより速い、真の実力者むけ',
    questionCount: 19, timeMultiplier: 0.7, hp: 100,
    actionCycleSec: 20, chargeChance: 0.35,
    attackDamageToPlayer: { normal: 20, charge: 44 },
    attackDamageToBoss: 9, healAmount: 12,
  },
};

export interface SkillStat { attempts: number; corrects: number }

/** 習熟度が低い（正答率が低い）スキルほど大きい重みを返す。未挑戦は標準の重み。 */
export function weightForSkill(skillId: string, mastery: Record<string, SkillStat>): number {
  const m = mastery[skillId];
  if (!m || m.attempts === 0) return 1;
  const accuracy = m.corrects / m.attempts;
  return 1 + (1 - accuracy) * 3;
}

/** 重みに比例した確率で1件だけ選ぶ（重い項目ほど選ばれやすい）。 */
function weightedPick<T>(items: { item: T; weight: number }[]): T {
  const total = items.reduce((a, x) => a + x.weight, 0);
  let r = Math.random() * total;
  for (const x of items) {
    r -= x.weight;
    if (r <= 0) return x.item;
  }
  return items[items.length - 1].item;
}

/**
 * 問題の回答形式ごとの「素の」制限時間（秒）。
 * 判定・選択は短め、書き出し・多段階・ベン図など 手を動かす量が多い形式は
 * 時間切れが多発しないよう 大きめに配分する。
 */
function baseSeconds(p: Problem): number {
  switch (p.kind) {
    case 'judge': return 12;
    case 'choice': return 16;
    case 'numeric': return 20;
    case 'multi': return 26;
    case 'sequence': return 34;
    case 'list': return p.listExact ? 38 : 48; // 「ぜんぶ書く」は個数が多いぶん長く
    case 'steps': return 45;
    case 'venn': return 55;
    case 'pairs': return 60;
  }
}

export interface BossQuestion {
  step: TestStep;
  problem: Problem;
  /** 配点10点の大問（裏面中心）＝解くのに時間がかかる分、正解時のポイントも多い */
  isBig: boolean;
  timeLimitSec: number;
  /** 正解でもらえるアクションポイント（ふつう1・大きい問題は2） */
  pointReward: number;
}

/** ティアと習熟度データから、1バトル分の出題列をつくる（表・裏を混ぜて出題）。 */
export function pickBossQuestions(tier: BossTier, mastery: Record<string, SkillStat>): BossQuestion[] {
  const config = BOSS_TIERS[tier];
  const pool = TEST_STEPS;
  const weighted = pool.map((s) => ({ item: s, weight: weightForSkill(s.level, mastery) }));

  // 重みに比例した確率で毎回1問ずつ選ぶ（苦手なスキルほど出やすい）。
  // 同じスキルが連続しがちなときは1回だけ引き直して、極端な連続出題をやわらげる。
  const order: TestStep[] = [];
  let lastLevel: string | null = null;
  for (let i = 0; i < config.questionCount; i++) {
    let picked = weightedPick(weighted);
    if (picked.level === lastLevel && pool.length > 1) {
      picked = weightedPick(weighted);
    }
    order.push(picked);
    lastLevel = picked.level;
  }

  return order.map((step) => {
    const problem = step.gen();
    const isBig = step.points >= 10;
    const base = baseSeconds(problem) * (isBig ? 1.4 : 1);
    const timeLimitSec = Math.max(8, Math.round(base * config.timeMultiplier));
    return { step, problem, isBig, timeLimitSec, pointReward: isBig ? 2 : 1 };
  });
}

export type BossActionKind = 'normal' | 'charge';

/** ボスの行動ゲージが満タンになったとき、次の行動が通常攻撃かタメ攻撃かを抽選する。 */
export function rollBossAction(tier: BossTier): BossActionKind {
  return Math.random() < BOSS_TIERS[tier].chargeChance ? 'charge' : 'normal';
}

/** ボスの攻撃がガードされなかったときに プレイヤーが受けるダメージ。 */
export function damageToPlayer(tier: BossTier, action: BossActionKind): number {
  const cfg = BOSS_TIERS[tier];
  return action === 'charge' ? cfg.attackDamageToPlayer.charge : cfg.attackDamageToPlayer.normal;
}
