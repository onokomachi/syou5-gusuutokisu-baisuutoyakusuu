/**
 * 単元「偶数と奇数」「倍数と約数」（小学5年）の問題ジェネレーター集。
 *
 * 回答形式は Problem.kind で表す。単に答えを当てるだけでなく、この単元の中核である
 * 「もれなく列挙して 共通部分を取る」という手続きそのものを外化させる形式を用意している。
 *   judge / choice / multi / numeric … 単一の答えを出す形式
 *   list      … 小さい順に□個 書き出す（本番テスト最頻出。再認ではなく再生を要求する）
 *   pairs     … 約数を 1×N, 2×…, とペアで探索する（見落とし防止の技能そのものを指導）
 *   venn      … ベン図に数を振り分ける（公約数の構造を可視化）
 *   steps     … 1問を複数段階に分ける（式の選択 → 値 → 単位つきの答え）
 *   sequence  … 説明の並べかえ（記述させずに「なぜ」を扱う）
 *
 * また strip（倍数の帯）と listPrefill（書き出し欄の一部記入）は「足場」であり、
 * 習熟度に応じて GenericRound 側で段階的に外される（ScaffoldMode 参照）。
 *
 * - even-odd      : 偶数・奇数チェック（一の位判定・大きい数・0の性質・数列・式表現）
 * - even-odd-rule : 偶数・奇数の性質（和・積の予想・逆算・つまずき・理由の説明）
 * - multiples     : 倍数みつけ（□番目・書き出し・判定・選択・範囲内の個数）
 * - lcm           : 公倍数・最小公倍数（求める・書き出し・選ぶ・3数・文章題・しきつめ・通分）
 * - divisors      : 約数みつけ（判定・選択・全部選ぶ・ペア探索・書き出し・個数）
 * - gcd           : 公約数・最大公約数（求める・ベン図・選ぶ・3数・文章題・切り分け・素数・約分）
 * - error-hunter  : 頻出の誤解（0は奇数/1は素数/約数の1と自分自身の抜け/最大公約数と最小公倍数の混同 等）
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

export type ProblemKind = 'judge' | 'choice' | 'multi' | 'numeric' | 'list' | 'pairs' | 'venn' | 'steps' | 'sequence';

/**
 * 足場（scaffold）の段階。習熟度（連続ノーミス数）に応じて自動で外れる。
 * full = 常時表示 / hint = ボタンで任意表示 / none = 足場なし（本番と同じ）
 * 熟達度反転効果（初学者に有効な足場は熟達者には不要）に基づく。
 */
export type ScaffoldMode = 'full' | 'hint' | 'none';

/** 連続ノーミス率（0..1、getMasteryStreak の戻り値）から足場の段階を決める。 */
export function scaffoldFromStreak(streak01: number): ScaffoldMode {
  if (streak01 >= 1) return 'none';   // 5問連続ノーミス＝習熟MAX
  if (streak01 >= 0.6) return 'hint'; // 3〜4問連続
  return 'full';
}

/** 多段階問題（steps）の1ステップ。 */
export interface ProblemStep {
  prompt: string;
  kind: 'choice' | 'numeric';
  choices?: string[];
  answerIndex?: number;
  answerValue?: number;
  unit?: string;
  /** 正解後に示す理由 */
  explain: string;
  hint: string;
}

/** よくある誤答に対する、誤答特異的なフィードバック。 */
export interface Misconception { value: number; message: string; }

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
  answerUnit?: string;

  /** list: 小さい順に書き出す（順序も採点対象） */
  listAnswers?: number[];
  /** 個数があらかじめ決まっているか（「3つ書きましょう」= true /「全部書きましょう」= false） */
  listExact?: boolean;
  /** 足場：先頭何個を最初から埋めておくか（ScaffoldMode が full のときだけ適用） */
  listPrefill?: number;
  /** 部分正答フィードバックの文言を切り替えるための種別 */
  listKind?: 'multiples' | 'common-multiples' | 'divisors';

  /** pairs: 約数のペア探索（1×N から順に相手をうめる） */
  pairTarget?: number;

  /** venn: ベン図に振り分ける */
  vennLeftLabel?: string;
  vennRightLabel?: string;
  vennChips?: number[];
  vennLeftOnly?: number[];
  vennBoth?: number[];
  vennRightOnly?: number[];

  /** steps: 多段階回答 */
  steps?: ProblemStep[];

  /** sequence: 説明の並べかえ（正しい順で格納し、UI側でシャッフルする） */
  sequenceItems?: string[];

  /** 足場：倍数の帯（2数の倍数を並べて共通を探す） */
  strip?: { a: number; b: number; upto: number };

  /** よくある誤答への専用フィードバック */
  misconceptions?: Misconception[];

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
    case 'numeric': a = `${p.answerValue}${p.answerUnit ?? ''}`; break;
    case 'list': a = (p.listAnswers ?? []).join('、 '); break;
    case 'pairs': a = divisorsOf(p.pairTarget ?? 1).join('、 '); break;
    case 'venn':
      a = `${p.vennLeftLabel}のみ:${(p.vennLeftOnly ?? []).join(',')} / 共通:${(p.vennBoth ?? []).join(',')} / ${p.vennRightLabel}のみ:${(p.vennRightOnly ?? []).join(',')}`;
      break;
    case 'steps':
      a = (p.steps ?? []).map((s) => (s.kind === 'choice' ? s.choices![s.answerIndex!] : `${s.answerValue}${s.unit ?? ''}`)).join(' → ');
      break;
    case 'sequence': a = (p.sequenceItems ?? []).map((s, i) => `${i + 1}.${s}`).join(' '); break;
  }
  return { q, a };
}

/* ---------------------------------------------------------------------
 * 出題データを作るための共通ヘルパー
 * ------------------------------------------------------------------- */

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
 * 候補が少ない組み合わせでは count に満たないこともあるが、無限ループにはならない。
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

function twoDistinct(min: number, max: number): [number, number] {
  const a = rnd(min, max);
  let b = rnd(min, max);
  if (b === a) b = b === max ? min : b + 1;
  return [a, b];
}

/** min..max から相異なる3つの数を選ぶ（「6と6と4の最小公倍数」のような重複出題を防ぐ）。 */
function threeDistinct(min: number, max: number): [number, number, number] {
  const pool: number[] = [];
  for (let i = min; i <= max; i++) pool.push(i);
  const s = shuffle(pool).slice(0, 3);
  return [s[0], s[1], s[2]];
}

/**
 * 最大公約数が minGcd 以上になる相異なる2数を、min..max の範囲で作る。
 * 以前の実装は「f の倍数を作ってから Math.max(min, …) で下限に丸める」形だったため、
 * 丸めた瞬間に f の倍数でなくなり、最大公約数が 1 になる（＝「1人に分けられます」という
 * 不自然な文章題が出る）ことがあった。ここでは倍率のほうを範囲内に収め、
 * 最後に実際の gcd を検証してから返す。
 */
function commonFactorPair(min: number, max: number, minGcd = 2): [number, number] {
  for (let attempt = 0; attempt < 300; attempt++) {
    const f = rnd(minGcd, 12);
    const minK = Math.max(1, Math.ceil(min / f));
    const maxK = Math.floor(max / f);
    if (maxK <= minK) continue; // 相異なる2数がとれない
    const ka = rnd(minK, maxK);
    let kb = rnd(minK, maxK);
    if (kb === ka) kb = ka < maxK ? ka + 1 : ka - 1;
    const a = f * ka;
    const b = f * kb;
    if (a < min || b < min || a > max || b > max || a === b) continue;
    if (gcdOf(a, b) < minGcd) continue; // 実際の最大公約数を検証する
    return [a, b];
  }
  return [12, 18]; // 最終手段（gcd=6）。min<=12, max>=18 の呼び出しでのみ到達しうる
}

/** 互いに素な2数の組（しきつめ・切り分け問題で「ちょうど割り切れる枚数」を作るのに使う）。 */
const COPRIME_PAIRS: [number, number][] = [
  [2, 3], [3, 2], [3, 4], [4, 3], [2, 5], [5, 2],
  [3, 5], [5, 3], [4, 5], [5, 4], [5, 6], [6, 5], [2, 7], [7, 2], [3, 7], [7, 3],
];

/* =====================================================================
 * ①偶数・奇数チェック
 * =================================================================== */

export type EvenOddLevel = 'eo-basic' | 'eo-big' | 'eo-zero' | 'eo-seq' | 'eo-expr';

export const EVEN_ODD_LEVELS: { id: EvenOddLevel; label: string; desc: string }[] = [
  { id: 'eo-basic', label: 'きほんの はんてい', desc: '1〜99の数で ぐうすう・きすうを 見分けよう' },
  { id: 'eo-big', label: '大きい数の はんてい', desc: '100〜9999の数も 一の位を見れば わかる！' },
  { id: 'eo-zero', label: '正しい？まちがい？クイズ', desc: '0の せいしつなど、正しいか考えよう' },
  { id: 'eo-seq', label: 'すうれつの あなうめ', desc: 'ぐうすう・きすうだけの数列の □は？' },
  { id: 'eo-expr', label: '2×□ の 形で 書く', desc: 'ぐうすうは2×□、きすうは2×□＋1' },
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
    case 'eo-expr': {
      // 「一の位で見分ける」手続きだけでなく、定義（2でわった余り）に戻って
      // 2×□ / 2×□＋1 と表現できることを扱う。中1「偶数を2n、奇数を2n+1と表す」への接続。
      const n = rnd(10, 99);
      const isEven = n % 2 === 0;
      const k = Math.floor(n / 2);
      const choices = ['ぐうすう', 'きすう'];
      return {
        kind: 'steps',
        prompt: `${n} を 2×□ か 2×□＋1 の 形で 書きましょう。`,
        display: String(n),
        steps: [
          {
            prompt: `${n} は ぐうすう？ きすう？`,
            kind: 'choice', choices, answerIndex: isEven ? 0 : 1,
            hint: `${n} を 2で わると あまりは 出るかな？`,
            explain: isEven
              ? `${n} は 2で わりきれるから ぐうすう。2×□ の形で 書けるよ。`
              : `${n} は 2で わると 1 あまるから きすう。2×□＋1 の形で 書けるよ。`,
          },
          {
            prompt: isEven ? `${n} ＝ 2 × □　□に 入る数は？` : `${n} ＝ 2 × □ ＋ 1　□に 入る数は？`,
            kind: 'numeric', answerValue: k,
            hint: isEven ? `${n} ÷ 2 を 計算しよう。` : `まず 1を ひいてから 2で わろう。(${n}－1) ÷ 2 だよ。`,
            explain: isEven
              ? `${n} ÷ 2 ＝ ${k} だから、2 × ${k} ＝ ${n}。`
              : `(${n} － 1) ÷ 2 ＝ ${k} だから、2 × ${k} ＋ 1 ＝ ${n}。`,
          },
        ],
        hint: 'ぐうすうは 2でわりきれる数、きすうは 2でわると 1あまる数だよ。',
        explain: isEven ? `${n} ＝ 2 × ${k}（ぐうすう）` : `${n} ＝ 2 × ${k} ＋ 1（きすう）`,
        label: isEven ? `${n}=2×${k}` : `${n}=2×${k}+1`,
      };
    }
  }
}

/* =====================================================================
 * ②偶数・奇数のせいしつ
 * =================================================================== */

export type EorLevel = 'eor-add' | 'eor-mul' | 'eor-blank' | 'eor-trap' | 'eor-why';

export const EOR_LEVELS: { id: EorLevel; label: string; desc: string }[] = [
  { id: 'eor-add', label: 'たし算の 結果は？', desc: '計算しなくても ぐうすう・きすうが わかる！' },
  { id: 'eor-mul', label: 'かけ算の 結果は？', desc: 'ぐうすうが 1つでもあれば…？' },
  { id: 'eor-blank', label: '□に あてはまる 数は？', desc: '和が ぐうすう・きすうに なる条件を さがそう' },
  { id: 'eor-trap', label: 'つまずきポイント クイズ', desc: 'よくある かんちがいに 気をつけよう' },
  { id: 'eor-why', label: 'わけを 説明しよう', desc: '説明を 正しい順に ならべかえよう' },
];

function parityLabel(isEven: boolean) { return isEven ? 'ぐうすう' : 'きすう'; }

const EOR_TRAPS = [
  { text: 'きすう＋きすうは、きすうに なる', isTrue: false, explain: 'たとえば 3+5=8。きすう＋きすうは いつも ぐうすうに なるよ。' },
  { text: 'ぐうすう＋ぐうすうは、ぐうすうに なる', isTrue: true, explain: 'たとえば 4+6=10。その通り、ぐうすう＋ぐうすうは いつも ぐうすうだよ。' },
  { text: 'ぐうすう＋きすうは、ぐうすうに なる', isTrue: false, explain: 'たとえば 4+5=9。ぐうすう＋きすうは いつも きすうに なるよ。' },
  { text: 'きすうを 2つ たすと、答えは いつも ぐうすうに なる', isTrue: true, explain: 'その通り！きすう＋きすう＝ぐうすう だよ。' },
  { text: '大きい数どうしの たし算なら、答えは いつも ぐうすうに なる', isTrue: false, explain: '大きさは 関係ないよ。101+3=104(ぐうすう)だけど 101+2=103(きすう)。ぐうすう・きすうの 組み合わせで決まるんだ。' },
  { text: '0は ぐうすうなので、0を たしても ぐうすう・きすうは かわらない', isTrue: true, explain: 'その通り！0は ぐうすうだから、たしても 種類は かわらないよ。' },
];

/** 「なぜそうなるか」を、記述させずに 説明の並べかえで扱う。 */
const EOR_WHY_VARIANTS: { claim: string; steps: string[]; example: string }[] = [
  {
    claim: 'きすう ＋ きすう ＝ ぐうすう',
    steps: [
      'きすうは 2×□＋1 と 書ける',
      'きすう2つを たすと 2×□＋1 ＋ 2×△＋1',
      'まとめると 2×(□＋△＋1) に なる',
      'だから 2で わりきれる ＝ ぐうすう',
    ],
    example: '3＋5＝8、7＋9＝16',
  },
  {
    claim: 'ぐうすう ＋ ぐうすう ＝ ぐうすう',
    steps: [
      'ぐうすうは 2×□ と 書ける',
      'ぐうすう2つを たすと 2×□ ＋ 2×△',
      'まとめると 2×(□＋△) に なる',
      'だから 2で わりきれる ＝ ぐうすう',
    ],
    example: '4＋6＝10、8＋12＝20',
  },
  {
    claim: 'ぐうすう × どんな整数 ＝ ぐうすう',
    steps: [
      'ぐうすうは 2×□ と 書ける',
      'それに 整数△を かけると 2×□×△',
      'まとめると 2×(□×△) に なる',
      'だから 2で わりきれる ＝ ぐうすう',
    ],
    example: '4×3＝12、6×5＝30',
  },
  {
    claim: 'きすう ＋ ぐうすう ＝ きすう',
    steps: [
      'きすうは 2×□＋1、ぐうすうは 2×△ と 書ける',
      'たすと 2×□＋1 ＋ 2×△',
      'まとめると 2×(□＋△) ＋ 1 に なる',
      'だから 2で わると 1 あまる ＝ きすう',
    ],
    example: '3＋4＝7、9＋6＝15',
  },
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
    case 'eor-why': {
      const v = pick(EOR_WHY_VARIANTS);
      return {
        kind: 'sequence',
        prompt: `「${v.claim}」に なる わけを 説明します。正しい順に なるように、上から 順番に タップしましょう。`,
        sequenceItems: v.steps,
        hint: `まず「ぐうすう・きすうは どんな形で 書けるか」から 始めよう。さいごは「だから ○○」で しめくくるよ。（例: ${v.example}）`,
        explain: `${v.steps.join(' → ')}。式に すると、いつでも 成り立つことが 説明できるね。`,
        label: `説明: ${v.claim}`,
      };
    }
  }
}

/* =====================================================================
 * ③倍数みつけ隊
 * =================================================================== */

export type MultiplesLevel = 'mul-basic' | 'mul-list' | 'mul-judge' | 'mul-pick' | 'mul-count';

export const MULTIPLES_LEVELS: { id: MultiplesLevel; label: string; desc: string }[] = [
  { id: 'mul-basic', label: '□番目の 倍数', desc: '3の倍数は 3,6,9…では 10番目は？' },
  { id: 'mul-judge', label: '倍数か どうか はんてい', desc: 'わりきれるか たしかめよう' },
  { id: 'mul-pick', label: '倍数を えらぼう', desc: 'この中から 倍数を ぜんぶ さがそう' },
  { id: 'mul-list', label: '倍数を 書き出そう', desc: '小さい順に 自分で 書き出す（テスト頻出）' },
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
    case 'mul-list': {
      // 単元テスト最頻出の「小さい順に□つ書きましょう」。選択肢からの再認ではなく
      // 自分で数を生成させる（産出効果）ため、候補は一切示さない。
      const b = rnd(2, 12);
      const count = rnd(3, 5);
      const answers = Array.from({ length: count }, (_, i) => b * (i + 1));
      return {
        kind: 'list',
        prompt: `${b}の倍数を、小さい方から 順に ${count}つ 書きましょう。`,
        listAnswers: answers, listExact: true, listPrefill: 1, listKind: 'multiples',
        hint: `${b}の倍数は、${b}を 1倍、2倍、3倍…した数だよ。${b}ずつ たしていこう。`,
        explain: `${b}の倍数は 小さい順に ${answers.join('、 ')}。`,
        label: `${b}の倍数を${count}つ`,
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
        kind: 'numeric', prompt: `1から ${N}までの中に、${b}の倍数は いくつ ありますか？`, answerValue: answer, answerUnit: 'こ',
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

export type LcmLevel = 'lcm-find' | 'lcm-list' | 'lcm-pick' | 'lcm-three' | 'lcm-word' | 'lcm-tile' | 'lcm-fraction';

export const LCM_LEVELS: { id: LcmLevel; label: string; desc: string }[] = [
  { id: 'lcm-find', label: '最小公倍数を もとめる', desc: '2つの数の 倍数を 書き出して さがそう' },
  { id: 'lcm-list', label: '公倍数を 書き出そう', desc: '小さい順に 3つ 書き出す（テスト頻出）' },
  { id: 'lcm-pick', label: '公倍数を えらぼう', desc: 'この中から 2数の公倍数を ぜんぶ さがそう' },
  { id: 'lcm-word', label: '文章題（同時に そろう？）', desc: '最小公倍数の 考え方を つかおう' },
  { id: 'lcm-tile', label: 'タイルで 正方形を つくる', desc: 'しきつめの もんだい（テスト裏面 頻出）' },
  { id: 'lcm-three', label: '3つの数の 最小公倍数（発展）', desc: '2つずつ じゅんに もとめよう' },
  { id: 'lcm-fraction', label: '通分との つながり（発展）', desc: 'なぜ 最小公倍数を 学ぶのかが わかる' },
];

export function generateLcm(level: LcmLevel): Problem {
  switch (level) {
    case 'lcm-find': {
      const [a, b] = twoDistinct(2, 12);
      const l = lcmOf(a, b);
      const g = gcdOf(a, b);
      const misconceptions: Misconception[] = [];
      // この単元 最大の誤概念「最大公約数と最小公倍数の取り違え」を、通常出題でも検出する
      if (g !== l) {
        misconceptions.push({
          value: g,
          message: `おしい！ ${g} は ${a}と${b}の「最大公約数」だね。公約数は もとの数より 小さく、公倍数は もとの数より 大きくなるよ。`,
        });
      }
      if (a * b !== l) {
        misconceptions.push({
          value: a * b,
          message: `${a}×${b}＝${a * b} も たしかに 公倍数だけど、いちばん 小さい 公倍数では ないよ。もっと小さい 共通の倍数が ないか さがそう。`,
        });
      }
      return {
        kind: 'numeric', prompt: `${a}と${b}の 最小公倍数を もとめましょう。`, answerValue: l,
        strip: { a, b, upto: l },
        misconceptions,
        hint: `${a}の倍数（${a}、${a * 2}、${a * 3}…）と ${b}の倍数（${b}、${b * 2}、${b * 3}…）を 書き出して、はじめて出てくる 共通の数を さがそう。`,
        explain: `${a}と${b}の 最小公倍数は ${l}。`, label: `lcm(${a},${b})=${l}`,
      };
    }
    case 'lcm-list': {
      const [a, b] = twoDistinct(2, 9);
      const l = lcmOf(a, b);
      const answers = [l, l * 2, l * 3];
      return {
        kind: 'list',
        prompt: `${a}と${b}の 公倍数を、小さい方から 順に 3つ 書きましょう。`,
        listAnswers: answers, listExact: true, listPrefill: 1, listKind: 'common-multiples',
        strip: { a, b, upto: l * 2 },
        hint: `${a}の倍数と ${b}の倍数を それぞれ 書き出して、共通の数を さがそう。公倍数は 最小公倍数の 倍数に なっているよ。`,
        explain: `${a}と${b}の 最小公倍数は ${l}。公倍数は ${answers.join('、 ')} と つづくよ。`,
        label: `${a}と${b}の公倍数3つ`,
      };
    }
    case 'lcm-pick': {
      const [a, b] = twoDistinct(2, 9);
      const l = lcmOf(a, b);
      const upper = l * 3;
      const commonPool = [l, l * 2, l * 3].filter((x) => x <= upper);
      const chosenCommon = shuffle(commonPool).slice(0, Math.max(1, Math.min(2, commonPool.length)));
      // a・bそれぞれの倍数のうち、もう一方の倍数ではないもの（＝公倍数ではない decoy）を列挙する。
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
      // 「○分おき」は「間隔をおいて」とも読めて曖昧なので、教科書表記にならい「○分ごと」で統一する。
      const scene = pick([
        { unit: 'びょう', text: (x: number, y: number) => `赤いライトは ${x}びょうごとに、青いライトは ${y}びょうごとに 光ります。今、2つとも 同時に 光りました。次に 同時に 光るのは 何びょうごですか？` },
        { unit: '分', text: (x: number, y: number) => `バスAは ${x}分ごとに、バスBは ${y}分ごとに えきを 出発します。今 2台とも 同時に 出発しました。次に 同時に 出発するのは 何分ごですか？` },
        { unit: '日', text: (x: number, y: number) => `太郎さんは ${x}日ごとに、花子さんは ${y}日ごとに 図書館へ 行きます。今日 2人とも 行きました。次に 2人が 同じ日に 行くのは 何日ごですか？` },
      ]);
      return {
        kind: 'numeric', prompt: scene.text(a, b), answerValue: l, answerUnit: scene.unit,
        strip: { a, b, upto: l },
        misconceptions: gcdOf(a, b) !== l
          ? [{ value: gcdOf(a, b), message: `それは ${a}と${b}の「最大公約数」だね。「次に そろうのはいつ？」は 公倍数で 考えるよ。` }]
          : undefined,
        hint: `${a}の倍数と ${b}の倍数で、はじめて 一致する数（＝最小公倍数）を さがそう。`,
        explain: `${a}と${b}の 最小公倍数は ${l}。だから ${l}${scene.unit}ごに 同時に そろうよ。`,
        label: `lcm word(${a},${b})=${l}`,
      };
    }
    case 'lcm-tile': {
      // 単元テスト裏面 最頻出の「しきつめて正方形をつくる」問題。
      // 「1辺は？」に加えて「何まい？」まで問うのが定番なので、多段階で出題する。
      for (let i = 0; i < 300; i++) {
        const tate = rnd(2, 9);
        const yoko = rnd(2, 9);
        if (tate === yoko) continue;
        const side = lcmOf(tate, yoko);
        const rows = side / tate;
        const cols = side / yoko;
        const total = rows * cols;
        if (side > 48 || total > 36) continue; // 児童が数えられる大きさにおさめる
        const choices = shuffle([
          `${tate}と${yoko}の 最小公倍数`,
          `${tate}と${yoko}の 最大公約数`,
          `${tate} × ${yoko}`,
        ]);
        return {
          kind: 'steps',
          prompt: `たて${tate}cm、よこ${yoko}cm の 長方形のタイルを、同じ向きに すきまなく ならべて、できるだけ 小さい 正方形を 作ります。`,
          steps: [
            {
              prompt: 'この問題は、何を もとめる 問題ですか？',
              kind: 'choice', choices, answerIndex: choices.indexOf(`${tate}と${yoko}の 最小公倍数`),
              hint: '正方形の1辺は、たて（○cmずつ）にも よこ（△cmずつ）にも ぴったり ならぶ長さだよ。それは 何と よばれる数かな？',
              explain: `1辺の長さは たて${tate}cm でも よこ${yoko}cm でも ぴったりに なる長さ＝公倍数。いちばん小さい 正方形だから 最小公倍数だね。`,
            },
            {
              prompt: '正方形の 1辺は 何cmに なりますか？',
              kind: 'numeric', answerValue: side, unit: 'cm',
              hint: `${tate}の倍数と ${yoko}の倍数を 書き出して、はじめて そろう数を さがそう。`,
              explain: `${tate}と${yoko}の 最小公倍数は ${side}。1辺は ${side}cm。`,
            },
            {
              prompt: 'タイルは 何まい 必要ですか？',
              kind: 'numeric', answerValue: total, unit: 'まい',
              hint: `たてに 何まい ならぶ？（${side} ÷ ${tate}）　よこに 何まい ならぶ？（${side} ÷ ${yoko}）`,
              explain: `たてに ${side}÷${tate}＝${rows}まい、よこに ${side}÷${yoko}＝${cols}まい。${rows}×${cols}＝${total}まい。`,
            },
          ],
          hint: '正方形は たてと よこの 長さが 等しい形だよ。',
          explain: `1辺 ${side}cm の 正方形が でき、タイルは ${total}まい（${rows}×${cols}）必要。`,
          label: `タイル ${tate}×${yoko} → 1辺${side}cm・${total}まい`,
        };
      }
      return generateLcm('lcm-find');
    }
    case 'lcm-three': {
      // 以前は3つとも独立に抽選していたため「6と6と4」のような重複出題が
      // 約4割の確率で起きていた。相異なる3数にし、答えが大きくなりすぎないよう制限する。
      for (let i = 0; i < 300; i++) {
        const [a, b, c] = threeDistinct(2, 9);
        const lab = lcmOf(a, b);
        const labc = lcmOf(lab, c);
        if (labc > 120) continue;
        return {
          kind: 'numeric', prompt: `${a}と${b}と${c}の 最小公倍数を もとめましょう。`, answerValue: labc,
          hint: `まず ${a}と${b}の 最小公倍数を もとめて、その数と ${c}の 最小公倍数を もとめよう。`,
          explain: `${a}と${b}の最小公倍数は ${lab}。${lab}と${c}の最小公倍数は ${labc}。`,
          label: `lcm(${a},${b},${c})=${labc}`,
        };
      }
      return generateLcm('lcm-find');
    }
    case 'lcm-fraction': {
      // 「なぜ最小公倍数を学ぶのか」を、次の単元（分数のたし算）への橋渡しで示す。
      const [a, b] = twoDistinct(2, 9);
      const l = lcmOf(a, b);
      const na = l / a;
      return {
        kind: 'steps',
        prompt: `1/${a} と 1/${b} を 通分します（分母を そろえます）。`,
        steps: [
          {
            prompt: `分母を そろえるとき、いちばん 小さい 共通の分母は いくつですか？`,
            kind: 'numeric', answerValue: l,
            hint: `${a}でも ${b}でも わりきれる いちばん小さい数＝${a}と${b}の 最小公倍数だよ。`,
            explain: `${a}と${b}の 最小公倍数は ${l}。だから 共通の分母は ${l}。`,
          },
          {
            prompt: `1/${a} を 分母 ${l} の 分数に すると、分子は いくつに なりますか？`,
            kind: 'numeric', answerValue: na,
            hint: `分母が ${a} → ${l} と ${l / a}倍に なったね。分子も 同じだけ かけよう。`,
            explain: `${l} ÷ ${a} ＝ ${na} なので、1/${a} ＝ ${na}/${l}。`,
          },
        ],
        hint: '通分は「分母の 最小公倍数に そろえる」こと。だから 最小公倍数が 役に立つんだ。',
        explain: `1/${a} ＝ ${na}/${l}、1/${b} ＝ ${l / b}/${l}。分母の 最小公倍数 ${l} に そろえたよ。`,
        label: `通分 1/${a}と1/${b} → 分母${l}`,
      };
    }
  }
}

/* =====================================================================
 * ⑤約数みつけ隊
 * =================================================================== */

export type DivisorsLevel = 'div-judge' | 'div-pick' | 'div-all' | 'div-pairs' | 'div-list' | 'div-count';

export const DIVISORS_LEVELS: { id: DivisorsLevel; label: string; desc: string }[] = [
  { id: 'div-judge', label: '約数か どうか はんてい', desc: 'わりきれるか たしかめよう' },
  { id: 'div-pick', label: '約数を えらぼう', desc: 'この中から 約数を ぜんぶ さがそう' },
  { id: 'div-all', label: '1から順に たしかめる', desc: '1から その数まで ぜんぶ しらべよう' },
  { id: 'div-pairs', label: 'ペアで さがそう', desc: '1×○、2×○…と ペアで もれなく さがす' },
  { id: 'div-list', label: '約数を 書き出そう', desc: '自分で ぜんぶ 書き出す（テスト頻出）' },
  { id: 'div-count', label: '約数は 何こ？', desc: 'ペアで さがすと 見落としが 少ないよ' },
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
    case 'div-all': {
      const N = rnd(12, 24);
      const divs = divisorsOf(N);
      const candidates = Array.from({ length: N }, (_, i) => i + 1);
      const answerIndices = candidates.map((c, i) => ({ c, i })).filter((x) => N % x.c === 0).map((x) => x.i);
      return {
        kind: 'multi', prompt: `1から ${N}までの中から、${N}の約数を ぜんぶ えらぼう。`,
        choices: candidates.map(String), answerIndices,
        hint: `1から 順に ${N} を わってみよう。1と ${N}自身も わすれずに。`,
        explain: `${N}の約数は ${divs.join('、 ')}。`,
        label: `${N}の約数を全部さがす`,
      };
    }
    case 'div-pairs': {
      // 約数の見落としを防ぐ核心技能（1×N, 2×…, とペアで探す）を、
      // ヒント文で言うだけでなく UI の手続きそのものとして指導する。
      const N = pick([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 50, 54, 56, 60, 64]);
      const divs = divisorsOf(N);
      return {
        kind: 'pairs',
        prompt: `${N}の約数を、ペアで さがしましょう。`,
        display: String(N),
        pairTarget: N,
        hint: `「○ × □ ＝ ${N}」に なる □を 入れよう。わりきれないときは「わりきれない」を おしてね。`,
        explain: `${N}の約数は ${divs.join('、 ')} の ${divs.length}こ。ペアで さがすと 見落とさないね。`,
        label: `${N}の約数をペアでさがす`,
      };
    }
    case 'div-list': {
      const N = rnd(12, 48);
      const divs = divisorsOf(N);
      return {
        kind: 'list',
        prompt: `${N}の約数を、小さい方から 順に ぜんぶ 書きましょう。`,
        listAnswers: divs, listExact: false, listPrefill: 1, listKind: 'divisors',
        hint: `1×${N}、2×…、3×… と ペアで 考えると、ぬけなく さがせるよ。1と ${N}自身も 約数だよ。`,
        explain: `${N}の約数は ${divs.join('、 ')}（${divs.length}こ）。`,
        label: `${N}の約数を書き出す`,
      };
    }
    case 'div-count': {
      const N = rnd(12, 60);
      const divs = divisorsOf(N);
      return {
        kind: 'numeric', prompt: `${N}の約数は ぜんぶで 何こ ありますか？`, answerValue: divs.length, answerUnit: 'こ',
        hint: `1×${N}、2×？…のように ペアで さがすと 見落としが 少ないよ。`,
        explain: `${N}の約数は ${divs.join('、 ')}で、${divs.length}こ あるよ。`,
        label: `${N}の約数の数=${divs.length}`,
      };
    }
  }
}

/* =====================================================================
 * ⑥公約数・最大公約数
 * =================================================================== */

export type GcdLevel = 'gcd-find' | 'gcd-venn' | 'gcd-pick' | 'gcd-three' | 'gcd-word' | 'gcd-cut' | 'gcd-prime' | 'gcd-fraction';

export const GCD_LEVELS: { id: GcdLevel; label: string; desc: string }[] = [
  { id: 'gcd-find', label: '最大公約数を もとめる', desc: '2つの数の 約数を 書き出して さがそう' },
  { id: 'gcd-venn', label: 'ベン図で 整理しよう', desc: '2つの約数を 図に 分けて 見える化' },
  { id: 'gcd-pick', label: '公約数を えらぼう', desc: 'この中から 2数の公約数を ぜんぶ さがそう' },
  { id: 'gcd-word', label: '文章題（あまりなく 分ける）', desc: '最大公約数の 考え方を つかおう' },
  { id: 'gcd-cut', label: '正方形に 切り分ける', desc: '切り分けの もんだい（テスト裏面 頻出）' },
  { id: 'gcd-three', label: '3つの数の 最大公約数（発展）', desc: '2つずつ じゅんに もとめよう' },
  { id: 'gcd-prime', label: '素数(そすう)は どれ？（発展）', desc: '約数が 2こだけの数を 見ぬこう' },
  { id: 'gcd-fraction', label: '約分との つながり（発展）', desc: 'なぜ 最大公約数を 学ぶのかが わかる' },
];

export function generateGcd(level: GcdLevel): Problem {
  switch (level) {
    case 'gcd-find': {
      const [a, b] = commonFactorPair(6, 48);
      const g = gcdOf(a, b);
      const l = lcmOf(a, b);
      return {
        kind: 'numeric', prompt: `${a}と${b}の 最大公約数を もとめましょう。`, answerValue: g,
        misconceptions: [{
          value: l,
          message: `おしい！ ${l} は ${a}と${b}の「最小公倍数」だね。公倍数は もとの数より 大きく、公約数は もとの数より 小さくなるよ。`,
        }],
        hint: `${a}の約数と ${b}の約数を 書き出して、いちばん大きい 共通の数を さがそう。`,
        explain: `${a}の約数：${divisorsOf(a).join('、 ')}／${b}の約数：${divisorsOf(b).join('、 ')}。共通で いちばん大きいのは ${g}。`,
        label: `gcd(${a},${b})=${g}`,
      };
    }
    case 'gcd-venn': {
      // 公約数の構造（＝2つの約数の集合の重なり）を視覚的に整理する。
      const [a, b] = commonFactorPair(8, 36);
      const da = divisorsOf(a);
      const db = divisorsOf(b);
      const both = da.filter((x) => db.includes(x));
      const leftOnly = da.filter((x) => !db.includes(x));
      const rightOnly = db.filter((x) => !da.includes(x));
      const g = gcdOf(a, b);
      return {
        kind: 'venn',
        prompt: `${a}の約数と ${b}の約数を、ベン図に 分けて 入れましょう。`,
        vennLeftLabel: `${a}だけ`,
        vennRightLabel: `${b}だけ`,
        vennChips: shuffle([...new Set([...da, ...db])]),
        vennLeftOnly: leftOnly, vennBoth: both, vennRightOnly: rightOnly,
        hint: `${a}の約数は ${da.join('、 ')}、${b}の約数は ${db.join('、 ')}。両方に あるものが「まん中」だよ。`,
        explain: `まん中（公約数）は ${both.join('、 ')}。その中で いちばん大きい ${g} が 最大公約数だよ。公約数は ぜんぶ ${g}の約数に なっているね。`,
        label: `ベン図 ${a}と${b}の約数`,
      };
    }
    case 'gcd-pick': {
      const [a, b] = commonFactorPair(8, 36);
      const g = gcdOf(a, b);
      const commonDivs = divisorsOf(g);
      const chosenCommon = shuffle(commonDivs).slice(0, Math.min(commonDivs.length, rnd(2, 4)));
      const decoySet = collectUpTo(Math.max(2, 6 - chosenCommon.length), () => rnd(2, Math.max(a, b)), 300, (v) => a % v !== 0 || b % v !== 0);
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
    case 'gcd-three': {
      for (let i = 0; i < 300; i++) {
        const g = rnd(2, 9);
        const [k1, k2, k3] = threeDistinct(1, 6);
        const a = g * k1, b = g * k2, c = g * k3;
        if (a > 90 || b > 90 || c > 90) continue;
        if (gcdOf(gcdOf(k1, k2), k3) !== 1) continue; // 最大公約数が ちょうど g になるようにする
        const answer = gcdOf(gcdOf(a, b), c);
        return {
          kind: 'numeric', prompt: `${a}と${b}と${c}の 最大公約数を もとめましょう。`, answerValue: answer,
          hint: `まず ${a}と${b}の 最大公約数を もとめて、その数と ${c}の 最大公約数を もとめよう。`,
          explain: `${a}と${b}の最大公約数は ${gcdOf(a, b)}。それと ${c}の最大公約数は ${answer}。`,
          label: `gcd(${a},${b},${c})=${answer}`,
        };
      }
      return generateGcd('gcd-find');
    }
    case 'gcd-word': {
      const [a, b] = commonFactorPair(8, 48);
      const g = gcdOf(a, b);
      const scene = pick([
        { text: (x: number, y: number) => `あめが ${x}こ、クッキーが ${y}こ あります。あめも クッキーも あまりが 出ないように、できるだけ 多くの子どもに 同じ数ずつ 分けます。何人に 分けられますか？`, unit: '人' },
        { text: (x: number, y: number) => `色紙が ${x}まい、シールが ${y}まい あります。どちらも あまりが 出ないように、できるだけ 多くの ふくろに 同じ数ずつ 入れます。何ふくろ できますか？`, unit: 'ふくろ' },
      ]);
      return {
        kind: 'numeric', prompt: scene.text(a, b), answerValue: g, answerUnit: scene.unit,
        misconceptions: [{
          value: lcmOf(a, b),
          message: `それは「最小公倍数」だね。「あまりなく 分ける」＝ どちらも わりきれる数だから、公約数で 考えるよ。`,
        }],
        hint: `「あまりなく分ける」「できるだけ多く」は 最大公約数の 考え方だよ。${a}と${b}の 公約数の中で いちばん大きい数を さがそう。`,
        explain: `${a}と${b}の 最大公約数は ${g}。だから ${g}${scene.unit}に 分けられるよ（1人分は あめ ${a / g}こ、クッキー ${b / g}こ）。`,
        label: `gcd word(${a},${b})=${g}`,
      };
    }
    case 'gcd-cut': {
      // 単元テスト裏面 最頻出の「あまりなく正方形に切り分ける」問題。多段階で出題する。
      const g = rnd(3, 12);
      const [p, q] = pick(COPRIME_PAIRS);
      const tate = g * p;
      const yoko = g * q;
      const total = p * q;
      const choices = shuffle([
        `${tate}と${yoko}の 最大公約数`,
        `${tate}と${yoko}の 最小公倍数`,
        `${tate} － ${yoko}`,
      ]);
      return {
        kind: 'steps',
        prompt: `たて${tate}cm、よこ${yoko}cm の 長方形の紙を、あまりが 出ないように、同じ大きさの できるだけ 大きい 正方形に 切り分けます。`,
        steps: [
          {
            prompt: 'この問題は、何を もとめる 問題ですか？',
            kind: 'choice', choices, answerIndex: choices.indexOf(`${tate}と${yoko}の 最大公約数`),
            hint: '正方形の1辺は、たての長さも よこの長さも ちょうど わりきれる 長さだよ。それは 何と よばれる数かな？',
            explain: `1辺の長さは たて${tate}cm も よこ${yoko}cm も わりきれる数＝公約数。できるだけ大きい 正方形だから 最大公約数だね。`,
          },
          {
            prompt: '正方形の 1辺は 何cmに なりますか？',
            kind: 'numeric', answerValue: g, unit: 'cm',
            hint: `${tate}の約数と ${yoko}の約数を 書き出して、共通で いちばん大きい数を さがそう。`,
            explain: `${tate}と${yoko}の 最大公約数は ${g}。1辺は ${g}cm。`,
          },
          {
            prompt: '正方形は 何まい できますか？',
            kind: 'numeric', answerValue: total, unit: 'まい',
            hint: `たてに 何まい ならぶ？（${tate} ÷ ${g}）　よこに 何まい ならぶ？（${yoko} ÷ ${g}）`,
            explain: `たてに ${tate}÷${g}＝${p}まい、よこに ${yoko}÷${g}＝${q}まい。${p}×${q}＝${total}まい。`,
          },
        ],
        hint: 'あまりが 出ない＝どちらの長さも わりきれる、ということだよ。',
        explain: `1辺 ${g}cm の 正方形が ${total}まい（${p}×${q}）できるよ。`,
        label: `切り分け ${tate}×${yoko} → 1辺${g}cm・${total}まい`,
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
    case 'gcd-fraction': {
      // 「なぜ最大公約数を学ぶのか」を、次の単元（約分）への橋渡しで示す。
      const g = rnd(2, 9);
      const [p, q] = pick(COPRIME_PAIRS.filter(([x, y]) => x < y));
      const num = g * p;
      const den = g * q;
      return {
        kind: 'steps',
        prompt: `分数 ${num}/${den} を、これ以上 約分できない 形まで 約分します。`,
        steps: [
          {
            prompt: `分子 ${num} と 分母 ${den} の 最大公約数は いくつですか？`,
            kind: 'numeric', answerValue: g,
            hint: `${num}の約数と ${den}の約数を 書き出して、共通で いちばん大きい数を さがそう。`,
            explain: `${num}と${den}の 最大公約数は ${g}。この数で わると 一気に 約分できるよ。`,
          },
          {
            prompt: `${g} で わって 約分すると、分子は いくつに なりますか？`,
            kind: 'numeric', answerValue: p,
            hint: `${num} ÷ ${g} を 計算しよう。`,
            explain: `${num} ÷ ${g} ＝ ${p}。`,
          },
          {
            prompt: `分母は いくつに なりますか？`,
            kind: 'numeric', answerValue: q,
            hint: `${den} ÷ ${g} を 計算しよう。`,
            explain: `${den} ÷ ${g} ＝ ${q}。`,
          },
        ],
        hint: '約分は「分子と分母を 同じ数で わる」こと。最大公約数で わると 1回で いちばん簡単な形に なるよ。',
        explain: `${num}/${den} ＝ ${p}/${q}（最大公約数 ${g} で わった）。だから 最大公約数が 役に立つんだ。`,
        label: `約分 ${num}/${den}=${p}/${q}`,
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
