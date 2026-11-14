/* 生成器正确性自检：node tests/gen.test.js */
const B = require('../assets/gen.js');

let fails = [], checks = 0;
function ok(cond, msg){ checks++; if (!cond) fails.push(msg); }
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
B.setRandom(mulberry32(20241114));

function parseNum(s){ if (typeof s !== 'string') return NaN; const m = s.replace(/[,\s]/g, '').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; }
function parsePctStr(s){ const m = s.match(/(上升|下降)?\s*(-?\d+(?:\.\d+)?)/); if (!m) return NaN; const v = parseFloat(m[2]); return (m[1] === '下降') ? -v : v; }

function checkShape(q){
  ok(q && Array.isArray(q.options) && q.options.length === 4, 'options length 4 for ' + (q && q.tag));
  ok(new Set(q.options).size === 4, 'options unique for ' + q.tag + ' -> ' + JSON.stringify(q.options));
  ok(q.answer >= 0 && q.answer < 4, 'answer index for ' + q.tag);
  ok(typeof q.explain === 'string' && q.explain.length > 5 && q.explain.indexOf('undefined') < 0 && q.explain.indexOf('NaN') < 0, 'explain clean for ' + q.tag + ': ' + q.explain);
  ok(typeof q.stem === 'string' && q.stem.length > 3 && q.stem.indexOf('undefined') < 0 && q.stem.indexOf('NaN') < 0, 'stem clean for ' + q.tag);
  ok(!q.options.some(o => /undefined|NaN/.test(o)), 'options clean for ' + q.tag);
  ok(typeof q.targetSec === 'number' && q.targetSec > 0, 'targetSec for ' + q.tag);
  ok(typeof q.tip === 'string' && q.tip.length > 3, 'tip for ' + q.tag);
}

for (let i = 0; i < 500; i++){
  const diff = 1 + (i % 3);
  let q = B.makeDiv(diff);
  checkShape(q);
  ok(Math.abs(parseNum(q.options[q.answer]) / q.meta.truth - 1) < 0.006, 'div answer ~ truth : ' + q.options[q.answer] + ' vs ' + q.meta.truth);
  q.options.forEach((o, j) => { if (j !== q.answer) ok(Math.abs(parseNum(o) / q.meta.truth - 1) > 0.015, 'div distractor far: ' + o); });

  q = B.makeGrowth(diff);
  checkShape(q);
  const m = q.meta;
  if (m.kind === 'rate') ok(Math.abs(parseNum(q.options[q.answer]) - (m.B - m.A) / m.A * 100) <= 0.05, 'growth.rate');
  else if (m.kind === 'base') ok(Math.abs(parseNum(q.options[q.answer]) - m.B / (1 + m.r / 100)) / m.B < 0.002, 'growth.base');
  else if (m.kind === 'delta') ok(Math.abs(parseNum(q.options[q.answer]) - (m.B - m.A)) <= 0.01 * Math.abs(m.B - m.A) + 0.01, 'growth.delta');
  else ok(Math.abs(parseNum(q.options[q.answer]) - m.A * (1 + m.r / 100)) / m.B < 0.002, 'growth.current');

  q = B.makeWeight(diff);
  checkShape(q);
  if (q.meta.kind === 'share'){
    ok(Math.abs(parseNum(q.options[q.answer]) - q.meta.P / q.meta.W * 100) <= 0.05, 'weight.share');
  } else {
    const P0 = q.meta.P1 / (1 + q.meta.a / 100), W0 = q.meta.W1 / (1 + q.meta.b / 100);
    const truth = (q.meta.P1 / q.meta.W1 - P0 / W0) * 100;
    ok(Math.abs(truth) >= 0.6, 'weight.shift magnitude: ' + truth);
    ok(Math.abs(parsePctStr(q.options[q.answer]) - truth) <= 0.06, 'weight.shift value: ' + q.options[q.answer] + ' vs ' + truth.toFixed(3));
    ok((truth >= 0) === (q.options[q.answer].indexOf('上升') === 0), 'weight.shift direction');
    q.options.forEach((o, j) => { if (j !== q.answer) ok(Math.abs(parsePctStr(o) - truth) > 0.03, 'weight.shift distractor close: ' + o); });
  }

  q = B.makeAvg(diff);
  checkShape(q);
  ok(q.meta.a !== q.meta.b, 'avg a!=b');
  const at = ((1 + q.meta.a / 100) / (1 + q.meta.b / 100) - 1) * 100;
  ok(Math.abs(parseNum(q.options[q.answer]) - at) <= 0.06, 'avg value: ' + q.options[q.answer] + ' vs ' + at);
  q.options.forEach((o, j) => { if (j !== q.answer) ok(Math.abs(parseNum(o) - at) > 0.08, 'avg distractor close: ' + o); });

  q = B.makeFrac(diff);
  checkShape(q);
  if (q.meta.kind === 'frac'){
    ok(Math.abs(parseNum(q.options[q.answer]) - q.meta.num / q.meta.den * 100) <= 0.06, 'frac');
  } else {
    const p0 = q.options[q.answer].split('/');
    ok(Math.abs(Number(p0[0]) / Number(p0[1]) * 100 - q.meta.truth) < 0.06, 'fracRev correct');
    q.options.forEach((o, j) => { if (j !== q.answer){ const p = o.split('/'); ok(Math.abs(Number(p[0]) / Number(p[1]) * 100 - q.meta.truth) > 0.06, 'fracRev distractor farther: ' + o); } });
  }

  q = B.makeMult(diff);
  checkShape(q);
  ok(parseNum(q.options[q.answer]) === q.meta.truth, 'mult value');
  q.options.forEach((o, j) => { if (j !== q.answer) ok(parseNum(o) !== q.meta.truth, 'mult distinct'); });

  q = B.makeCompare(diff);
  checkShape(q);
  ok(q.options[q.answer] === (q.meta.left > q.meta.right ? '甲＞乙' : '甲＜乙'), 'compare');
  ok(q.meta.left !== q.meta.right, 'compare not equal');
}

let locCount = 0, tblCount = 0;
for (let i = 0; i < 400; i++){
  const q = B.makeLocate(1 + (i % 3));
  const mat = q.material;
  ok(!!mat && !!mat.facts, 'material');
  ok(q.answerIds.length === q.multi, 'multi count');
  q.answerIds.forEach(id => ok(!!mat.facts[id], 'answer id in facts'));
  const labels = q.answerIds.map(id => mat.facts[id].label);
  ok(new Set(labels).size === labels.length, 'locate ids distinct');
  ok(q.stem.indexOf('undefined') < 0 && q.explain.indexOf('undefined') < 0, 'locate text clean');
  if (mat.kind === 'text'){
    locCount++;
    const seen = new Set();
    mat.paras.forEach(p => p.forEach(s => { if (s.id){ ok(!!mat.facts[s.id], 'seg id exists'); seen.add(s.id); } }));
    Object.keys(mat.facts).forEach(id => ok(seen.has(id), 'every fact rendered: ' + id));
    ok(mat.paras.length >= 2, 'paragraphs');
  } else {
    tblCount++;
    ok(mat.head.length === mat.rows[0].cells.length + 1, 'table head width');
    mat.rows.forEach(r => ok(r.cells.length === mat.head.length - 1, 'row width'));
    mat.rows.forEach(r => r.cells.forEach(c => ok(!!mat.facts[c.id], 'cell id in facts')));
  }
}
console.log('locate text:', locCount, 'locate table:', tblCount);

for (let i = 0; i < 200; i++){
  const p = B.makePaper(1 + (i % 3));
  ok(p.questions.length === 5, 'paper 5 questions got ' + p.questions.length);
  const tags = p.questions.map(q => q.tag);
  ok(tags.indexOf('table') >= 0, 'paper includes locate');
  p.questions.forEach(q => {
    if (q.kind === 'calc') checkShape(q);
    else { ok(q.answerIds.every(id => !!p.material.facts[id]), 'paper locate id'); }
    ok(!!q.material, 'question carries material');
  });
  p.material.rows.forEach(r => r.nums.forEach(n => ok(isFinite(n), 'numeric cells')));
}

[['makeDiv', 'div'], ['makeGrowth','growth'], ['makeWeight','weight'], ['makeAvg','avg'], ['makeFrac','frac'], ['makeMult','mult'], ['makeCompare','compare']].forEach(([f, tag]) => {
  for (let i = 0; i < 80; i++){ const q = B[f](1 + (i % 3)); ok(q.tag === tag, 'tag ' + tag); }
});

console.log('checks:', checks, 'failures:', fails.length);
[...new Set(fails)].slice(0, 20).forEach(f => console.log('-', f.slice(0, 160)));
process.exit(fails.length ? 1 : 0);
