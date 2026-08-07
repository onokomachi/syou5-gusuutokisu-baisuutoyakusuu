/**
 * 単元「偶数と奇数」「倍数と約数」（小学5年）の問題ジェネレーター集。
 * 全レベルが同じ Problem 型（judge / choice / multi / numeric）を返すため、
 * 1つの GenericRound コンポーネントで全モジュールの出題・採点・フィードバックを扱える。
 *
 * - even-odd      : 偶数・奇数チェック（一の位判定・大きい数・0の性質・数列の穴うめ）
 * - even-odd-rule : 偶数・奇数の性質（たし算・かけ算の結果予想・逆算・つまずき）
 * - multiples     : 倍数みつけ（□番目の倍数・倍数判定・選択・範囲内の個数）
 * - lcm           : 公倍数・最小公倍数（求める・選ぶ・文章題・3数の発展）
 * - divisors      : 約数みつけ（判定・選択・個数・全部さがす）
 * - gcd           : 公約数・最大公約数（求める・選ぶ・文章題・素数判定の発展）
 * - error-hunter  : 頻出の誤解（0は奇数/1は素数/約数の1と自分自身の抜け/最大公約数と最小公倍数の混同/倍数の飛ばし/奇数+奇数）
 */

export function rnd(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
export function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }
export function shuffle<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5); }

export function gcdOf(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}
export function lcmOf(a: number, b: number): number { return (a * b) / gcdOf(a, b); }
export function divisorsOf(n: number): number[] {
  const out: number[] = [];
  for (let i = 1; i <= n; i++) if (n % i === 0) out.push(i);
  return out;
}
export function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

/* =====================================================================
 * 共通の Problem 型
 * =================================================================== */

export type ProblemKind = 'judge' | 'choice' | 'multi' | 'numeric';

export interface Problem {
  kind: ProblemKind;
  /** 出題文 */
  prompt: string;
  /** 大きく表示する数・式（任意） */
  display?: string;
  /** judge: 2つのラベル。judgeAnswer が true なら1つ目が正解 */
  judgeLabels?: [string, string];
  judgeAnswer?: boolean;
  /** choice: 選択肢から1つ選ぶ */
  choices?: string[];
  answerIndex?: number;
  /** multi: 選択肢から複数選ぶ（個数は問題ごとに異なる） */
  answerIndices?: number[];
  /** numeric: 数値を入力する */
  answerValue?: number;
  hint: string;
  explain: string;
  /** 学習のきろく表示用ラベル */
  label: string;
}

/** 本番テストの答案きろく用に、問題と正しい答えを文字列にする。 */
export function describeProblem(p: Problem): { q: string; a: string } {
  const q = p.display ? `${p.display}　${p.prompt}` : p.prompt;
  let a = '';
  switch (p.kind) {
    case 'judge': a = p.judgeAnswer ? p.judgeLabels![0] : p.judgeLabels![1]; break;
    case 'choice': a = p.choices![p.answerIndex!]; break;
    case 'multi': a = (p.answerIndices ?? []).map((i) => p.choices![i]).join('、 '); break;
    case 'numeric': a = String(p.answerValue); break;
  }
  return { q, a };
}

/** base の倍数のうち、excludeBase の倍数ではないものを max まで すべて列挙する。 */
function multiplesNotOf(base: number, excludeBase: number, max: number): number[] {
  const out: number[] = [];
  for (let v = base; v <= max; v += base) if (v % excludeBase !== 0) out.push(v);
  return out;
}

function nonMultipleOf(base: number, min: number, max: number): number {
  for (let i = 0; i < 60; i++) {
    const v = rnd(min, max);
    if (v % base !== 0) return v;
  }
  return min;
}

/**
 * gen() を最大 maxAttempts 回呼び出し、重複を除いて最大 count 個の値を集める。
 * 候補が少ない組み合わせ（例: 小さい数どうしの倍数）では count に満たないこともあるが、
 * 無限ループにはならない（gen() が同じ値を返し続けても必ず終了する）。
 */
function collectUpTo(count: number, gen: () => number, maxAttempts = 200, pred?: (v: number) => boolean): number[] {
  const set = new Set<number>();
  let guard = 0;
  while (set.size < count && guard < maxAttempts) {
    guard++;
    const v = gen();
    if (!pred || pred(v)) set.add(v);
  }
  return [...set];
}

/* =====================================================================
 * ①偶数・奇数チェック
 * =================================================================== */

export type EvenOddLevel = 'eo-basic' | 'eo-big' | 'eo-zero' | 'eo-seq';

export const EVEN_ODD_LEVELS: { id: EvenOddLevel; label: string; desc: string }[] = [
  { id: 'eo-basic', label: 'きほんの はんてい', desc: '1〜99の数で ぐうすう・きすうを 見分けよう' },
  { id: 'eo-big', label: '大きい数の はんてい', desc: '100〜9999の数も 一の位を見れば わかる！' },
  { id: 'eo-zero', label: '正しい？まちがい？クイズ', desc: '0の せいしつなど、正しいか考えよう' },
  { id: 'eo-seq', label: 'すうれつの あなうめ', desc: 'ぐうすう・きすうだけの数列の □は？' },
];

const EO_ZERO_STATEMENTS = [
  { text: '0は ぐうすうである', isTrue: true, explain: '0は 2で わりきれる（0÷2＝0）ので、ぐうすうだよ。' },
  { text: '1000は きすうである', isTrue: false, explain: '1000の 一の位は 0だから、ぐうすうだよ。' },
  { text: '一の位が 5の数は、いつも きすうである', isTrue: true, explain: '一の位が 1,3,5,7,9のときは いつも きすうだよ。' },
  { text: '一の位が 0の数は、いつも きすうである', isTrue: false, explain: '一の位が 0の数は ぐうすうだよ。' },
  { text: 'ぐうすうとは、2で わりきれる数のことである', isTrue: true, explain: 'その通り！ぐうすうは 2で ぴったり わりきれる数だよ。' },
  { text: '0は ぐうすうでも きすうでもない、とくべつな数である', isTrue: false, explain: '0も ぐうすうの なかまだよ（2で わりきれるから）。' },
  { text: '十の位や 百の位を 見なくても、一の位だけで ぐうすう・きすうが わかる', isTrue: true, explain: 'その通り。一の位だけで 判定できるよ。' },
];

export function generateEvenOdd(level: EvenOddLevel): Problem {
  switch (level) {
    case 'eo-basic': {
      const n = rnd(1, 99);
      const isEven = n % 2 === 0;
      return {
        kind: 'judge', prompt: `${n} は、ぐうすう？ きすう？`, display: String(n),
        judgeLabels: ['ぐうすう', 'きすう'], judgeAnswer: isEven,
        hint: `一の位の数字「${n % 10}」に 注目しよう。0,2,4,6,8で おわる数は ぐうすう、1,3,5,7,9で おわる数は きすうだよ。`,
        explain: `${n}の 一の位は「${n % 10}」だから ${isEven ? 'ぐうすう' : 'きすう'}。`,
        label: `${n} は ${isEven ? 'ぐうすう' : 'きすう'}`,
      };
    }
    case 'eo-big': {
      const n = rnd(100, 9999);
      const isEven = n % 2 === 0;
      return {
        kind: 'judge', prompt: `${n} は、ぐうすう？ きすう？`, display: String(n),
        judgeLabels: ['ぐうすう', 'きすう'], judgeAnswer: isEven,
        hint: `大きい数でも、一の位「${n % 10}」だけ見れば わかるよ。`,
        explain: `一の位が「${n % 10}」だから ${isEven ? 'ぐうすう' : 'きすう'}。`,
        label: `${n} は ${isEven ? 'ぐうすう' : 'きすう'}`,
      };
    }
    case 'eo-zero': {
      const s = pick(EO_ZERO_STATEMENTS);
      return {
        kind: 'judge', prompt: s.text, judgeLabels: ['正しい', 'まちがい'], judgeAnswer: s.isTrue,
        hint: '0や 一の位に 注目して、もう一度 考えてみよう。',
        explain: s.explain, label: s.text,
      };
    }
    case 'eo-seq': {
      const isEvenSeq = Math.random() < 0.5;
      const start = isEvenSeq ? rnd(1, 20) * 2 : rnd(1, 20) * 2 + 1;
      const terms = Array.from({ length: 5 }, (_, i) => start + i * 2);
      const blankIdx = rnd(1, 3);
      const answer = terms[blankIdx];
      const seqDisplay = terms.map((t, i) => (i === blankIdx ? '□' : String(t))).join('、 ');
      return {
        kind: 'numeric', prompt: `${isEvenSeq ? 'ぐうすう' : 'きすう'}だけが 順番に ならんでいます。□に 入る数は？`,
        display: seqDisplay, answerValue: answer,
        hint: `${isEvenSeq ? 'ぐうすう' : 'きすう'}は 2ずつ 増えていくよ。前後の数と くらべてみよう。`,
        explain: `前後の数は ${terms.filter((_, i) => i !== blankIdx).join('、 ')}。2ずつ増えるので □は ${answer}。`,
        label: seqDisplay.replace('□', String(answer)),
      };
    }
  }
}

/* =====================================================================
 * ②偶数・奇数のせいしつ
 * =================================================================== */

export type EorLevel = 'eor-add' | 'eor-mul' | 'eor-blank' | 'eor-trap';

export const EOR_LEVELS: { id: EorLevel; label: string; desc: string }[] = [
  { id: 'eor-add', label: 'たし算の 結果は？', desc: '計算しなくても ぐうすう・きすうが わかる！' },
  { id: 'eor-mul', label: 'かけ算の 結果は？', desc: 'ぐうすうが 1つでもあれば…？' },
  { id: 'eor-blank', label: '□に あてはまる 数は？', desc: '和が ぐうすう・きすうに なる条件を さがそう' },
  { id: 'eor-trap', label: 'つまずきポイント クイズ', desc: 'よくある かんちがいに 気をつけよう' },
];

function parityLabel(isEven: boolean) { return isEven ? 'ぐうすう' : 'きすう'; }

const EOR_TRAPS = [
  { text: 'きすう＋きすうは、きすうに なる', isTrue: false, explain: 'たとえば 3+5=8。きすう＋きすうは いつも ぐうすうに なるよ。' },
  { text: 'ぐうすう＋ぐうすうは、ぐうすうに なる', isTrue: true, explain: 'たとえば 4+6=10。その通り、ぐうすう＋ぐうすうは いつも ぐうすうだよ。' },
  { text: 'ぐうすう＋きすうは、ぐうすうに なる', isTrue: false, explain: 'たとえば 4+5=9。ぐうすう＋きすうは いつも きすうに なるよ。' },
  { text: 'きすうを 2つ たすと、答えは いつも ぐうすうに なる', isTrue: true, explain: 'その通り！きすう＋きすう＝ぐうすう だよ。' },
  { text: '大きい数どうしの たし算なら、答えは いつも ぐうすうに なる', isTrue: false, explain: '大きさは 関係ないよ。101+3=104(ぐうすう)だけど 101+2=103(きすう)。ぐうすう・きすうの組み合わせで決まるんだ。' },
  { text: '0は ぐうすうなので、0を たしても ぐうすう・きすうは かわらない', isTrue: true, explain: 'その通り！0は ぐうすうだから、たしても 種類は かわらないよ。' },
];

export function generateEor(level: EorLevel): Problem {
  switch (level) {
    case 'eor-add': {
      const patterns = [{ aEven: true, bEven: true }, { aEven: false, bEven: false }, { aEven: true, bEven: false }, { aEven: false, bEven: true }];
      const pat = pick(patterns);
      const a = pat.aEven ? rnd(1, 40) * 2 : rnd(1, 40) * 2 + 1;
      const b = pat.bEven ? rnd(1, 40) * 2 : rnd(1, 40) * 2 + 1;
      const sum = a + b;
      const isEven = sum % 2 === 0;
      return {
        kind: 'choice', prompt: `${a} ＋ ${b} の 答えは、計算しなくても わかるかな？`,
        choices: ['ぐうすう', 'きすう'], answerIndex: isEven ? 0 : 1,
        hint: `${parityLabel(pat.aEven)}＋${parityLabel(pat.bEven)} は、いつも ${isEven ? 'ぐうすう' : 'きすう'}に なるよ。`,
        explain: `${a}+${b}＝${sum}。${parityLabel(pat.aEven)}＋${parityLabel(pat.bEven)}は ${isEven ? 'ぐうすう' : 'きすう'}に なるんだ。`,
        label: `${a}+${b}=${sum}`,
      };
    }
    case 'eor-mul': {
      const isEvenFactor = Math.random() < 0.5;
      const x = isEvenFactor ? rnd(1, 20) * 2 : rnd(1, 20) * 2 + 1;
      const y = rnd(2, 20);
      const product = x * y;
      const isEven = product % 2 === 0;
      return {
        kind: 'choice', prompt: `${x} × ${y} の 答えは、ぐうすう？ きすう？`,
        choices: ['ぐうすう', 'きすう'], answerIndex: isEven ? 0 : 1,
        hint: isEvenFactor
          ? 'かけ算は、かける数の どちらかが ぐうすうなら、答えは いつも ぐうすうに なるよ。'
          : `きすう×きすうは きすう、きすう×ぐうすうは ぐうすうだよ。${y}は ぐうすう？きすう？`,
        explain: `${x}×${y}＝${product}。${x}は ${parityLabel(isEvenFactor)}だから、答えは ${isEven ? 'ぐうすう' : 'きすう'}。`,
        label: `${x}×${y}=${product}`,
      };
    }
    case 'eor-blank': {
      const targetEven = Math.random() < 0.5;
      const givenEven = Math.random() < 0.5;
      const isOddGiven = !givenEven;
      const isOddTarget = !targetEven;
      const isOddNeed = isOddTarget !== isOddGiven;
      const needEven = !isOddNeed;
      return {
        kind: 'choice',
        prompt: `□ ＋ ${givenEven ? 'ぐうすうの数' : 'きすうの数'} ＝ ${targetEven ? 'ぐうすうの数' : 'きすうの数'} に なるとき、□に あてはまるのは？`,
        choices: ['ぐうすうの数', 'きすうの数'], answerIndex: needEven ? 0 : 1,
        hint: 'たされる数と たす数の 組み合わせで、和が ぐうすうか きすうかが 決まるよ。ぐうすう・きすうの 組み合わせを 1つずつ ためしてみよう。',
        explain: `□が ${needEven ? 'ぐうすう' : 'きすう'}のとき、${needEven ? 'ぐうすう' : 'きすう'}＋${givenEven ? 'ぐうすう' : 'きすう'}＝${targetEven ? 'ぐうすう' : 'きすう'}に なるよ。`,
        label: `□+${givenEven ? 'ぐうすう' : 'きすう'}=${targetEven ? 'ぐうすう' : 'きすう'}`,
      };
    }
    case 'eor-trap': {
      const t = pick(EOR_TRAPS);
      return {
        kind: 'judge', prompt: t.text, judgeLabels: ['正しい', 'まちがい'], judgeAnswer: t.isTrue,
        hint: '具体的な数を 当てはめて たしかめてみよう。',
        explain: t.explain, label: t.text,
      };
    }
  }
}

/* =====================================================================
 * ③倍数みつけ隊
 * =================================================================== */

export type MultiplesLevel = 'mul-basic' | 'mul-judge' | 'mul-pick' | 'mul-count';

export const MULTIPLES_LEVELS: { id: MultiplesLevel; label: string; desc: string }[] = [
  { id: 'mul-basic', label: '□番目の 倍数', desc: '3の倍数は 3,6,9…では 10番目は？' },
  { id: 'mul-judge', label: '倍数か どうか はんてい', desc: 'わりきれるか たしかめよう' },
  { id: 'mul-pick', label: '倍数を えらぼう', desc: 'この中から 倍数を ぜんぶ さがそう' },
  { id: 'mul-count', label: '範囲の中の 倍数の数', desc: '1から○までに 倍数は 何こ？' },
];

export function generateMultiples(level: MultiplesLevel): Problem {
  switch (level) {
    case 'mul-basic': {
      const b = rnd(2, 12);
      const k = rnd(3, 10);
      const answer = b * k;
      const shown = Array.from({ length: Math.min(k - 1, 4) }, (_, i) => b * (i + 1));
      return {
        kind: 'numeric', prompt: `${b}の倍数を 小さい順に ならべたとき、${k}番目の数は いくつですか？`,
        display: `${shown.join('、 ')}、…`, answerValue: answer,
        hint: `${b}の倍数は ${b}、${b * 2}、${b * 3}…のように ${b}ずつ 増えていくよ。${k}番目は ${b} × ${k} で もとめられるよ。`,
        explain: `${b} × ${k} ＝ ${answer}。`, label: `${b}の倍数の${k}番目=${answer}`,
      };
    }
    case 'mul-judge': {
      const b = rnd(2, 12);
      const wantMultiple = Math.random() < 0.5;
      const n = wantMultiple ? b * rnd(2, 15) : (() => {
        let v: number;
        do { v = b * rnd(2, 15) + rnd(1, b - 1); } while (v % b === 0);
        return v;
      })();
      const actual = n % b === 0;
      return {
        kind: 'judge', prompt: `${n} は ${b}の倍数ですか？`, display: `${n} と ${b}`,
        judgeLabels: ['はい', 'いいえ'], judgeAnswer: actual,
        hint: `${n} ÷ ${b} を 計算して、わりきれるか たしかめよう。`,
        explain: actual
          ? `${n} ÷ ${b} ＝ ${n / b} で わりきれるから、倍数だよ。`
          : `${n} ÷ ${b} ＝ ${Math.floor(n / b)} あまり ${n % b} で わりきれないから、倍数ではないよ。`,
        label: `${n}は${b}の倍数か=${actual ? 'はい' : 'いいえ'}`,
      };
    }
    case 'mul-pick': {
      const b = rnd(2, 9);
      const upper = b * 12;
      const multiplesPool = Array.from({ length: 10 }, (_, i) => b * (i + 2)).filter((x) => x <= upper);
      const chosen = shuffle(multiplesPool).slice(0, Math.min(multiplesPool.length, rnd(3, 5)));
      const decoys = collectUpTo(8 - chosen.length, () => nonMultipleOf(b, b + 1, upper));
      const candidates = shuffle([...chosen, ...decoys]);
      const answerIndices = candidates.map((c, i) => ({ c, i })).filter((x) => x.c % b === 0).map((x) => x.i);
      return {
        kind: 'multi', prompt: `この中から ${b}の倍数を ぜんぶ えらぼう。`,
        choices: candidates.map(String), answerIndices,
        hint: `それぞれの数を ${b} で わって、わりきれるか たしかめよう。`,
        explain: `${b}の倍数は ${answerIndices.map((i) => candidates[i]).join('、 ')}。`,
        label: `${b}の倍数えらび`,
      };
    }
    case 'mul-count': {
      const b = rnd(2, 9);
      const N = pick([30, 40, 50, 60, 80, 100]);
      const answer = Math.floor(N / b);
      return {
        kind: 'numeric', prompt: `1から ${N}までの中に、${b}の倍数は いくつ ありますか？`, answerValue: answer,
        hint: `${N} ÷ ${b} を 計算しよう。答えの 整数の部分が、倍数の こ数だよ。`,
        explain: `${N} ÷ ${b} ＝ ${Math.floor(N / b)} あまり ${N % b}。だから ${b}の倍数は ${answer}こ あるよ。`,
        label: `1~${N}の${b}の倍数の数=${answer}`,
      };
    }
  }
}

/* =====================================================================
 * ④公倍数・最小公倍数
 * =================================================================== */

export type LcmLevel = 'lcm-find' | 'lcm-pick' | 'lcm-word' | 'lcm-three';

export const LCM_LEVELS: { id: LcmLevel; label: string; desc: string }[] = [
  { id: 'lcm-find', label: '最小公倍数を もとめる', desc: '2つの数の 倍数を 書き出して さがそう' },
  { id: 'lcm-pick', label: '公倍数を えらぼう', desc: 'この中から 2数の公倍数を ぜんぶ さがそう' },
  { id: 'lcm-word', label: '文章題（同時に そろう？）', desc: '最小公倍数の 考え方を つかおう' },
  { id: 'lcm-three', label: '3つの数の 最小公倍数（発展）', desc: '2つずつ じゅんに もとめよう' },
];

function twoDistinct(min: number, max: number): [number, number] {
  const a = rnd(min, max);
  let b = rnd(min, max);
  if (b === a) b = b === max ? min : b + 1;
  return [a, b];
}

export function generateLcm(level: LcmLevel): Problem {
  switch (level) {
    case 'lcm-find': {
      const [a, b] = twoDistinct(2, 12);
      const l = lcmOf(a, b);
      return {
        kind: 'numeric', prompt: `${a}と${b}の 最小公倍数を もとめましょう。`, answerValue: l,
        hint: `${a}の倍数（${a}、${a * 2}、${a * 3}…）と ${b}の倍数（${b}、${b * 2}、${b * 3}…）を 書き出して、はじめて出てくる 共通の数を さがそう。`,
        explain: `${a}と${b}の 最小公倍数は ${l}。`, label: `lcm(${a},${b})=${l}`,
      };
    }
    case 'lcm-pick': {
      const [a, b] = twoDistinct(2, 9);
      const l = lcmOf(a, b);
      const upper = l * 3;
      const commonPool = [l, l * 2, l * 3].filter((x) => x <= upper);
      const chosenCommon = shuffle(commonPool).slice(0, Math.max(1, Math.min(2, commonPool.length)));
      // a・bそれぞれの倍数のうち、もう一方の倍数ではないもの（＝公倍数ではない decoy）を列挙する。
      // 一方が他方の倍数（例: 4と8）のときは、どちらかの候補が空になることがあるが、それでも安全。
      const decoys = shuffle(multiplesNotOf(a, b, upper)).slice(0, 3);
      const decoys2 = shuffle(multiplesNotOf(b, a, upper)).slice(0, 3);
      const candidates = shuffle([...chosenCommon, ...decoys, ...decoys2]);
      const answerIndices = candidates.map((c, i) => ({ c, i })).filter((x) => x.c % l === 0).map((x) => x.i);
      return {
        kind: 'multi', prompt: `この中から、${a}と${b}の 公倍数を ぜんぶ えらぼう。`,
        choices: candidates.map(String), answerIndices,
        hint: `公倍数は 最小公倍数（${l}）の 倍数に なっているよ。それぞれを ${l} で わって たしかめよう。`,
        explain: `${a}と${b}の 最小公倍数は ${l}。公倍数は ${answerIndices.map((i) => candidates[i]).join('、 ')}。`,
        label: `${a}と${b}の公倍数えらび`,
      };
    }
    case 'lcm-word': {
      const [a, b] = twoDistinct(3, 12);
      const l = lcmOf(a, b);
      const scene = pick([
        { unit: 'びょう', text: (x: number, y: number) => `赤いライトは ${x}びょうごとに、青いライトは ${y}びょうごとに 光ります。今、2つとも 同時に 光りました。次に 同時に 光るのは 何びょうご ですか？` },
        { unit: '分', text: (x: number, y: number) => `バスAは ${x}分おきに、バスBは ${y}分おきに えき を 出発します。今 2台とも 同時に 出発しました。次に 同時に 出発するのは 何分ご ですか？` },
        { unit: '回', text: (x: number, y: number) => `太郎さんは ${x}日おきに、花子さんは ${y}日おきに 図書館へ行きます。今日 2人とも 行きました。次に 2人が 同じ日に 行くのは 何日ご ですか？` },
      ]);
      return {
        kind: 'numeric', prompt: scene.text(a, b), answerValue: l,
        hint: `${a}の倍数と ${b}の倍数で、はじめて 一致する数（＝最小公倍数）を さがそう。`,
        explain: `${a}と${b}の 最小公倍数は ${l}。だから ${l}${scene.unit}ごに 同時に そろうよ。`,
        label: `lcm word(${a},${b})=${l}`,
      };
    }
    case 'lcm-three': {
      const a = rnd(2, 8), b = rnd(2, 8), c = rnd(2, 8);
      const lab = lcmOf(a, b);
      const labc = lcmOf(lab, c);
      return {
        kind: 'numeric', prompt: `${a}と${b}と${c}の 最小公倍数を もとめましょう。`, answerValue: labc,
        hint: `まず ${a}と${b}の最小公倍数を もとめて、その数と ${c}の最小公倍数を もとめよう。`,
        explain: `${a}と${b}の最小公倍数は ${lab}。${lab}と${c}の最小公倍数は ${labc}。`,
        label: `lcm(${a},${b},${c})=${labc}`,
      };
    }
  }
}

/* =====================================================================
 * ⑤約数みつけ隊
 * =================================================================== */

export type DivisorsLevel = 'div-judge' | 'div-pick' | 'div-count' | 'div-all';

export const DIVISORS_LEVELS: { id: DivisorsLevel; label: string; desc: string }[] = [
  { id: 'div-judge', label: '約数か どうか はんてい', desc: 'わりきれるか たしかめよう' },
  { id: 'div-pick', label: '約数を えらぼう', desc: 'この中から 約数を ぜんぶ さがそう' },
  { id: 'div-count', label: '約数は 何こ？', desc: 'ペアで さがすと 見落としが 少ないよ' },
  { id: 'div-all', label: '約数を ぜんぶ みつけよう', desc: '1から その数まで ぜんぶ たしかめよう' },
];

export function generateDivisors(level: DivisorsLevel): Problem {
  switch (level) {
    case 'div-judge': {
      const N = rnd(6, 60);
      const divs = divisorsOf(N);
      const wantDiv = Math.random() < 0.5;
      const d = wantDiv ? pick(divs) : (() => {
        let v: number;
        do { v = rnd(2, N - 1); } while (N % v === 0);
        return v;
      })();
      const actual = N % d === 0;
      return {
        kind: 'judge', prompt: `${d}は ${N}の 約数ですか？`,
        judgeLabels: ['はい', 'いいえ'], judgeAnswer: actual,
        hint: `${N} ÷ ${d} を 計算して、わりきれるか たしかめよう。`,
        explain: actual ? `${N} ÷ ${d} ＝ ${N / d} で わりきれるから、約数だよ。` : `${N} ÷ ${d} は わりきれないから、約数ではないよ。`,
        label: `${d}は${N}の約数か=${actual ? 'はい' : 'いいえ'}`,
      };
    }
    case 'div-pick': {
      const N = rnd(12, 48);
      const divs = divisorsOf(N);
      const chosen = shuffle(divs).slice(0, Math.min(divs.length, rnd(3, 6)));
      const decoySet = collectUpTo(Math.max(3, 9 - chosen.length), () => rnd(2, N - 1), 300, (v) => N % v !== 0);
      const candidates = shuffle([...chosen, ...decoySet]);
      const answerIndices = candidates.map((c, i) => ({ c, i })).filter((x) => N % x.c === 0).map((x) => x.i);
      return {
        kind: 'multi', prompt: `この中から ${N}の約数を ぜんぶ えらぼう。`,
        choices: candidates.map(String), answerIndices,
        hint: `それぞれの数で ${N} を わって、わりきれるか たしかめよう。1と ${N}自身も 約数だよ。`,
        explain: `${N}の約数は ${divs.join('、 ')}。`,
        label: `${N}の約数えらび`,
      };
    }
    case 'div-count': {
      const N = rnd(12, 60);
      const divs = divisorsOf(N);
      return {
        kind: 'numeric', prompt: `${N}の約数は ぜんぶで 何こ ありますか？`, answerValue: divs.length,
        hint: `1×${N}、2×？…のように ペアで さがすと 見落としが 少ないよ。`,
        explain: `${N}の約数は ${divs.join('、 ')}で、${divs.length}こ あるよ。`,
        label: `${N}の約数の数=${divs.length}`,
      };
    }
    case 'div-all': {
      const N = rnd(12, 24);
      const divs = divisorsOf(N);
      const candidates = Array.from({ length: N }, (_, i) => i + 1);
      const answerIndices = candidates.map((c, i) => ({ c, i })).filter((x) => N % x.c === 0).map((x) => x.i);
      return {
        kind: 'multi', prompt: `1から ${N}までの中から、${N}の約数を ぜんぶ えらぼう。`,
        choices: candidates.map(String), answerIndices,
        hint: `1×${N}、2×？、3×？…と ペアで 考えると、ぬけなく さがせるよ。`,
        explain: `${N}の約数は ${divs.join('、 ')}。`,
        label: `${N}の約数を全部さがす`,
      };
    }
  }
}

/* =====================================================================
 * ⑥公約数・最大公約数
 * =================================================================== */

export type GcdLevel = 'gcd-find' | 'gcd-pick' | 'gcd-word' | 'gcd-prime';

export const GCD_LEVELS: { id: GcdLevel; label: string; desc: string }[] = [
  { id: 'gcd-find', label: '最大公約数を もとめる', desc: '2つの数の 約数を 書き出して さがそう' },
  { id: 'gcd-pick', label: '公約数を えらぼう', desc: 'この中から 2数の公約数を ぜんぶ さがそう' },
  { id: 'gcd-word', label: '文章題（あまりなく 分ける）', desc: '最大公約数の 考え方を つかおう' },
  { id: 'gcd-prime', label: '素数(そすう)は どれ？（発展）', desc: '約数が 2こだけの数を 見ぬこう' },
];

function commonFactorPair(min: number, max: number): [number, number] {
  const f = rnd(2, 12);
  let a = f * rnd(1, Math.max(1, Math.floor(max / f)));
  let b = f * rnd(1, Math.max(1, Math.floor(max / f)));
  a = Math.max(min, a); b = Math.max(min, b);
  if (a === b) b = a + f;
  if (b > max) b = a - f > 0 ? a - f : f;
  return [a, b];
}

export function generateGcd(level: GcdLevel): Problem {
  switch (level) {
    case 'gcd-find': {
      const [a, b] = commonFactorPair(6, 48);
      const g = gcdOf(a, b);
      return {
        kind: 'numeric', prompt: `${a}と${b}の 最大公約数を もとめましょう。`, answerValue: g,
        hint: `${a}の約数と ${b}の約数を 書き出して、いちばん大きい 共通の数を さがそう。`,
        explain: `${a}と${b}の 最大公約数は ${g}。`, label: `gcd(${a},${b})=${g}`,
      };
    }
    case 'gcd-pick': {
      const [a, b] = commonFactorPair(8, 36);
      const g = gcdOf(a, b);
      const commonDivs = divisorsOf(g);
      const chosenCommon = shuffle(commonDivs).slice(0, Math.min(commonDivs.length, rnd(2, 4)));
      const decoySet = new Set<number>();
      let guard = 0;
      while (decoySet.size < 6 - chosenCommon.length && guard < 200) {
        guard++;
        const v = rnd(2, Math.max(a, b));
        if (a % v !== 0 || b % v !== 0) decoySet.add(v);
      }
      const candidates = shuffle([...chosenCommon, ...decoySet]);
      const answerIndices = candidates.map((c, i) => ({ c, i })).filter((x) => a % x.c === 0 && b % x.c === 0).map((x) => x.i);
      return {
        kind: 'multi', prompt: `この中から、${a}と${b}の 公約数を ぜんぶ えらぼう。`,
        choices: candidates.map(String), answerIndices,
        hint: `公約数は、最大公約数（${g}）の 約数に なっているよ。`,
        explain: `${a}と${b}の 最大公約数は ${g}。公約数は ${answerIndices.map((i) => candidates[i]).join('、 ')}。`,
        label: `${a}と${b}の公約数えらび`,
      };
    }
    case 'gcd-word': {
      const [a, b] = commonFactorPair(8, 48);
      const g = gcdOf(a, b);
      const scene = pick([
        { text: (x: number, y: number) => `あめが ${x}こ、クッキーが ${y}こ あります。あまりが 出ないように、できるだけ 多くの子どもに 同じ数ずつ 分けます。何人に 分けられますか？`, unit: '人' },
        { text: (x: number, y: number) => `色紙が ${x}まい、リボンが ${y}本 あります。あまりが 出ないように、できるだけ 多くの ふくろに 同じ数ずつ 分けて 入れます。何ふくろ できますか？`, unit: 'ふくろ' },
      ]);
      return {
        kind: 'numeric', prompt: scene.text(a, b), answerValue: g,
        hint: `「あまりなく分ける」「できるだけ多く」は 最大公約数の 考え方だよ。${a}と${b}の 公約数の中で いちばん大きい数を さがそう。`,
        explain: `${a}と${b}の 最大公約数は ${g}。だから ${g}${scene.unit}に 分けられるよ。`,
        label: `gcd word(${a},${b})=${g}`,
      };
    }
    case 'gcd-prime': {
      const n = rnd(2, 50);
      const p = isPrime(n);
      const divs = divisorsOf(n);
      return {
        kind: 'judge', prompt: `${n}は 素数(そすう)ですか？`,
        judgeLabels: ['素数である', '素数でない'], judgeAnswer: p,
        hint: `${n}の約数を 書き出してみよう。約数が 1と自分自身の 2こだけなら 素数だよ。`,
        explain: p
          ? `${n}の約数は 1と${n}だけ（2こ）だから、素数だよ。`
          : `${n}の約数は ${divs.join('、 ')}で、2こより多いから 素数ではないよ。`,
        label: `${n}は素数か=${p ? 'はい' : 'いいえ'}`,
      };
    }
  }
}

/* =====================================================================
 * ⑦エラーハンター（頻出の誤解）
 * =================================================================== */

const EH_REASONS = {
  ZERO: '0が ぐうすうであることを わすれていた',
  ONE_PRIME: '1の約数は 1こだけ（自分自身と同じ）で、2こないことに 気づかなかった',
  SELF: 'ある数は 自分自身でも わりきれる（自分自身も約数）ことを わすれていた',
  ONE_DIV: 'どんな数も 1で わりきれる（1も約数）ことを わすれていた',
  SWAP: '最大公約数と 最小公倍数を 反対に おぼえていた',
  SKIP: '倍数を 書き出すとき、とちゅうを とばしてしまった',
  ODDODD: 'きすう＋きすうは ぐうすうに なることを 知らなかった',
};

export type EhPreset = 'eh-zero' | 'eh-one-prime' | 'eh-self' | 'eh-one-div' | 'eh-swap' | 'eh-skip' | 'eh-oddodd';

export interface NumError {
  character: string;
  statement: string;
  isCorrect: boolean;
  fixKind?: 'numeric' | 'choice2';
  choice2Labels?: [string, string];
  correctChoiceIsFirst?: boolean;
  fixPrompt?: string;
  correctNumeric?: number;
  reasonOptions: string[];
  correctReasonIndex: number;
  fixHint: string;
  explain: string;
}

const EH_CHARS = ['りく', 'はな', 'そら', 'みお', 'けん', 'あい'];

function buildEhReasons(correct: string): { options: string[]; index: number } {
  const all = Object.values(EH_REASONS);
  const distractors = all.filter((r) => r !== correct).sort(() => Math.random() - 0.5).slice(0, 2);
  const options = [correct, ...distractors].sort(() => Math.random() - 0.5);
  return { options, index: options.indexOf(correct) };
}

type EhBuilder = () => NumError;

const ehZero: EhBuilder = () => {
  const r = buildEhReasons(EH_REASONS.ZERO);
  return {
    character: pick(EH_CHARS), statement: '0は きすうです。', isCorrect: false,
    fixKind: 'choice2', choice2Labels: ['ぐうすう', 'きすう'], correctChoiceIsFirst: true, fixPrompt: '0は 本当は？',
    reasonOptions: r.options, correctReasonIndex: r.index,
    fixHint: '0 ÷ 2 は わりきれるかな？',
    explain: '0は 2で わりきれる（0÷2＝0）ので、ぐうすうだよ。',
  };
};

const ehOnePrime: EhBuilder = () => {
  const r = buildEhReasons(EH_REASONS.ONE_PRIME);
  return {
    character: pick(EH_CHARS), statement: '1は 素数(そすう)です。', isCorrect: false,
    fixKind: 'choice2', choice2Labels: ['素数である', '素数でない'], correctChoiceIsFirst: false, fixPrompt: '1は 本当は？',
    reasonOptions: r.options, correctReasonIndex: r.index,
    fixHint: '1の約数を 書き出してみよう。いくつ あるかな？',
    explain: '素数は 約数が ちょうど2こ（1と自分自身）の数。1の約数は 1だけ（1こ）だから、素数ではないよ。',
  };
};

const ehSelf: EhBuilder = () => {
  const N = rnd(10, 30);
  const divs = divisorsOf(N);
  const shown = divs.filter((d) => d !== N);
  const r = buildEhReasons(EH_REASONS.SELF);
  return {
    character: pick(EH_CHARS), statement: `${N}の約数は ${shown.join('、 ')} です。`, isCorrect: false,
    fixKind: 'numeric', fixPrompt: 'ぬけている約数は？', correctNumeric: N,
    reasonOptions: r.options, correctReasonIndex: r.index,
    fixHint: `${N} ÷ ${N} を 考えてみよう。`,
    explain: `${N}自身も ${N}の約数だよ。正しくは ${divs.join('、 ')}。`,
  };
};

const ehOneDiv: EhBuilder = () => {
  const N = rnd(10, 30);
  const divs = divisorsOf(N);
  const shown = divs.filter((d) => d !== 1);
  const r = buildEhReasons(EH_REASONS.ONE_DIV);
  return {
    character: pick(EH_CHARS), statement: `${N}の約数は ${shown.join('、 ')} です。`, isCorrect: false,
    fixKind: 'numeric', fixPrompt: 'ぬけている約数は？', correctNumeric: 1,
    reasonOptions: r.options, correctReasonIndex: r.index,
    fixHint: 'どんな数も、1で わると わりきれるよ。',
    explain: `1は どんな数の約数にも なるよ。正しくは ${divs.join('、 ')}。`,
  };
};

const ehSwap: EhBuilder = () => {
  const [a, b] = twoDistinct(4, 20);
  const g = gcdOf(a, b);
  const l = lcmOf(a, b);
  const r = buildEhReasons(EH_REASONS.SWAP);
  return {
    character: pick(EH_CHARS), statement: `${a}と${b}の 最大公約数は ${l} です。`, isCorrect: false,
    fixKind: 'numeric', fixPrompt: '正しい最大公約数は？', correctNumeric: g,
    reasonOptions: r.options, correctReasonIndex: r.index,
    fixHint: `${a}と${b}の 約数を それぞれ書き出して、共通のものを さがそう。`,
    explain: `${l}は 最小公倍数だよ。最大公約数は ${g}。`,
  };
};

const ehSkip: EhBuilder = () => {
  const b = rnd(3, 9);
  const terms = [b, b * 2, b * 3, b * 4, b * 5];
  const skipIdx = rnd(1, 3);
  const shown = terms.filter((_, i) => i !== skipIdx);
  const r = buildEhReasons(EH_REASONS.SKIP);
  return {
    character: pick(EH_CHARS), statement: `${b}の倍数を 小さい順に書くと ${shown.join('、 ')}… です。`, isCorrect: false,
    fixKind: 'numeric', fixPrompt: 'ぬけている数は？', correctNumeric: terms[skipIdx],
    reasonOptions: r.options, correctReasonIndex: r.index,
    fixHint: `${b}ずつ 増えているはず。前後の数と くらべてみよう。`,
    explain: `正しくは ${terms.join('、 ')}。${terms[skipIdx]}が ぬけていたね。`,
  };
};

const ehOddOdd: EhBuilder = () => {
  const a = rnd(1, 20) * 2 + 1;
  const b = rnd(1, 20) * 2 + 1;
  const sum = a + b;
  const r = buildEhReasons(EH_REASONS.ODDODD);
  return {
    character: pick(EH_CHARS), statement: `${a} ＋ ${b} の答えは、きすうです。`, isCorrect: false,
    fixKind: 'choice2', choice2Labels: ['ぐうすう', 'きすう'], correctChoiceIsFirst: true, fixPrompt: '本当の答えの種類は？',
    reasonOptions: r.options, correctReasonIndex: r.index,
    fixHint: `${a}+${b}を 実さいに 計算してみよう。`,
    explain: `${a}+${b}＝${sum}。きすう＋きすうは いつも ぐうすうに なるよ。`,
  };
};

const ehCorrect: EhBuilder = () => {
  const variants = [
    () => { const N = rnd(10, 30); const divs = divisorsOf(N); return { statement: `${N}の約数は ${divs.join('、 ')} です。`, explain: `${divs.join('、 ')}で ぜんぶ 合っているね！` }; },
    () => { const b = rnd(2, 9); const terms = [b, b * 2, b * 3, b * 4]; return { statement: `${b}の倍数を 小さい順に書くと ${terms.join('、 ')}… です。`, explain: 'その通り、ぬけなく 書けているね！' }; },
    () => { const n = rnd(1, 60); const isEven = n % 2 === 0; return { statement: `${n}は ${isEven ? 'ぐうすう' : 'きすう'}です。`, explain: `一の位が「${n % 10}」だから 合っているね！` }; },
    () => { const [a, b] = commonFactorPair(6, 30); const g = gcdOf(a, b); return { statement: `${a}と${b}の 最大公約数は ${g} です。`, explain: '正しい！約数を書き出して確認できたね。' }; },
  ];
  const v = pick(variants)();
  return {
    character: pick(EH_CHARS), statement: v.statement, isCorrect: true,
    reasonOptions: [], correctReasonIndex: -1, fixHint: '', explain: v.explain,
  };
};

const EH_BUILDERS: EhBuilder[] = [ehZero, ehOnePrime, ehSelf, ehOneDiv, ehSwap, ehSkip, ehOddOdd];
const EH_PRESETS: Record<EhPreset, EhBuilder> = {
  'eh-zero': ehZero, 'eh-one-prime': ehOnePrime, 'eh-self': ehSelf, 'eh-one-div': ehOneDiv,
  'eh-swap': ehSwap, 'eh-skip': ehSkip, 'eh-oddodd': ehOddOdd,
};

export function generateNumError(): NumError {
  if (Math.random() < 0.25) return ehCorrect();
  return pick(EH_BUILDERS)();
}

export function makeNumError(preset: EhPreset): NumError {
  return EH_PRESETS[preset]();
}
