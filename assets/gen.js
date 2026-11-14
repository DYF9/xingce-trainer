/* ============================================================
 * XC Sprint · 行测资料分析训练 · 题库生成器（纯逻辑，可在 Node 中测试）
 * 无 DOM 依赖；浏览器挂到 window.XCGen
 * ============================================================ */
(function (global) {
'use strict';

/* ---------------- 随机与格式 ---------------- */
let RAND = Math.random;
function setRandom(fn){ RAND = (typeof fn === 'function') ? fn : Math.random; }
function ri(a, b){ return a + Math.floor(RAND() * (b - a + 1)); }
function rf(a, b){ return a + RAND() * (b - a); }
function pick(arr){ return arr[Math.floor(RAND() * arr.length)]; }
function shuffle(arr){
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(RAND() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function round(x, d){
  d = (d == null) ? 1 : d;
  const p = Math.pow(10, d);
  const v = Math.round((x + (x >= 0 ? 1 : -1) * 1e-9) * p) / p;
  return v;
}
function fx(x, d){ d = (d == null) ? 1 : d; return round(x, d).toFixed(d); }
function pct(x, d){ d = (d == null) ? 1 : d; let s = fx(x, d); if (s === '-0.0') s = '0.0'; return s + '%'; }

/** 三位有效数字字符串 */
function sig3(x){
  const ax = Math.abs(x);
  if (ax === 0 || !isFinite(ax)) return '0';
  const e = Math.floor(Math.log10(ax));
  const d = 2 - e;
  if (d >= 0) return round(x, d).toFixed(d);
  const m = Math.pow(10, -d);
  return String(round(x / m, 0) * m);
}

/** 生成 count 个互不相同的选项（含唯一正确答案），返回 {options, answer} */
function buildOptions(truth, fmt, altValues, count){
  count = count || 4;
  const key = fmt(truth);
  const list = [key];
  const seen = new Set(list);
  const push = (v) => {
    const s = fmt(v);
    if (!seen.has(s) && s !== key){ seen.add(s); list.push(s); return true; }
    return false;
  };
  for (let i = 0; i < altValues.length && list.length < count; i++) push(altValues[i]);
  let guard = 0;
  const span = Math.max(Math.abs(truth), 1);
  while (list.length < count && guard++ < 300){
    const dir = RAND() < 0.5 ? -1 : 1;
    push(truth + dir * span * (0.01 + RAND() * 0.15) * (1 + guard * 0.15));
  }
  while (list.length < count){ push(truth + list.length * 1.7); }
  const sh = shuffle(list);
  return { options: sh, answer: sh.indexOf(key) };
}

let SEQ = 0;
function qid(){ SEQ += 1; return 'q' + SEQ; }

/* ---------------- 名称与文本素材 ---------------- */
const UNITS_MONEY = ['亿元', '万元', '元'];
const TIPS = {
  div: '截位直除：分母保留三位有效数字、分子取整，直接做除法；选项首两位不同时只算前两位即可。',
  growth: '增长类：① 求增长率＝(现期－基期)÷基期；② 求基期＝现期÷(1＋增长率)，用截位直除；③ 求增长量＝现期×r÷(1＋r)，可先把 r 化成分数。',
  weight: '比重：现期比重＝部分÷整体；比重变化看增速——部分增速＞整体增速则比重上升，反之下降，幅度≈现期比重×(a−b)÷(1＋a)，单位是“个百分点”。',
  avg: '平均数增长率＝(1＋总量增速)÷(1＋份数增速)－1，与平均数的绝对值无关，只与两个增速有关。',
  frac: '特征分数：1/6=16.7%、1/7=14.3%、1/8=12.5%、1/9=11.1%、1/11=9.1%、1/12=8.3%、1/13=7.7%、1/14=7.1%、1/15=6.7%、1/16=6.3%、1/17=5.9%、1/18=5.6%、1/19=5.3%。',
  mult: '速算乘法：拆成整十数＋零头（47×83＝47×80＋47×3）；接近 100 的平方用 (100±k)²＝10000±200k＋k²。',
  compare: '分数比较：先看直除的首位；接近时用差分法——两分数分子分母分别作差，用差分数与其中较小者比较，差分数大则被减数大。',
  locate: '找数三步：① 圈出题干的时间（现期还是基期）；② 圈出主体名称（多个相似名称要逐字比对）；③ 圈出考点（多少、增速、比重、平均）。对应不上就先定位再算。',
  table: '表格找数：先看表头单位和年份，再横向找指标、纵向找年份，交叉点才是你要的数；注意“其中”“累计”“同比”这类限定词。'
};
const TAG_NAME = {
  div: '截位直除', growth: '增长率与增长量', weight: '比重', avg: '平均数',
  frac: '特征分数', mult: '速算乘法', compare: '分数比较',
  locate: '材料找数', table: '表格找数'
};
const CALC_TAGS = ['div', 'growth', 'weight', 'avg', 'frac', 'mult', 'compare'];

/* ============================================================
 * 计算类题目
 * ============================================================ */

/* 1. 截位直除 */
function makeDiv(diff){
  const lo = diff >= 3 ? 1000 : 200;
  const hi = diff >= 3 ? 9999 : 9999;
  const a = round(rf(lo, hi), 1);
  const b = round(rf(lo, hi), 1);
  const truth = a / b;
  const fmt = sig3;
  const alts = [truth * 1.03, truth * 0.97, truth * 1.07, truth * 0.93, truth / 10, truth * 10];
  const o = buildOptions(truth, fmt, alts, 4);
  return {
    id: qid(), tag: 'div', kind: 'calc', diff: diff,
    stem: '计算：' + fx(a, 1) + ' ÷ ' + fx(b, 1) + ' ≈ ？（保留三位有效数字）',
    options: o.options, answer: o.answer,
    tip: TIPS.div,
    explain: '分母取三位有效数字 ' + sig3(b) + '、分子取 ' + sig3(a) + ' 直除，得 ' + fmt(truth) + '。',
    targetSec: diff >= 3 ? 28 : 20,
    meta: { a: a, b: b, truth: truth }
  };
}

/* 2. 增长类 */
function makeGrowth(diff){
  const kind = pick(['rate', 'rate', 'base', 'delta', 'current']);
  const A = round(rf(diff >= 3 ? 300 : 500, diff >= 3 ? 9999 : 6000), 1);
  let r = round(rf(2, diff >= 3 ? 26 : 16), 1);
  if (RAND() < 0.13) r = -r;
  const B = round(A * (1 + r / 100), 2);
  const y0 = pick(['2018', '2019', '2020', '2021', '2022']);
  const y1 = String(Number(y0) + 1);
  const name = pick(['地区生产总值', '规模以上工业增加值', '固定资产投资', '社会消费品零售总额', '营业收入', '利润总额', '出口额', '财政收入']);

  if (kind === 'rate'){
    const truth = (B - A) / A * 100;
    const o = buildOptions(truth, v => pct(v, 1),
      [truth + 0.6, truth - 0.5, truth + 1.2, truth - 1.1, -truth, truth * 1.15], 4);
    return {
      id: qid(), tag: 'growth', kind: 'calc', diff: diff,
      stem: '某地' + y0 + '年' + name + '为 ' + fx(A, 1) + ' 亿元，' + y1 + '年为 ' + fx(B, 2) + ' 亿元。求' + y1 + '年该指标同比增长率。',
      options: o.options, answer: o.answer, tip: TIPS.growth,
      explain: '增长率＝(现期－基期)÷基期＝(' + fx(B, 2) + '－' + fx(A, 1) + ')÷' + fx(A, 1) + '≈ ' + pct(truth, 1) + '。',
      targetSec: 35, meta: { kind: 'rate', A: A, B: B, truth: truth }
    };
  }
  if (kind === 'base'){
    const truth = B / (1 + r / 100);
    const o = buildOptions(truth, v => fx(v, 1),
      [truth * 1.02, truth * 0.974, truth * 1.035, truth * 0.96, B, B * 0.98], 4);
    return {
      id: qid(), tag: 'growth', kind: 'calc', diff: diff,
      stem: '某地' + y1 + '年' + name + '为 ' + fx(B, 2) + ' 亿元，同比增长 ' + pct(r, 1) + '。求' + y0 + '年该指标的值。',
      options: o.options, answer: o.answer, tip: TIPS.growth,
      explain: '基期＝现期÷(1＋增长率)＝' + fx(B, 2) + '÷' + fx(1 + r / 100, 3) + '≈ ' + fx(truth, 1) + ' 亿元。',
      targetSec: 40, meta: { kind: 'base', A: A, B: B, r: r, truth: truth }
    };
  }
  if (kind === 'delta'){
    const truth = B - A;
    const o = buildOptions(truth, v => fx(v, 2),
      [truth * 1.04, truth * 0.95, A * r / 100 * 1.15, truth * 1.1, Math.abs(B - A) * 0.9 + 1], 4);
    return {
      id: qid(), tag: 'growth', kind: 'calc', diff: diff,
      stem: '某地' + y1 + '年' + name + '为 ' + fx(B, 2) + ' 亿元，' + y0 + '年为 ' + fx(A, 1) + ' 亿元。求' + y1 + '年比' + y0 + '年增加多少亿元？',
      options: o.options, answer: o.answer, tip: TIPS.growth,
      explain: '增长量＝现期－基期＝' + fx(B, 2) + '－' + fx(A, 1) + '＝' + fx(truth, 2) + ' 亿元。',
      targetSec: 30, meta: { kind: 'delta', A: A, B: B, truth: truth }
    };
  }
  const truth = B;
  const o = buildOptions(truth, v => fx(v, 2),
    [A * (1 + r / 100 * 1.2), A * (1 - r / 100), truth * 1.03, truth * 0.97, A], 4);
  return {
    id: qid(), tag: 'growth', kind: 'calc', diff: diff,
    stem: '某地' + y0 + '年' + name + '为 ' + fx(A, 1) + ' 亿元，' + y1 + '年同比增长 ' + pct(r, 1) + '。求' + y1 + '年该指标的值。',
    options: o.options, answer: o.answer, tip: TIPS.growth,
    explain: '现期＝基期×(1＋增长率)＝' + fx(A, 1) + '×' + fx(1 + r / 100, 3) + '≈ ' + fx(truth, 2) + ' 亿元。',
    targetSec: 30, meta: { kind: 'current', A: A, B: B, r: r, truth: truth }
  };
}

/* 3. 比重 */
function makeWeight(diff){
  const variant = pick(['share', 'share', 'shift']);
  const name = pick(['第三产业', '高新技术产业', '战略性新兴产业', '民营经济', '农业']);
  const wholeName = pick(['地区生产总值', '全部营业收入', '全部投资额', '总销售额']);
  if (variant === 'share'){
    const W = round(rf(2000, 9000), 1);
    const P = round(W * rf(0.15, 0.75), 1);
    const truth = P / W * 100;
    const o = buildOptions(truth, v => pct(v, 1),
      [truth + 0.4, truth - 0.35, truth + 0.9, truth - 0.8, truth * 1.1, 100 - truth], 4);
    return {
      id: qid(), tag: 'weight', kind: 'calc', diff: diff,
      stem: '2023年某地' + wholeName + '为 ' + fx(W, 1) + ' 亿元，其中' + name + '为 ' + fx(P, 1) + ' 亿元。求' + name + '占' + wholeName + '的比重。',
      options: o.options, answer: o.answer, tip: TIPS.weight,
      explain: '比重＝部分÷整体＝' + fx(P, 1) + '÷' + fx(W, 1) + '≈ ' + pct(truth, 1) + '。',
      targetSec: 30, meta: { kind: 'share', P: P, W: W, truth: truth }
    };
  }
  let P1, W1, a, b, truth, guard0 = 0;
  do {
    P1 = round(rf(200, 3000), 1);
    W1 = round(P1 / rf(0.2, 0.7), 1);
    a = round(rf(4, 22), 1);
    b = round(rf(2, 11), 1);
    const P0 = P1 / (1 + a / 100), W0 = W1 / (1 + b / 100);
    truth = (P1 / W1 - P0 / W0) * 100;
  } while (Math.abs(truth) < 0.65 && guard0++ < 300);
  const dir = truth >= 0 ? '上升' : '下降';
  const abs = Math.abs(truth);
  const fmt = v => (v >= 0 ? '上升' : '下降') + fx(Math.abs(v), 1) + '个百分点';
  const alts = [
    Math.sign(truth) * (abs * 0.55), -truth, Math.sign(truth) * (abs * 1.6),
    Math.sign(truth) * (abs + 0.5), Math.sign(truth) * Math.abs(a - b)
  ];
  const key = fmt(truth);
  const list = [key];
  for (const v of alts){ const s = fmt(v); if (s !== key && list.indexOf(s) < 0) list.push(s); }
  let guard = 0;
  while (list.length < 4 && guard++ < 100){ const s = fmt(Math.sign(truth) * (abs + guard * 0.3)); if (list.indexOf(s) < 0) list.push(s); }
  const sh = shuffle(list.slice(0, 4));
  return {
    id: qid(), tag: 'weight', kind: 'calc', diff: diff,
    stem: '2023年某地' + name + '为 ' + fx(P1, 1) + ' 亿元，同比增长 ' + pct(a, 1) + '；' + wholeName + '为 ' + fx(W1, 1) + ' 亿元，同比增长 ' + pct(b, 1) + '。求2023年' + name + '占' + wholeName + '的比重比上年同期如何变化？',
    options: sh, answer: sh.indexOf(key), tip: TIPS.weight,
    explain: '部分增速 ' + pct(a, 1) + ' ' + (a > b ? '＞' : '＜') + ' 整体增速 ' + pct(b, 1) + '，比重' + dir + '；幅度≈现期比重×(' + fx(a, 1) + '－' + fx(b, 1) + ')÷(1＋' + fx(a / 100, 3) + ')≈' + fx(abs, 1) + ' 个百分点。',
    targetSec: 45, meta: { kind: 'shift', P1: P1, W1: W1, a: a, b: b, truth: truth }
  };
}

/* 4. 平均数增长率 */
function makeAvg(diff){
  const totalName = pick(['营业收入', '利润总额', '销售额', '研发投入', '产量']);
  const unitName = pick(['从业人员', '企业数量', '门店数量', '职工人数']);
  const a = round(rf(3, 20), 1);
  let b = round(rf(1, 12), 1);
  if (Math.abs(a - b) < 1.2) b = round(a >= 6 ? a - 2.4 : a + 2.4, 1);
  const truth = ((1 + a / 100) / (1 + b / 100) - 1) * 100;
  // 干扰项：直接相减 a-b（最常见错误）、符号反、倍数偏差
  const key = pct(truth, 1);
  const list = [key];
  const cands = [a - b, -truth, truth * 1.18, truth - 1.1, truth + 1.3, a - b + 0.9, truth * 0.82, truth - 2.0];
  for (const v of cands){
    if (list.length >= 4) break;
    const s = pct(v, 1);
    if (s !== key && list.indexOf(s) < 0 && Math.abs(v - truth) >= 0.35) list.push(s);
  }
  let gA = 0;
  while (list.length < 4 && gA++ < 40){
    const s = pct(truth + (gA % 2 ? 1 : -1) * (0.6 + gA * 0.4), 1);
    if (list.indexOf(s) < 0) list.push(s);
  }
  const o = { options: shuffle(list), answer: 0 };
  o.answer = o.options.indexOf(key);
  return {
    id: qid(), tag: 'avg', kind: 'calc', diff: diff,
    stem: '2023年某行业' + totalName + '同比增长 ' + pct(a, 1) + '，' + unitName + '同比增长 ' + pct(b, 1) + '。求人均（或户均）' + totalName + '同比增长率。',
    options: o.options, answer: o.answer, tip: TIPS.avg,
    explain: '平均数增长率＝(1＋' + fx(a / 100, 3) + ')÷(1＋' + fx(b / 100, 3) + ')－1≈ ' + pct(truth, 1) + '。注意不是 a－b＝' + pct(a - b, 1) + '。',
    targetSec: 35, meta: { kind: 'avg', a: a, b: b, truth: truth }
  };
}

/* 5. 特征分数 */
function makeFrac(diff){
  const den = pick([6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  const num = ri(1, den - 1);
  const truth = num / den * 100;
  const reverse = RAND() < 0.28;
  if (!reverse){
    const o = buildOptions(truth, v => pct(v, 1),
      [truth + 1.2, truth - 0.9, truth + 2.0, truth - 1.8, truth * 1.1], 4);
    return {
      id: qid(), tag: 'frac', kind: 'calc', diff: diff,
      stem: num + '/' + den + ' 约等于百分之几？',
      options: o.options, answer: o.answer, tip: TIPS.frac,
      explain: num + '/' + den + '＝' + fx(truth / 100, 4) + '≈ ' + pct(truth, 1) + '（记住 1/' + den + '≈' + pct(100 / den, 1) + '）。',
      targetSec: 12, meta: { kind: 'frac', num: num, den: den, truth: truth }
    };
  }
  const good = num + '/' + den;
  const distOf = (s) => { const p2 = s.split('/'); return Math.abs(Number(p2[0]) / Number(p2[1]) * 100 - truth); };
  const pool = [];
  for (let d2 = 6; d2 <= 19; d2++){
    for (let m2 = 1; m2 < d2; m2++){
      const s = m2 + '/' + d2;
      if (s !== good && distOf(s) > 1.3) pool.push(s);
    }
  }
  const opts = shuffle([good].concat(shuffle(pool).slice(0, 3)));
  const idx = opts.indexOf(good);
  return {
    id: qid(), tag: 'frac', kind: 'calc', diff: diff,
    stem: pct(truth, 1) + ' 最接近下面哪个分数？',
    options: opts, answer: idx,
    tip: TIPS.frac,
    explain: num + '/' + den + '≈' + pct(truth, 1) + '；其余选项分别约等于 ' + opts.filter(s => s !== good).map(s => {
      const p2 = s.split('/'); return pct(Number(p2[0]) / Number(p2[1]) * 100, 1);
    }).join('、') + '。',
    targetSec: 12, meta: { kind: 'fracRev', num: num, den: den, truth: truth }
  };
}

/* 6. 速算乘法 / 平方 / 拆分 */
function makeMult(diff){
  const variant = pick(['two', 'two', 'square']);
  if (variant === 'two'){
    const a = ri(21, 99), b = ri(21, 99);
    const truth = a * b;
    const o = buildOptions(truth, v => String(Math.round(v)),
      [truth + a, truth - b, truth + 10, truth - 10, truth + 100, truth - 100, (a + 1) * b], 4);
    return {
      id: qid(), tag: 'mult', kind: 'calc', diff: diff,
      stem: a + ' × ' + b + ' ＝ ？',
      options: o.options, answer: o.answer, tip: TIPS.mult,
      explain: a + '×' + b + '＝' + a + '×' + (Math.floor(b / 10) * 10) + '＋' + a + '×' + (b % 10) + '＝' + (a * Math.floor(b / 10) * 10) + '＋' + (a * (b % 10)) + '＝' + truth + '。',
      targetSec: 10, meta: { kind: 'mult', a: a, b: b, truth: truth }
    };
  }
  const k = ri(2, 19);
  const sign = RAND() < 0.5 ? 1 : -1;
  const base = 100 + sign * k;
  const truth = base * base;
  const o = buildOptions(truth, v => String(Math.round(v)),
    [truth + sign * 200, truth - sign * 200, (100 + sign * (k - 1)) ** 2, (100 + sign * (k + 1)) ** 2, truth + 1], 4);
  return {
    id: qid(), tag: 'mult', kind: 'calc', diff: diff,
    stem: base + '² ＝ ？',
    options: o.options, answer: o.answer, tip: TIPS.mult,
    explain: '用 (100±k)²＝10000±200k＋k²：' + base + '²＝10000' + (sign > 0 ? '＋' : '－') + (200 * k) + '＋' + (k * k) + '＝' + truth + '。',
    targetSec: 12, meta: { kind: 'square', base: base, truth: truth }
  };
}

/* 7. 分数比较（差分法） */
function makeCompare(diff){
  const a = ri(21, 97), b = ri(21, 97);
  const r1 = a / b;
  const d = ri(21, 97);
  const e = (RAND() < 0.5 ? 1 : -1) * rf(0.004, 0.03);
  const c = Math.max(3, Math.round(r1 * (1 + e) * d));
  const left = a * d, right = c * b;
  if (left === right) return makeCompare(diff);
  const bigger = left > right ? '甲' : '乙';
  const options = ['甲＞乙', '甲＜乙', '甲＝乙', '无法判断'];
  const key = bigger === '甲' ? '甲＞乙' : '甲＜乙';
  return {
    id: qid(), tag: 'compare', kind: 'calc', diff: diff,
    stem: '甲数＝' + a + '/' + b + '，乙数＝' + c + '/' + d + '，比较大小。',
    options: options, answer: options.indexOf(key), tip: TIPS.compare,
    explain: '交叉相乘：' + a + '×' + d + '＝' + left + '，' + c + '×' + b + '＝' + right + '，故' + key + '。',
    targetSec: 20, meta: { kind: 'compare', a: a, b: b, c: c, d: d, left: left, right: right }
  };
}

function makeCalc(diff, tag){
  diff = diff || 2;
  if (!tag) tag = pick(CALC_TAGS);
  switch (tag){
    case 'div': return makeDiv(diff);
    case 'growth': return makeGrowth(diff);
    case 'weight': return makeWeight(diff);
    case 'avg': return makeAvg(diff);
    case 'frac': return makeFrac(diff);
    case 'mult': return makeMult(diff);
    case 'compare': return makeCompare(diff);
    default: return makeDiv(diff);
  }
}

/* ============================================================
 * 材料类题目（找数能力）
 * ============================================================ */
const PROV = ['A省', 'B省', 'C市', 'D市', 'E自治区', 'F省'];

function mkFactBox(){
  const facts = {}; const order = [];
  return {
    facts, order,
    add(id, label, disp, num, unit){
      facts[id] = { id: id, label: label, disp: disp, dispAbs: String(disp).replace('-', ''), num: num, unit: unit };
      order.push(id);
      return id;
    }
  };
}
function compose(paras, box, title){
  const out = paras.map(p => {
    const segs = []; const re = /\{([A-Za-z0-9_]+)\}/g; let last = 0, m;
    while ((m = re.exec(p)) !== null){
      if (m.index > last) segs.push({ s: p.slice(last, m.index) });
      const f = box.facts[m[1]];
      segs.push({ id: m[1], s: f ? f.disp : '' });
      last = re.lastIndex;
    }
    if (last < p.length) segs.push({ s: p.slice(last) });
    // 负增长在材料里写成“下降 x%”，但点击值与答案仍按带符号的增速计
    for (let i = 1; i < segs.length; i++){
      const cur = segs[i], prev = segs[i - 1];
      if (cur.id && prev && prev.s && !prev.id && /增长\s*$/.test(prev.s)){
        const f2 = box.facts[cur.id];
        if (f2 && f2.num < 0){
          prev.s = prev.s.replace(/增长(\s*)$/, '下降$1');
          cur.s = f2.dispAbs;
        }
      }
    }
    return segs;
  });
  return { kind: 'text', title: title, paras: out, facts: box.facts, order: box.order };
}

/* 材料族 1：地区经济 */
function matEconomy(diff){
  const P = pick(PROV), Y = pick(['2022', '2023']);
  const box = mkFactBox();
  const gdp = round(rf(1200, 7600), 1);
  const g = round(rf(3.2, 9.4), 1);
  const p1 = round(gdp * rf(0.07, 0.13), 1);
  const p2 = round(gdp * rf(0.33, 0.46), 1);
  const p3 = round(gdp - p1 - p2, 1);
  const g1 = round(rf(1.5, 6.5), 1), g2 = round(rf(2.5, 9.5), 1), g3 = round(rf(4.0, 11.0), 1);
  const fai = round(rf(800, 5200), 1), gF = round(rf(-4, 12), 1);
  const retail = round(rf(600, 4800), 1), gR = round(rf(-2, 11), 1);
  const trade = round(rf(300, 3600), 1), gT = round(rf(-6, 14), 1);
  const exp = round(trade * rf(0.45, 0.62), 1), gE = round(rf(-8, 16), 1);
  const imp = round(trade - exp, 1);
  const inc = ri(26000, 52000), gI = round(rf(3.5, 8.5), 1);
  const incU = ri(36000, 72000), gU = round(rf(2.5, 7.0), 1);
  const incR = ri(14000, 30000), gRu = round(rf(5.0, 9.5), 1);

  box.add('gdp', Y + '年' + P + '地区生产总值', fx(gdp, 1) + '亿元', gdp, '亿元');
  box.add('gdp_r', Y + '年' + P + '地区生产总值增速', pct(g, 1), g, '%');
  box.add('p1', Y + '年' + P + '第一产业增加值', fx(p1, 1) + '亿元', p1, '亿元');
  box.add('p1_r', Y + '年' + P + '第一产业增加值增速', pct(g1, 1), g1, '%');
  box.add('p2', Y + '年' + P + '第二产业增加值', fx(p2, 1) + '亿元', p2, '亿元');
  box.add('p2_r', Y + '年' + P + '第二产业增加值增速', pct(g2, 1), g2, '%');
  box.add('p3', Y + '年' + P + '第三产业增加值', fx(p3, 1) + '亿元', p3, '亿元');
  box.add('p3_r', Y + '年' + P + '第三产业增加值增速', pct(g3, 1), g3, '%');
  box.add('fai', Y + '年' + P + '固定资产投资', fx(fai, 1) + '亿元', fai, '亿元');
  box.add('fai_r', Y + '年' + P + '固定资产投资增速', pct(gF, 1), gF, '%');
  box.add('retail', Y + '年' + P + '社会消费品零售总额', fx(retail, 1) + '亿元', retail, '亿元');
  box.add('retail_r', Y + '年' + P + '社会消费品零售总额增速', pct(gR, 1), gR, '%');
  box.add('trade', Y + '年' + P + '进出口总额', fx(trade, 1) + '亿元', trade, '亿元');
  box.add('trade_r', Y + '年' + P + '进出口总额增速', pct(gT, 1), gT, '%');
  box.add('exp', Y + '年' + P + '出口额', fx(exp, 1) + '亿元', exp, '亿元');
  box.add('exp_r', Y + '年' + P + '出口额增速', pct(gE, 1), gE, '%');
  box.add('imp', Y + '年' + P + '进口额', fx(imp, 1) + '亿元', imp, '亿元');
  box.add('inc', Y + '年' + P + '居民人均可支配收入', inc + '元', inc, '元');
  box.add('inc_r', Y + '年' + P + '居民人均可支配收入增速', pct(gI, 1), gI, '%');
  box.add('incU', Y + '年' + P + '城镇居民人均可支配收入', incU + '元', incU, '元');
  box.add('incU_r', Y + '年' + P + '城镇居民人均可支配收入增速', pct(gU, 1), gU, '%');
  box.add('incR', Y + '年' + P + '农村居民人均可支配收入', incR + '元', incR, '元');
  box.add('incR_r', Y + '年' + P + '农村居民人均可支配收入增速', pct(gRu, 1), gRu, '%');

  const paras = [
    '经初步核算，' + Y + '年' + P + '地区生产总值{gdp}，比上年增长{gdp_r}。分产业看，第一产业增加值{p1}，增长{p1_r}；第二产业增加值{p2}，增长{p2_r}；第三产业增加值{p3}，增长{p3_r}。',
    '全年固定资产投资{fai}，比上年增长{fai_r}。社会消费品零售总额{retail}，增长{retail_r}。全年进出口总额{trade}，增长{trade_r}；其中，出口{exp}，增长{exp_r}；进口{imp}。',
    '全年居民人均可支配收入{inc}，比上年增长{inc_r}。按常住地分，城镇居民人均可支配收入{incU}，增长{incU_r}；农村居民人均可支配收入{incR}，增长{incR_r}。'
  ];
  return compose(diff >= 3 ? paras : paras, box, Y + '年' + P + '国民经济主要指标');
}

/* 材料族 2：工业/企业 */
function matIndustry(diff){
  const P = pick(PROV), Y = pick(['2022', '2023']);
  const box = mkFactBox();
  const out = round(rf(120, 3600), 1), oR = round(rf(-3, 15), 1);
  const sale = round(out * rf(0.9, 0.99), 1), sR = round(rf(-2, 14), 1);
  const profit = round(rf(20, 800), 1), pR = round(rf(-8, 22), 1);
  const rd = round(rf(10, 320), 2), rR = round(rf(5, 25), 1);
  const staff = ri(2, 60), stR = round(rf(-3, 6), 1);
  const cost = round(rf(30, 900), 1), cR = round(rf(-1, 12), 1);

  box.add('out', Y + '年' + P + '规模以上工业总产值', fx(out, 1) + '亿元', out, '亿元');
  box.add('out_r', Y + '年' + P + '规模以上工业总产值增速', pct(oR, 1), oR, '%');
  box.add('sale', Y + '年' + P + '规模以上工业销售产值', fx(sale, 1) + '亿元', sale, '亿元');
  box.add('sale_r', Y + '年' + P + '规模以上工业销售产值增速', pct(sR, 1), sR, '%');
  box.add('profit', Y + '年' + P + '规模以上工业企业利润总额', fx(profit, 1) + '亿元', profit, '亿元');
  box.add('profit_r', Y + '年' + P + '规模以上工业企业利润总额增速', pct(pR, 1), pR, '%');
  box.add('rd', Y + '年' + P + '规模以上工业企业研发经费', fx(rd, 2) + '亿元', rd, '亿元');
  box.add('rd_r', Y + '年' + P + '规模以上工业企业研发经费增速', pct(rR, 1), rR, '%');
  box.add('staff', Y + '年' + P + '规模以上工业企业从业人员', staff + '万人', staff, '万人');
  box.add('staff_r', Y + '年' + P + '规模以上工业企业从业人员增速', pct(stR, 1), stR, '%');
  box.add('cost', Y + '年' + P + '规模以上工业企业营业成本', fx(cost, 1) + '亿元', cost, '亿元');

  const paras = [
    Y + '年，' + P + '规模以上工业总产值{out}，比上年增长{out_r}；销售产值{sale}，增长{sale_r}，产销率' + pct(round(sale / out * 100, 1), 1) + '。',
    '全年规模以上工业企业实现利润总额{profit}，比上年增长{profit_r}；营业成本{cost}。研发经费{rd}，增长{rd_r}。',
    '年末规模以上工业企业从业人员{staff}，比上年增长{staff_r}。'
  ];
  return compose(paras, box, Y + '年' + P + '规模以上工业主要指标');
}

/* 材料族 3：人口与民生 */
function matPeople(diff){
  const P = pick(PROV), Y = pick(['2022', '2023']);
  const box = mkFactBox();
  const pop = ri(600, 12000), popR = round(rf(-0.6, 0.8), 2);
  const birth = round(rf(5.2, 12.5), 2), death = round(rf(5.0, 9.0), 2);
  const urban = round(rf(45, 88), 1), uR = round(rf(-0.5, 2.2), 1);
  const emp = ri(800, 6500), empR = round(rf(-1.5, 4.5), 1);
  const col = ri(60, 320), colR = round(rf(0.5, 7.5), 1);
  const hosp = ri(800, 9000), hR = round(rf(-1, 12), 1);

  box.add('pop', Y + '年末' + P + '常住人口', pop + '万人', pop, '万人');
  box.add('pop_r', Y + '年末' + P + '常住人口增速', pct(popR, 2), popR, '%');
  box.add('birth', Y + '年' + P + '人口出生率', pct(birth, 2), birth, '‰');
  box.add('death', Y + '年' + P + '人口死亡率', pct(death, 2), death, '‰');
  box.add('urban', Y + '年' + P + '常住人口城镇化率', pct(urban, 1), urban, '%');
  box.add('urban_r', Y + '年' + P + '常住人口城镇化率较上年提高', fx(uR, 1) + '个百分点', uR, '百分点');
  box.add('emp', Y + '年' + P + '城镇就业人员', emp + '万人', emp, '万人');
  box.add('emp_r', Y + '年' + P + '城镇就业人员增速', pct(empR, 1), empR, '%');
  box.add('col', Y + '年' + P + '普通高校在校生', col + '万人', col, '万人');
  box.add('col_r', Y + '年' + P + '普通高校在校生增速', pct(colR, 1), colR, '%');
  box.add('hosp', Y + '年' + P + '医疗卫生机构床位数', hosp + '万张', hosp, '万张');

  const paras = [
    Y + '年末，' + P + '常住人口{pop}，比上年增长{pop_r}。全年人口出生率{birth}，人口死亡率{death}；常住人口城镇化率{urban}，比上年提高{urban_r}。',
    '全年城镇就业人员{emp}，比上年增长{emp_r}。普通高校在校生{col}，增长{col_r}。年末医疗卫生机构床位数{hosp}。'
  ];
  return compose(paras, box, Y + '年' + P + '人口与民生主要指标');
}

/* 材料族 4：能源与环境 */
function matEnergy(diff){
  const P = pick(PROV), Y = pick(['2022', '2023']);
  const box = mkFactBox();
  const el = round(rf(600, 6800), 1), eR = round(rf(1.5, 11), 1);
  const ind = round(el * rf(0.55, 0.72), 1), iR = round(rf(0.5, 10), 1);
  const res = round(el - ind, 1), rR = round(rf(-6, 14), 1);
  const coal = round(rf(300, 5200), 1), cR = round(rf(-9, 8), 1);
  const power = round(rf(200, 4200), 2), pR = round(rf(4, 32), 1);
  const drop = round(rf(1.2, 4.6), 2);
  const forest = round(rf(30, 68), 1);

  box.add('el', Y + '年' + P + '全社会用电量', fx(el, 1) + '亿千瓦时', el, '亿千瓦时');
  box.add('el_r', Y + '年' + P + '全社会用电量增速', pct(eR, 1), eR, '%');
  box.add('ind', Y + '年' + P + '工业用电量', fx(ind, 1) + '亿千瓦时', ind, '亿千瓦时');
  box.add('ind_r', Y + '年' + P + '工业用电量增速', pct(iR, 1), iR, '%');
  box.add('res', Y + '年' + P + '城乡居民生活用电量', fx(res, 1) + '亿千瓦时', res, '亿千瓦时');
  box.add('res_r', Y + '年' + P + '城乡居民生活用电量增速', pct(rR, 1), rR, '%');
  box.add('coal', Y + '年' + P + '原煤产量', fx(coal, 1) + '万吨', coal, '万吨');
  box.add('coal_r', Y + '年' + P + '原煤产量增速', pct(cR, 1), cR, '%');
  box.add('power', Y + '年' + P + '新能源发电装机容量', fx(power, 2) + '万千瓦', power, '万千瓦');
  box.add('power_r', Y + '年' + P + '新能源发电装机容量增速', pct(pR, 1), pR, '%');
  box.add('drop', Y + '年' + P + '单位地区生产总值能耗较上年下降', pct(drop, 2), drop, '%');
  box.add('forest', Y + '年' + P + '森林覆盖率', pct(forest, 1), forest, '%');

  const paras = [
    Y + '年，' + P + '全社会用电量{el}，比上年增长{el_r}。其中，工业用电量{ind}，增长{ind_r}；城乡居民生活用电量{res}，增长{res_r}。',
    '全年原煤产量{coal}，比上年增长{coal_r}。年末新能源发电装机容量{power}，增长{power_r}。',
    '初步核算，' + Y + '年' + P + '单位地区生产总值能耗比上年下降{drop}；森林覆盖率{forest}。'
  ];
  return compose(paras, box, Y + '年' + P + '能源与环境主要指标');
}

const MAT_FAMILIES = [matEconomy, matIndustry, matPeople, matEnergy];

/* ---------- 由文字材料出题 ---------- */
function locateFromText(diff){
  const mat = pick(MAT_FAMILIES)(diff);
  const facts = mat.facts;
  const ids = mat.order;
  const valIds = ids.filter(id => facts[id].unit !== '%');
  const rateIds = ids.filter(id => facts[id].unit === '%');

  const mode = pick(diff >= 3 ? ['value', 'rate', 'pair', 'pair'] : ['value', 'value', 'rate', 'pair']);
  let stem, answerIds, explain, tag = 'locate';

  if (mode === 'value'){
    const id = pick(valIds);
    const f = facts[id];
    stem = '材料中「' + f.label + '」的数值是多少？请点击材料中的对应数据。';
    answerIds = [id];
    explain = '「' + f.label + '」对应材料中的 ' + f.disp + '。找数时先定时间（' + (f.label.match(/^\d{4}/) || ['当年'])[0] + '），再逐字核对主体名称，最后看清是否带“增速/占比”等限定语。';
  } else if (mode === 'rate'){
    const id = pick(rateIds);
    const f = facts[id];
    stem = '材料中「' + f.label + '」的同比增速是多少？请点击对应数据。';
    answerIds = [id];
    explain = '增速是带 % 的那一项：' + f.disp + '。材料里同一主体的绝对值和增速往往紧挨着出现，别点错。';
  } else {
    const byUnit = {};
    valIds.forEach(id => { const u = facts[id].unit; (byUnit[u] = byUnit[u] || []).push(id); });
    const groups = Object.keys(byUnit).filter(u => byUnit[u].length >= 2);
    let g = groups.length ? pick(groups) : null;
    if (!g) return locateFromText(diff);
    const arr = shuffle(byUnit[g]).slice(0, 2);
    const f1 = facts[arr[0]], f2 = facts[arr[1]];
    stem = '要计算「' + f1.label + '」比「' + f2.label + '」多（少）多少，需要点击材料中的哪两处数据？';
    answerIds = arr;
    explain = '两处分别为 ' + f1.disp + ' 与 ' + f2.disp + '，同单位（' + g + '）直接相减即可；若单位不同要先换算。';
    tag = 'locate';
  }
  return {
    id: qid(), tag: tag, kind: 'locate', diff: diff,
    stem: stem, material: mat, answerIds: answerIds, multi: answerIds.length,
    explain: explain, tip: TIPS.locate, targetSec: answerIds.length > 1 ? 40 : 22
  };
}

/* ---------- 表格材料 ---------- */
function makeTableMaterial(diff){
  const fam = pick(['industry', 'trade']);
  const P = pick(PROV);
  const years = diff >= 3 ? ['2020', '2021', '2022', '2023'] : ['2021', '2022', '2023'];
  const box = mkFactBox();
  const rows = [];

  function addRow(name, unit, base, growth, d){
    const cells = [];
    let v = base;
    const rowCells = [];
    years.forEach((y, i) => {
      if (i > 0) v = v * (1 + (growth + rf(-0.02, 0.02)) / 100);
      const val = round(v, d);
      const id = 'c' + rows.length + '_' + i;
      box.add(id, y + '年' + name, fx(val, d) + unit, val, unit);
      rowCells.push({ id: id, s: fx(val, d) });
      cells.push({ id: id, s: fx(val, d) });
    });
    void rowCells;
    rows.push({ name: name + '（' + unit + '）', cells: cells, unit: unit, nums: cells.map(c => Number(c.s)) });
  }

  const gdp = round(rf(2000, 8600), 1);
  const gG = round(rf(3, 10), 1);
  const p1 = gdp * rf(0.08, 0.13), p2 = gdp * rf(0.34, 0.45), p3 = gdp - p1 - p2;
  addRow('地区生产总值', '亿元', gdp, gG, 1);
  addRow('第一产业增加值', '亿元', p1, rf(1, 7), 1);
  addRow('第二产业增加值', '亿元', p2, rf(2, 10), 1);
  addRow('第三产业增加值', '亿元', p3, rf(4, 12), 1);
  if (fam === 'industry'){
    addRow('社会消费品零售总额', '亿元', rf(700, 4600), rf(-1, 12), 1);
    addRow('固定资产投资', '亿元', rf(900, 5200), rf(-4, 11), 1);
    addRow('居民人均可支配收入', '元', ri(26000, 46000), rf(3, 9), 0);
  } else {
    const tr = rf(600, 3800);
    addRow('进出口总额', '亿元', tr, rf(-3, 16), 1);
    addRow('出口额', '亿元', tr * rf(0.45, 0.62), rf(-2, 18), 1);
    addRow('进口额', '亿元', tr * rf(0.35, 0.5), rf(-6, 14), 1);
    addRow('实际利用外资', '万美元', rf(1000, 30000), rf(-8, 20), 0);
  }

  return {
    kind: 'table', title: P + '主要经济指标', head: ['指标'].concat(years.map(y => y + '年')),
    rows: rows, facts: box.facts, order: box.order, years: years, prov: P
  };
}

function locateFromTable(diff){
  const mat = makeTableMaterial(diff);
  const ids = mat.order;
  const id = pick(ids);
  const f = mat.facts[id];
  return {
    id: qid(), tag: 'table', kind: 'locate', diff: diff,
    stem: '表中「' + f.label + '」是多少？请点击对应单元格。',
    material: mat, answerIds: [id], multi: 1,
    explain: '先横向找到指标所在行，再纵向找到年份所在列，交叉单元格即 ' + f.disp + '。注意表头单位。',
    tip: TIPS.table, targetSec: 20
  };
}

function makeLocate(diff){
  return RAND() < 0.6 ? locateFromText(diff) : locateFromTable(diff);
}

/* ============================================================
 * 综合套题：表格材料 + 5 题
 * ============================================================ */
function makePaper(diff){
  const mat = makeTableMaterial(diff);
  const years = mat.years;
  const y0 = years[0], yn = years[years.length - 1];
  const questions = [];
  const rowByName = (kw) => mat.rows.find(r => r.name.indexOf(kw) >= 0);

  // 1) 表格找数
  {
    const id = pick(mat.order);
    const f = mat.facts[id];
    questions.push({
      id: qid(), tag: 'table', kind: 'locate', diff: diff,
      stem: '表中「' + f.label + '」是多少？请点击对应单元格。',
      material: mat, answerIds: [id], multi: 1,
      explain: '横向找指标、纵向找年份，交叉处为 ' + f.disp + '。',
      tip: TIPS.table, targetSec: 20
    });
  }
  // 2) 增长率
  {
    const r = rowByName('生产总值') || mat.rows[0];
    const n = r.nums;
    const truth = (n[n.length - 1] - n[0]) / n[0] * 100;
    const o = buildOptions(truth, v => pct(v, 1), [truth + 0.8, truth - 0.7, truth + 1.6, truth * 1.2], 4);
    questions.push({
      id: qid(), tag: 'growth', kind: 'calc', diff: diff,
      stem: '表中' + r.name.replace(/（.*/, '') + '从' + y0 + '年到' + yn + '年的增长率约为？',
      material: mat, options: o.options, answer: o.answer, tip: TIPS.growth,
      explain: '增长率＝(' + fx(n[n.length - 1], 1) + '－' + fx(n[0], 1) + ')÷' + fx(n[0], 1) + '≈ ' + pct(truth, 1) + '。',
      targetSec: 40
    });
  }
  // 3) 比重
  {
    const total = rowByName('生产总值');
    const part = rowByName('第二产业') || rowByName('出口') || mat.rows[1];
    if (total && part && part !== total){
      const i = years.length - 1;
      const truth = part.nums[i] / total.nums[i] * 100;
      const o = buildOptions(truth, v => pct(v, 1), [truth + 0.5, truth - 0.4, truth + 1.1, 100 - truth], 4);
      questions.push({
        id: qid(), tag: 'weight', kind: 'calc', diff: diff,
        stem: '表中' + yn + '年' + part.name.replace(/（.*/, '') + '占' + total.name.replace(/（.*/, '') + '的比重约为？',
        material: mat, options: o.options, answer: o.answer, tip: TIPS.weight,
        explain: '比重＝' + fx(part.nums[i], 1) + '÷' + fx(total.nums[i], 1) + '≈ ' + pct(truth, 1) + '。',
        targetSec: 35
      });
    }
  }
  // 4) 增长量
  {
    const r = pick(mat.rows);
    const n = r.nums;
    const truth = n[n.length - 1] - n[0];
    const o = buildOptions(truth, v => fx(v, 1), [truth * 1.06, truth * 0.94, truth + 20, truth - 15], 4);
    questions.push({
      id: qid(), tag: 'growth', kind: 'calc', diff: diff,
      stem: '表中' + r.name.replace(/（.*/, '') + yn + '年比' + y0 + '年增加约多少？',
      material: mat, options: o.options, answer: o.answer, tip: TIPS.growth,
      explain: '增长量＝' + fx(n[n.length - 1], 1) + '－' + fx(n[0], 1) + '＝' + fx(truth, 1) + '。',
      targetSec: 30
    });
  }
  // 5) 平均/年均
  {
    const r = pick(mat.rows);
    const n = r.nums;
    const truth = n.reduce((s, x) => s + x, 0) / n.length;
    const o = buildOptions(truth, v => fx(v, 1), [truth * 1.03, truth * 0.97, truth * 1.06, Math.max(...n)], 4);
    questions.push({
      id: qid(), tag: 'avg', kind: 'calc', diff: diff,
      stem: '表中' + r.name.replace(/（.*/, '') + '各年数值的平均数约为？',
      material: mat, options: o.options, answer: o.answer, tip: TIPS.avg,
      explain: '合计数 ' + fx(n.reduce((s, x) => s + x, 0), 1) + ' ÷ ' + n.length + ' 年 ≈ ' + fx(truth, 1) + '。',
      targetSec: 35
    });
  }
  return {
    id: qid(), kind: 'paper', diff: diff, title: mat.title,
    material: mat, questions: shuffle(questions)
  };
}

/* ---------------- 技巧手册 ---------------- */
const GUIDE = [
  { t: '截位直除（最核心）', b: '分子不动或取整，分母只保留前三位有效数字，然后直接做除法。\n例：4738 ÷ 8264 → 47 ÷ 83 ≈ 0.566。\n选项首位不同：只算首位；首位相同算到第二位。' },
  { t: '增长量公式变形', b: '增长量 ＝ 现期 － 基期 ＝ 现期 × r ÷ (1＋r)。\n当 r≈1/n 时，增长量 ≈ 现期 ÷ (n＋1)。\n例：r＝12.5%＝1/8，增长量 ≈ 现期 ÷ 9。' },
  { t: '基期与现期', b: '基期 ＝ 现期 ÷ (1＋r)；现期 ＝ 基期 × (1＋r)。\n求基期是资料分析里出现频率最高的除法，全部用截位直除处理。' },
  { t: '比重变化只看增速', b: '部分增速 a ＞ 整体增速 b → 比重上升；a ＜ b → 比重下降。\n幅度 ≈ 现期比重 × (a－b) ÷ (1＋a)，单位是“个百分点”，不要写成“%”。' },
  { t: '平均数增长率', b: '(1＋总量增速) ÷ (1＋份数增速) － 1。\n与平均数本身的大小无关，两个增速换一下位置答案就变了。' },
  { t: '特征分数表', b: '1/6=16.7%  1/7=14.3%  1/8=12.5%  1/9=11.1%\n1/11=9.1%  1/12=8.3%  1/13=7.7%  1/14=7.1%\n1/15=6.7%  1/16=6.3%  1/17=5.9%  1/18=5.6%  1/19=5.3%\n2/7=28.6%  3/7=42.9%  2/9=22.2%  3/8=37.5%  5/8=62.5%\n见到 12.5%、16.7%、8.3% 立刻转成 1/8、1/6、1/12。' },
  { t: '分数比较与差分法', b: '先直除比首位；接近时用差分法：\n甲＝a/b，乙＝c/d，作差分数 (a－c)/(b－d)，\n若差分数 ＞ 乙，则 甲 ＞ 乙；反之亦然。\n大规模题目可直接交叉相乘。' },
  { t: '找数三步法', b: '① 圈时间：题干是现期还是基期，材料有没有“上年”。\n② 圈主体：逐字比对，“城镇居民”不是“居民”，“其中”后面才是细分。\n③ 圈考点：多少、增速、比重、平均、倍数——先定公式再找数。\n材料再长，也只找这三样，其余全是干扰。' },
  { t: '常见陷阱', b: '· 单位：万元 / 亿元、万人 / 人\n· 口径：同比 / 环比、累计 / 当月\n· 表述：“是几倍” vs “多几倍”（差 1）\n· 百分点 / 百分数：比重变化用百分点\n· 排序题：问“最大”别答成“最小”' }
];

const Bank = {
  setRandom: setRandom,
  makeCalc: makeCalc, makeLocate: makeLocate, makePaper: makePaper,
  makeDiv: makeDiv, makeGrowth: makeGrowth, makeWeight: makeWeight,
  makeAvg: makeAvg, makeFrac: makeFrac, makeMult: makeMult, makeCompare: makeCompare,
  makeTableMaterial: makeTableMaterial, matEconomy: matEconomy,
  TIPS: TIPS, TAG_NAME: TAG_NAME, CALC_TAGS: CALC_TAGS, GUIDE: GUIDE,
  util: { round: round, fx: fx, pct: pct, sig3: sig3, shuffle: shuffle }
};

global.XCGen = Bank;
if (typeof module !== 'undefined' && module.exports) module.exports = Bank;
})(typeof window !== 'undefined' ? window : globalThis);
