/**
 * プロパティテスト。
 * 前回は「答えの自己整合性」しか見ておらず、最大公約数が1になる不自然な文章題や
 * 3数の重複出題を見逃した。今回は教育的な妥当性（degenerate な出題が出ないこと）も検証する。
 */
import {
  gcdOf, lcmOf, divisorsOf, isPrime,
  EVEN_ODD_LEVELS, generateEvenOdd,
  EOR_LEVELS, generateEor,
  MULTIPLES_LEVELS, generateMultiples,
  LCM_LEVELS, generateLcm,
  DIVISORS_LEVELS, generateDivisors,
  GCD_LEVELS, generateGcd,
  generateNumError, makeNumError, EhPreset,
  Problem, describeProblem, scaffoldFromStreak,
} from '../src/lib/problems';
import { TEST_STEPS, OMOTE_MAX, URA_MAX } from '../src/lib/testConfig';

let failures = 0;
const seen = new Set<string>();
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failures++;
    if (!seen.has(msg.slice(0, 60))) { seen.add(msg.slice(0, 60)); console.error('FAIL:', msg); }
  }
}

/* ---------- ヘルパーの単体確認 ---------- */
assert(gcdOf(12, 18) === 6, 'gcdOf(12,18)===6');
assert(lcmOf(4, 6) === 12, 'lcmOf(4,6)===12');
assert(JSON.stringify(divisorsOf(28)) === JSON.stringify([1, 2, 4, 7, 14, 28]), 'divisorsOf(28)');
assert(isPrime(1) === false && isPrime(2) === true && isPrime(9) === false && isPrime(17) === true, 'isPrime basics');
assert(scaffoldFromStreak(0) === 'full' && scaffoldFromStreak(0.6) === 'hint' && scaffoldFromStreak(1) === 'none', 'scaffoldFromStreak');

/* ---------- 構造の共通検証 ---------- */
function checkStructure(p: Problem, ctx: string) {
  assert(typeof p.prompt === 'string' && p.prompt.length > 0, `${ctx}: prompt`);
  assert(typeof p.hint === 'string' && p.hint.length > 0, `${ctx}: hint`);
  assert(typeof p.explain === 'string' && p.explain.length > 0, `${ctx}: explain`);
  assert(typeof p.label === 'string' && p.label.length > 0, `${ctx}: label`);

  // 学習のきろく用の要約が、どの形式でも作れること
  const d = describeProblem(p);
  assert(d.q.length > 0 && d.a.length > 0, `${ctx}: describeProblem`);

  // 誤答特異フィードバックは「本当に誤答」でなければならない（正解を誤答扱いしない）
  (p.misconceptions ?? []).forEach((m) => {
    assert(m.value !== p.answerValue, `${ctx}: misconception ${m.value} equals the correct answer`);
    assert(m.message.length > 0, `${ctx}: misconception message empty`);
  });

  switch (p.kind) {
    case 'judge':
      assert(!!p.judgeLabels && p.judgeLabels.length === 2, `${ctx}: judgeLabels length 2`);
      assert(typeof p.judgeAnswer === 'boolean', `${ctx}: judgeAnswer boolean`);
      break;
    case 'choice':
      assert(!!p.choices && p.choices.length >= 2, `${ctx}: choices >=2`);
      assert(p.answerIndex !== undefined && p.answerIndex >= 0 && p.answerIndex < (p.choices?.length ?? 0), `${ctx}: answerIndex range`);
      assert(new Set(p.choices).size === (p.choices ?? []).length, `${ctx}: choices unique`);
      break;
    case 'multi': {
      const idx = p.answerIndices ?? [];
      assert(!!p.choices && p.choices.length >= 2, `${ctx}: multi choices >=2`);
      assert(idx.length >= 1, `${ctx}: multi answerIndices >=1`);
      assert(new Set(idx).size === idx.length, `${ctx}: multi answerIndices unique`);
      idx.forEach((i) => assert(i >= 0 && i < (p.choices?.length ?? 0), `${ctx}: multi index range`));
      assert(new Set(p.choices).size === (p.choices ?? []).length, `${ctx}: multi choices values unique`);
      break;
    }
    case 'numeric':
      assert(typeof p.answerValue === 'number' && Number.isInteger(p.answerValue) && p.answerValue > 0, `${ctx}: numeric answerValue`);
      break;
    case 'list': {
      const ans = p.listAnswers ?? [];
      assert(ans.length >= 2, `${ctx}: list answers >=2`);
      assert(ans.every((v, i) => i === 0 || v > ans[i - 1]), `${ctx}: list must be strictly ascending (${ans.join(',')})`);
      assert(ans.every((v) => Number.isInteger(v) && v > 0), `${ctx}: list values positive int`);
      // 足場で見せる分が 答えを全部見せてしまわないこと
      assert((p.listPrefill ?? 0) < ans.length, `${ctx}: listPrefill must be < answer count`);
      break;
    }
    case 'pairs':
      assert(typeof p.pairTarget === 'number' && p.pairTarget > 1, `${ctx}: pairTarget`);
      break;
    case 'venn': {
      const l = p.vennLeftOnly ?? [], b = p.vennBoth ?? [], r = p.vennRightOnly ?? [];
      const chips = p.vennChips ?? [];
      assert(b.length >= 1, `${ctx}: venn both >=1 (1は必ず共通)`);
      assert(chips.length === l.length + b.length + r.length, `${ctx}: venn chips == sum of zones`);
      assert(new Set(chips).size === chips.length, `${ctx}: venn chips unique`);
      const union = [...l, ...b, ...r].sort((x, y) => x - y);
      assert(JSON.stringify(union) === JSON.stringify([...chips].sort((x, y) => x - y)), `${ctx}: venn zones cover chips exactly`);
      break;
    }
    case 'steps': {
      const st = p.steps ?? [];
      assert(st.length >= 2, `${ctx}: steps >=2`);
      st.forEach((s, i) => {
        assert(s.prompt.length > 0 && s.explain.length > 0 && s.hint.length > 0, `${ctx}: step${i} texts`);
        if (s.kind === 'choice') {
          assert(!!s.choices && s.choices.length >= 2, `${ctx}: step${i} choices`);
          assert(s.answerIndex !== undefined && s.answerIndex >= 0 && s.answerIndex < s.choices!.length, `${ctx}: step${i} answerIndex range`);
          assert(new Set(s.choices).size === s.choices!.length, `${ctx}: step${i} choices unique`);
        } else {
          assert(typeof s.answerValue === 'number' && Number.isInteger(s.answerValue) && s.answerValue > 0, `${ctx}: step${i} answerValue`);
        }
      });
      break;
    }
    case 'sequence': {
      const items = p.sequenceItems ?? [];
      assert(items.length >= 3, `${ctx}: sequence items >=3`);
      assert(new Set(items).size === items.length, `${ctx}: sequence items unique`);
      break;
    }
  }
}

const N = 2000;

/* ---------- even-odd ---------- */
for (const lv of EVEN_ODD_LEVELS) {
  for (let i = 0; i < N; i++) {
    const p = generateEvenOdd(lv.id);
    checkStructure(p, `eo:${lv.id}`);
    if (lv.id === 'eo-basic' || lv.id === 'eo-big') {
      const m = p.label.match(/^(\d+) は (ぐうすう|きすう)$/);
      assert(!!m, `eo label: ${p.label}`);
      if (m) {
        const n = Number(m[1]);
        assert((n % 2 === 0) === (m[2] === 'ぐうすう'), `eo parity n=${n}`);
        assert(p.judgeAnswer === (n % 2 === 0), 'eo judgeAnswer matches');
      }
    }
    if (lv.id === 'eo-seq') {
      const parts = p.label.split('、 ').map((s) => Number(s.trim()));
      for (let k = 1; k < parts.length; k++) assert(parts[k] - parts[k - 1] === 2, `eo-seq step: ${p.label}`);
    }
    if (lv.id === 'eo-expr') {
      // 2×k または 2×k+1 が もとの数に 戻ること
      const m = p.label.match(/^(\d+)=2×(\d+)(\+1)?$/);
      assert(!!m, `eo-expr label: ${p.label}`);
      if (m) {
        const n = Number(m[1]), k = Number(m[2]), plus = m[3] ? 1 : 0;
        assert(2 * k + plus === n, `eo-expr identity: ${p.label}`);
        assert((plus === 0) === (n % 2 === 0), `eo-expr parity form: ${p.label}`);
        assert(p.steps![1].answerValue === k, 'eo-expr step2 value');
      }
    }
  }
}

/* ---------- even-odd-rule ---------- */
for (const lv of EOR_LEVELS) {
  for (let i = 0; i < N; i++) {
    const p = generateEor(lv.id);
    checkStructure(p, `eor:${lv.id}`);
    if (lv.id === 'eor-add') {
      const m = p.label.match(/^(\d+)\+(\d+)=(\d+)$/);
      assert(!!m, `eor-add label: ${p.label}`);
      if (m) {
        const [a, b, sum] = [Number(m[1]), Number(m[2]), Number(m[3])];
        assert(a + b === sum, 'eor-add sum');
        assert(p.answerIndex === (sum % 2 === 0 ? 0 : 1), 'eor-add answerIndex');
      }
    }
    if (lv.id === 'eor-mul') {
      const m = p.label.match(/^(\d+)×(\d+)=(\d+)$/);
      assert(!!m, `eor-mul label: ${p.label}`);
      if (m) {
        const [x, y, prod] = [Number(m[1]), Number(m[2]), Number(m[3])];
        assert(x * y === prod, 'eor-mul product');
        assert(p.answerIndex === (prod % 2 === 0 ? 0 : 1), 'eor-mul answerIndex');
      }
    }
    if (lv.id === 'eor-blank') {
      const m = p.label.match(/^□\+(ぐうすう|きすう)=(ぐうすう|きすう)$/);
      assert(!!m, `eor-blank label: ${p.label}`);
      if (m) {
        const needEven = (m[1] === 'きすう') === (m[2] === 'きすう');
        assert(p.answerIndex === (needEven ? 0 : 1), `eor-blank logic: ${p.label}`);
      }
    }
    if (lv.id === 'eor-why') {
      // さいごの一文は必ず結論、さいしょは「〜と書ける」で始まる
      const items = p.sequenceItems!;
      assert(items[0].includes('書ける'), `eor-why first item: ${items[0]}`);
      assert(items[items.length - 1].startsWith('だから'), `eor-why last item: ${items[items.length - 1]}`);
    }
  }
}

/* ---------- multiples ---------- */
for (const lv of MULTIPLES_LEVELS) {
  for (let i = 0; i < N; i++) {
    const p = generateMultiples(lv.id);
    checkStructure(p, `mul:${lv.id}`);
    if (lv.id === 'mul-basic') {
      const m = p.label.match(/^(\d+)の倍数の(\d+)番目=(\d+)$/);
      assert(!!m, `mul-basic label: ${p.label}`);
      if (m) assert(Number(m[1]) * Number(m[2]) === Number(m[3]), 'mul-basic correctness');
    }
    if (lv.id === 'mul-list') {
      const ans = p.listAnswers!;
      const b = ans[0];
      assert(ans.every((v, k) => v === b * (k + 1)), `mul-list must be b,2b,3b...: ${ans.join(',')}`);
      assert(p.listExact === true, 'mul-list exact');
    }
    if (lv.id === 'mul-judge') {
      const m = p.label.match(/^(\d+)は(\d+)の倍数か=(はい|いいえ)$/);
      assert(!!m, `mul-judge label: ${p.label}`);
      if (m) assert((Number(m[1]) % Number(m[2]) === 0) === (m[3] === 'はい'), 'mul-judge correctness');
    }
    if (lv.id === 'mul-pick') {
      const em = p.explain.match(/^(\d+)の倍数は/);
      assert(!!em, `mul-pick explain: ${p.explain}`);
      if (em) {
        const b = Number(em[1]);
        (p.choices ?? []).forEach((c, k) => assert((Number(c) % b === 0) === (p.answerIndices ?? []).includes(k), `mul-pick membership c=${c} b=${b}`));
      }
    }
    if (lv.id === 'mul-count') {
      const m = p.label.match(/^1~(\d+)の(\d+)の倍数の数=(\d+)$/);
      assert(!!m, `mul-count label: ${p.label}`);
      if (m) assert(Math.floor(Number(m[1]) / Number(m[2])) === Number(m[3]), 'mul-count correctness');
    }
  }
}

/* ---------- lcm ---------- */
for (const lv of LCM_LEVELS) {
  for (let i = 0; i < N; i++) {
    const p = generateLcm(lv.id);
    checkStructure(p, `lcm:${lv.id}`);
    // 足場の帯は、実際に答えに届くところまで出せる設定になっていること
    if (p.strip) assert(p.strip.upto >= lcmOf(p.strip.a, p.strip.b), `lcm:${lv.id} strip.upto reaches lcm`);
    if (lv.id === 'lcm-find') {
      const m = p.label.match(/^lcm\((\d+),(\d+)\)=(\d+)$/);
      assert(!!m, `lcm-find label: ${p.label}`);
      if (m) {
        const [a, b, l] = [Number(m[1]), Number(m[2]), Number(m[3])];
        assert(a !== b, 'lcm-find distinct');
        assert(lcmOf(a, b) === l && l === p.answerValue, 'lcm-find correctness');
      }
    }
    if (lv.id === 'lcm-list') {
      const ans = p.listAnswers!;
      assert(ans.length === 3, 'lcm-list 3 items');
      assert(ans[1] === ans[0] * 2 && ans[2] === ans[0] * 3, `lcm-list must be l,2l,3l: ${ans.join(',')}`);
    }
    if (lv.id === 'lcm-pick') {
      const em = p.explain.match(/最小公倍数は (\d+)/);
      assert(!!em, `lcm-pick explain: ${p.explain}`);
      if (em) {
        const l = Number(em[1]);
        (p.choices ?? []).forEach((c, k) => assert((Number(c) % l === 0) === (p.answerIndices ?? []).includes(k), `lcm-pick membership c=${c} l=${l}`));
      }
    }
    if (lv.id === 'lcm-word') {
      const m = p.label.match(/^lcm word\((\d+),(\d+)\)=(\d+)$/);
      assert(!!m, `lcm-word label: ${p.label}`);
      if (m) assert(lcmOf(Number(m[1]), Number(m[2])) === Number(m[3]), 'lcm-word correctness');
      // 「○分おき」は曖昧なので使わない（教科書表記の「ごと」で統一）
      assert(!p.prompt.includes('おき'), `lcm-word must not use 「おき」: ${p.prompt}`);
      // 単位の食い違い（「何日ごですか？」の解説が「12回ごに」になる等）がないこと
      const unitInPrompt = p.prompt.match(/何(びょう|分|日)ご/);
      assert(!!unitInPrompt, `lcm-word prompt unit: ${p.prompt}`);
      if (unitInPrompt) assert(p.explain.includes(`${p.answerValue}${unitInPrompt[1]}ごに`), `lcm-word unit mismatch: ${p.explain}`);
    }
    if (lv.id === 'lcm-tile') {
      const m = p.label.match(/^タイル (\d+)×(\d+) → 1辺(\d+)cm・(\d+)まい$/);
      assert(!!m, `lcm-tile label: ${p.label}`);
      if (m) {
        const [t, y, side, total] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
        assert(t !== y, 'lcm-tile distinct sides');
        assert(lcmOf(t, y) === side, `lcm-tile side must be lcm: ${p.label}`);
        assert((side / t) * (side / y) === total, `lcm-tile tile count: ${p.label}`);
        assert(Number.isInteger(side / t) && Number.isInteger(side / y), 'lcm-tile divides evenly');
        assert(total <= 36 && side <= 48, `lcm-tile size sane: ${p.label}`);
        assert(p.steps![1].answerValue === side && p.steps![2].answerValue === total, 'lcm-tile steps values');
      }
    }
    if (lv.id === 'lcm-three') {
      const m = p.label.match(/^lcm\((\d+),(\d+),(\d+)\)=(\d+)$/);
      assert(!!m, `lcm-three label: ${p.label}`);
      if (m) {
        const [a, b, c, v] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
        assert(a !== b && b !== c && a !== c, `lcm-three must be 3 distinct numbers: ${p.label}`);
        assert(lcmOf(lcmOf(a, b), c) === v, 'lcm-three correctness');
        assert(v <= 120, `lcm-three not too large: ${p.label}`);
      }
    }
    if (lv.id === 'lcm-fraction') {
      const m = p.label.match(/^通分 1\/(\d+)と1\/(\d+) → 分母(\d+)$/);
      assert(!!m, `lcm-fraction label: ${p.label}`);
      if (m) {
        const [a, b, l] = [Number(m[1]), Number(m[2]), Number(m[3])];
        assert(lcmOf(a, b) === l, 'lcm-fraction denominator is lcm');
        assert(p.steps![1].answerValue === l / a, 'lcm-fraction numerator');
      }
    }
  }
}

/* ---------- divisors ---------- */
for (const lv of DIVISORS_LEVELS) {
  for (let i = 0; i < N; i++) {
    const p = generateDivisors(lv.id);
    checkStructure(p, `div:${lv.id}`);
    if (lv.id === 'div-judge') {
      const m = p.label.match(/^(\d+)は(\d+)の約数か=(はい|いいえ)$/);
      assert(!!m, `div-judge label: ${p.label}`);
      if (m) assert((Number(m[2]) % Number(m[1]) === 0) === (m[3] === 'はい'), 'div-judge correctness');
    }
    if (lv.id === 'div-count') {
      const m = p.label.match(/^(\d+)の約数の数=(\d+)$/);
      assert(!!m, `div-count label: ${p.label}`);
      if (m) assert(divisorsOf(Number(m[1])).length === Number(m[2]), 'div-count correctness');
    }
    if (lv.id === 'div-pick' || lv.id === 'div-all') {
      const em = p.explain.match(/^(\d+)の約数は/);
      assert(!!em, `${lv.id} explain: ${p.explain}`);
      if (em) {
        const Nn = Number(em[1]);
        (p.choices ?? []).forEach((c, k) => assert((Nn % Number(c) === 0) === (p.answerIndices ?? []).includes(k), `${lv.id} membership c=${c} N=${Nn}`));
      }
    }
    if (lv.id === 'div-list') {
      const m = p.label.match(/^(\d+)の約数を書き出す$/);
      assert(!!m, `div-list label: ${p.label}`);
      if (m) {
        const Nn = Number(m[1]);
        assert(JSON.stringify(p.listAnswers) === JSON.stringify(divisorsOf(Nn)), `div-list answers must be all divisors of ${Nn}`);
        assert(p.listAnswers![0] === 1 && p.listAnswers![p.listAnswers!.length - 1] === Nn, 'div-list includes 1 and N');
        assert(p.listExact === false, 'div-list is not exact-count');
      }
    }
    if (lv.id === 'div-pairs') {
      const t = p.pairTarget!;
      assert(!Number.isInteger(Math.sqrt(t)) || divisorsOf(t).length % 2 === 1, 'div-pairs perfect-square divisor count is odd');
      assert(Math.floor(Math.sqrt(t)) >= 2, `div-pairs needs at least 2 rows: ${t}`);
    }
  }
}

/* ---------- gcd ---------- */
for (const lv of GCD_LEVELS) {
  for (let i = 0; i < N; i++) {
    const p = generateGcd(lv.id);
    checkStructure(p, `gcd:${lv.id}`);
    if (lv.id === 'gcd-find') {
      const m = p.label.match(/^gcd\((\d+),(\d+)\)=(\d+)$/);
      assert(!!m, `gcd-find label: ${p.label}`);
      if (m) {
        const [a, b, g] = [Number(m[1]), Number(m[2]), Number(m[3])];
        assert(a !== b, 'gcd-find distinct');
        assert(gcdOf(a, b) === g, 'gcd-find correctness');
        // 以前の不具合：クランプで共通因数が壊れ gcd=1 の退化した問題が出ていた
        assert(g >= 2, `gcd-find must have gcd>=2 (got ${g} for ${a},${b})`);
      }
    }
    if (lv.id === 'gcd-word') {
      const m = p.label.match(/^gcd word\((\d+),(\d+)\)=(\d+)$/);
      assert(!!m, `gcd-word label: ${p.label}`);
      if (m) {
        const [a, b, g] = [Number(m[1]), Number(m[2]), Number(m[3])];
        assert(gcdOf(a, b) === g, 'gcd-word correctness');
        // 「1人に分けられます」という不自然な答えにならないこと
        assert(g >= 2, `gcd-word must not degenerate to 1 person (got ${g} for ${a},${b})`);
      }
    }
    if (lv.id === 'gcd-pick') {
      const em = p.explain.match(/最大公約数は (\d+)/);
      assert(!!em, `gcd-pick explain: ${p.explain}`);
      if (em) {
        const g = Number(em[1]);
        assert(g >= 2, `gcd-pick must have gcd>=2 (got ${g})`);
        (p.choices ?? []).forEach((c, k) => assert((g % Number(c) === 0) === (p.answerIndices ?? []).includes(k), `gcd-pick membership c=${c} g=${g}`));
      }
    }
    if (lv.id === 'gcd-three') {
      const m = p.label.match(/^gcd\((\d+),(\d+),(\d+)\)=(\d+)$/);
      assert(!!m, `gcd-three label: ${p.label}`);
      if (m) {
        const [a, b, c, v] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
        assert(a !== b && b !== c && a !== c, `gcd-three distinct: ${p.label}`);
        assert(gcdOf(gcdOf(a, b), c) === v, 'gcd-three correctness');
        assert(v >= 2, `gcd-three must have gcd>=2: ${p.label}`);
      }
    }
    if (lv.id === 'gcd-cut') {
      const m = p.label.match(/^切り分け (\d+)×(\d+) → 1辺(\d+)cm・(\d+)まい$/);
      assert(!!m, `gcd-cut label: ${p.label}`);
      if (m) {
        const [t, y, g, total] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
        assert(gcdOf(t, y) === g, `gcd-cut side must be gcd: ${p.label}`);
        assert(g >= 2, `gcd-cut gcd>=2: ${p.label}`);
        assert((t / g) * (y / g) === total, `gcd-cut piece count: ${p.label}`);
        assert(Number.isInteger(t / g) && Number.isInteger(y / g), 'gcd-cut divides evenly');
        assert(p.steps![1].answerValue === g && p.steps![2].answerValue === total, 'gcd-cut steps values');
      }
    }
    if (lv.id === 'gcd-prime') {
      const m = p.label.match(/^(\d+)は素数か=(はい|いいえ)$/);
      assert(!!m, `gcd-prime label: ${p.label}`);
      if (m) assert(isPrime(Number(m[1])) === (m[2] === 'はい'), 'gcd-prime correctness');
    }
    if (lv.id === 'gcd-venn') {
      const m = p.label.match(/^ベン図 (\d+)と(\d+)の約数$/);
      assert(!!m, `gcd-venn label: ${p.label}`);
      if (m) {
        const [a, b] = [Number(m[1]), Number(m[2])];
        const da = divisorsOf(a), db = divisorsOf(b);
        assert(JSON.stringify(p.vennBoth) === JSON.stringify(da.filter((x) => db.includes(x))), `gcd-venn both zone: ${p.label}`);
        assert(JSON.stringify(p.vennLeftOnly) === JSON.stringify(da.filter((x) => !db.includes(x))), `gcd-venn left zone: ${p.label}`);
        assert(JSON.stringify(p.vennRightOnly) === JSON.stringify(db.filter((x) => !da.includes(x))), `gcd-venn right zone: ${p.label}`);
        assert((p.vennChips ?? []).length <= 16, `gcd-venn chip count manageable: ${(p.vennChips ?? []).length}`);
      }
    }
    if (lv.id === 'gcd-fraction') {
      const m = p.label.match(/^約分 (\d+)\/(\d+)=(\d+)\/(\d+)$/);
      assert(!!m, `gcd-fraction label: ${p.label}`);
      if (m) {
        const [num, den, p2, q2] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
        assert(num < den, `gcd-fraction should be a proper fraction: ${p.label}`);
        assert(gcdOf(num, den) === p.steps![0].answerValue, 'gcd-fraction step1 is gcd');
        assert(gcdOf(p2, q2) === 1, `gcd-fraction result must be fully reduced: ${p.label}`);
        assert(num / den === p2 / q2, 'gcd-fraction value preserved');
      }
    }
  }
}

/* ---------- error hunter ---------- */
const EH_PRESETS: EhPreset[] = ['eh-zero', 'eh-one-prime', 'eh-self', 'eh-one-div', 'eh-swap', 'eh-skip', 'eh-oddodd'];
for (const preset of EH_PRESETS) {
  for (let i = 0; i < 800; i++) {
    const ex = makeNumError(preset);
    assert(ex.isCorrect === false, `${preset}: isCorrect false`);
    assert(ex.reasonOptions.length === 3, `${preset}: reasonOptions 3`);
    assert(ex.correctReasonIndex >= 0 && ex.correctReasonIndex < ex.reasonOptions.length, `${preset}: reason index`);
    if (ex.fixKind === 'numeric') assert(typeof ex.correctNumeric === 'number', `${preset}: correctNumeric`);
    if (ex.fixKind === 'choice2') assert(!!ex.choice2Labels && typeof ex.correctChoiceIsFirst === 'boolean', `${preset}: choice2 fields`);
    if (preset === 'eh-swap') {
      const m = ex.statement.match(/^(\d+)と(\d+)の 最大公約数は (\d+) です。$/);
      assert(!!m, `eh-swap statement: ${ex.statement}`);
      if (m) {
        const [a, b, wrong] = [Number(m[1]), Number(m[2]), Number(m[3])];
        assert(wrong === lcmOf(a, b), 'eh-swap wrong value is lcm');
        assert(ex.correctNumeric === gcdOf(a, b), 'eh-swap fix is gcd');
      }
    }
    if (preset === 'eh-self' || preset === 'eh-one-div') {
      const m = ex.statement.match(/^(\d+)の約数は/);
      if (m) assert(divisorsOf(Number(m[1])).includes(ex.correctNumeric as number), `${preset}: fix is real divisor`);
    }
    if (preset === 'eh-oddodd') {
      const m = ex.statement.match(/^(\d+) ＋ (\d+) の答えは、きすうです。$/);
      assert(!!m, `eh-oddodd statement: ${ex.statement}`);
      if (m) {
        const [a, b] = [Number(m[1]), Number(m[2])];
        assert(a % 2 === 1 && b % 2 === 1 && (a + b) % 2 === 0, 'eh-oddodd parity');
      }
    }
  }
}
for (let i = 0; i < 500; i++) {
  const ex = generateNumError();
  assert(ex.statement.length > 0 && ex.explain.length > 0, 'generateNumError texts');
}

/* ---------- 本番テストの構成 ---------- */
assert(OMOTE_MAX === 100, `OMOTE_MAX should be 100 (got ${OMOTE_MAX})`);
assert(URA_MAX === 50, `URA_MAX should be 50 (got ${URA_MAX})`);
assert(TEST_STEPS.filter((s) => s.section === '表').length === 20, '表 is 20 questions');
assert(TEST_STEPS.filter((s) => s.section === '裏').length === 5, '裏 is 5 questions');
// 裏面が 幾何文脈（しきつめ・切り分け）を含むこと
const uraLevels = TEST_STEPS.filter((s) => s.section === '裏').map((s) => s.level);
assert(uraLevels.includes('lcm-tile') && uraLevels.includes('gcd-cut'), '裏 includes both geometry problems');
// 表面が 書き出し形式を含むこと
const omoteLevels = TEST_STEPS.filter((s) => s.section === '表').map((s) => s.level);
assert(omoteLevels.includes('mul-list') && omoteLevels.includes('lcm-list') && omoteLevels.includes('div-list'), '表 includes write-out formats');
// 全ステップが実際に生成でき、記録用の要約も作れること
for (let i = 0; i < 200; i++) {
  TEST_STEPS.forEach((s) => {
    const p = s.gen();
    checkStructure(p, `test:${s.level}`);
  });
}

console.log(failures === 0 ? '全プロパティテスト OK（失敗 0件）' : `失敗 ${failures} 件`);
process.exit(failures === 0 ? 0 : 1);
