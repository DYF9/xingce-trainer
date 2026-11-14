/* ===== XC Sprint · 界面与状态机 ===== */
(function () {
'use strict';
var G = window.XCGen;
var $ = function (s, r) { return (r || document).querySelector(s); };
var KEY = 'xc.sprint.v1';
var DEFAULTS = { theme: 'dark', count: 10, diff: 2, timer: true, haptic: true, sound: false };

/* ---------------- 存储 ---------------- */
function loadStore() {
  var base = { settings: Object.assign({}, DEFAULTS), stats: {}, days: {}, total: 0, totalOk: 0, records: [] };
  try {
    var raw = localStorage.getItem(KEY);
    if (!raw) return base;
    var p = JSON.parse(raw);
    base.settings = Object.assign({}, DEFAULTS, p.settings || {});
    base.stats = p.stats || {};
    base.days = p.days || {};
    base.total = p.total || 0;
    base.totalOk = p.totalOk || 0;
    base.records = (p.records || []).slice(-40);
  } catch (e) { /* 忽略损坏数据 */ }
  return base;
}
var ST = loadStore();
function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} }

function todayKey() {
  var d = new Date();
  var m = String(d.getMonth() + 1), day = String(d.getDate());
  return d.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (day.length < 2 ? '0' + day : day);
}
function dayOf(offset) {
  var d = new Date(); d.setDate(d.getDate() - offset);
  var m = String(d.getMonth() + 1), day = String(d.getDate());
  return d.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (day.length < 2 ? '0' + day : day);
}

/* ---------------- 工具 ---------------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function fmtSec(ms) {
  var s = ms / 1000;
  if (s < 10) return (Math.round(s * 10) / 10).toFixed(1) + 's';
  if (s < 60) return Math.round(s) + 's';
  var m = Math.floor(s / 60), r = Math.round(s % 60);
  return m + 'm' + (r < 10 ? '0' : '') + r + 's';
}
function buzz(ms) {
  if (!ST.settings.haptic) return;
  if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} }
}

/* ---------------- 全局状态 ---------------- */
var S = {
  view: 'home',
  mode: null,
  idx: 0,
  list: [],
  cur: null,
  sessionStart: 0,
  timerId: null,
  result: null
};

/* ---------------- 卡片 / 组件 ---------------- */
function topbar(title, opts) {
  opts = opts || {};
  var right = '';
  if (opts.timer) right = '<span class="timer" id="timer">0s</span>';
  if (opts.extra) right += opts.extra;
  return '<div class="topbar">' +
    (opts.back ? '<button class="icon-btn" data-act="back" aria-label="返回">←</button>' : '') +
    '<h1>' + esc(title) + '</h1>' + right + '</div>';
}
function tabbar(active) {
  var items = [['home', '⚡', '训练'], ['stats', '📊', '统计'], ['guide', '📘', '手册']];
  return '<nav class="tabbar"><div class="tabinner">' + items.map(function (it) {
    return '<button data-act="tab" data-v="' + it[0] + '" class="' + (active === it[0] ? 'on' : '') + '">' +
      '<span class="ti">' + it[1] + '</span>' + it[2] + '</button>';
  }).join('') + '</div></nav>';
}

/* ---------------- 首页 ---------------- */
function renderHome() {
  var s = ST.settings;
  var d = ST.days[todayKey()] || { n: 0, ok: 0 };
  var acc = ST.total ? Math.round(ST.totalOk / ST.total * 100) : 0;
  var html = topbar('行测·资料分析训练', {
    extra: '<button class="icon-btn" data-act="theme" aria-label="切换主题">' + (s.theme === 'dark' ? '☀' : '🌙') + '</button>'
  });
  html += '<div id="appbody">';
  html += '<div class="hero"><div class="kicker">资料分析 · 专项提升</div>' +
    '<h2>算得快，也找得准</h2>' +
    '<p>计算训练磨截位直除与常用公式，找数训练带着你从材料里把数抠出来。双端离线可用。</p></div>';

  html += '<div class="card" style="display:flex;gap:14px;align-items:center;justify-content:space-between">' +
    '<div><div class="label">今日</div><div style="font-size:20px;font-weight:750">' + d.n + ' 题 · 正确率 ' + (d.n ? Math.round(d.ok / d.n * 100) : 0) + '%</div></div>' +
    '<div style="text-align:right"><div class="label">累计</div><div style="font-size:20px;font-weight:750">' + ST.total + ' 题 · ' + acc + '%</div></div>' +
    '</div>';

  html += '<div class="section-title">开始训练</div><div class="grid">';
  html += modeCard('calc', '🧮', '计算能力', '截位直除、增长率、比重、平均数、特征分数、速算乘法', ['限时', '即时解析', '技巧提示']);
  html += modeCard('locate', '🔍', '找数能力', '统计公报式材料，点出题干要的那个数（含双数据定位）', ['文字材料', '表格材料', '单位陷阱']);
  html += modeCard('paper', '📄', '综合模考', '一张表格材料 + 5 道题，还原真实资料分析节奏', ['找数+计算', '整组计时']);
  html += '</div>';

  html += '<div class="section-title">本组设置</div><div class="card">';
  html += '<div class="label" style="margin-bottom:6px">题量</div>' +
    seg('count', [['10', '10 题'], ['20', '20 题'], ['30', '30 题']], String(s.count)) +
    '<div class="sp10"></div><div class="label" style="margin-bottom:6px">难度</div>' +
    seg('diff', [['1', '基础'], ['2', '进阶'], ['3', '高难']], String(s.diff)) +
    '<div class="sp10"></div>' +
    '<div class="row between"><div><div class="label">计时模式</div><div class="muted" style="font-size:12.5px">关闭后不计时，适合刚学技巧时使用</div></div>' +
    '<button class="btn small ' + (s.timer ? 'primary' : '') + '" data-act="toggle-timer">' + (s.timer ? '已开启' : '已关闭') + '</button></div>';
  html += '</div>';
  html += '<div class="sp16"></div><p class="muted center" style="font-size:12px">数据只保存在本机浏览器 · 建议在手机浏览器“添加到主屏幕”</p>';
  html += '</div>';
  html += tabbar('home');
  return html;
}
function modeCard(id, ico, title, desc, tags) {
  return '<button class="mode" data-act="start" data-mode="' + id + '">' +
    '<span class="ico">' + ico + '</span>' +
    '<span style="flex:1;min-width:0"><h3>' + title + '</h3><p>' + desc + '</p>' +
    '<span class="tagline">' + tags.map(function (t) { return '<span class="chip">' + t + '</span>'; }).join('') + '</span></span>' +
    '<span class="muted" style="align-self:center">›</span></button>';
}
function seg(name, opts, cur) {
  return '<div class="seg">' + opts.map(function (o) {
    return '<button data-act="seg" data-k="' + name + '" data-v="' + o[0] + '" class="' + (o[0] === cur ? 'on' : '') + '">' + o[1] + '</button>';
  }).join('') + '</div>';
}

/* ---------------- 材料渲染 ---------------- */
function renderMaterial(mat, interactive) {
  var h = '<div class="material"><div class="mtitle"><span>' + esc(mat.title || '材料') + '</span>' +
    '<span class="chip">' + (interactive ? '点击数据作答' : '参考材料') + '</span></div>';
  if (mat.kind === 'text') {
    h += mat.paras.map(function (p) {
      return '<p>' + p.map(function (seg2) {
        if (seg2.id) return '<span class="num" data-fid="' + seg2.id + '">' + esc(seg2.s) + '</span>';
        return esc(seg2.s);
      }).join('') + '</p>';
    }).join('');
  } else {
    h += '<div class="twrap"><table class="mat"><thead><tr><th>' + esc(mat.head[0]) + '</th>' +
      mat.head.slice(1).map(function (x) { return '<th>' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      mat.rows.map(function (r) {
        return '<tr><td>' + esc(r.name) + '</td>' + r.cells.map(function (c) {
          return '<td class="cell" data-fid="' + c.id + '">' + esc(c.s) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }
  return h + '</div>';
}

/* ---------------- 会话 ---------------- */
function newQuestion() {
  var diff = ST.settings.diff;
  if (S.mode === 'calc') return G.makeCalc(diff);
  if (S.mode === 'locate') return G.makeLocate(diff);
  return null;
}
function startSession(mode) {
  S.mode = mode;
  S.idx = 0;
  S.list = [];
  S.sess = { ok: 0, ms: 0, items: [] };
  S.sessionStart = Date.now();
  if (mode === 'paper') {
    var p = G.makePaper(ST.settings.diff);
    S.list = p.questions;
    S.paper = p;
  } else {
    var n = ST.settings.count;
    for (var i = 0; i < n; i++) S.list.push(newQuestion());
  }
  S.view = 'session';
  S.cur = { q: S.list[0], sel: [], chosen: null, locked: false, t0: Date.now() };
  render();
  startTimer();
}
function startTimer() {
  stopTimer();
  if (!ST.settings.timer) return;
  S.timerId = setInterval(function () {
    var el = $('#timer');
    if (!el) return;
    var ms = Date.now() - (S.cur ? S.cur.t0 : S.sessionStart);
    el.textContent = fmtSec(ms);
    var lim = S.cur && S.cur.q.targetSec ? S.cur.q.targetSec * 1000 : 0;
    el.classList.toggle('hot', lim > 0 && ms > lim * 1.5);
  }, 250);
}
function stopTimer() { if (S.timerId) { clearInterval(S.timerId); S.timerId = null; } }

function renderSession() {
  var q = S.cur.q;
  var total = S.list.length;
  var isLocate = q.kind === 'locate';
  var html = topbar(modeName(S.mode) + ' · ' + (S.idx + 1) + '/' + total, { back: true, timer: ST.settings.timer });
  html += '<div id="appbody"><div class="progress"><i style="width:' + Math.round(S.idx / total * 100) + '%"></i></div>';
  html += '<div class="meta-line"><span class="chip on">' + esc(G.TAG_NAME[q.tag] || '题目') + '</span>' +
    '<span class="chip">建议 ' + (q.targetSec || 30) + 's</span>' +
    (isLocate ? '<span class="chip">需点选 ' + q.multi + ' 处</span>' : '') + '</div>';
  var matHtml = q.material ? renderMaterial(q.material, isLocate) : '';
  var stemHtml = '<div class="stem">' + esc(q.stem) + '</div>';
  // 找数题先给目标，再给材料；计算/模考题先给材料
  html += isLocate ? (stemHtml + matHtml) : (matHtml + stemHtml);
  if (q.options) {
    var two = q.options.every(function (o) { return o.length <= 10; });
    html += '<div class="opts' + (two ? ' two' : '') + '">' + q.options.map(function (o, i) {
      return '<button class="opt" data-act="opt" data-i="' + i + '"><span class="k">' + (i + 1) + '</span>' + esc(o) + '</button>';
    }).join('') + '</div>';
  } else {
    html += '<div class="muted" style="font-size:13px">在材料/表格中点击你认为需要的数据，再点“提交”。</div>';
  }
  html += '<div id="fb"></div>';
  html += '</div>';
  html += '<div class="actionbar"><div class="inner">' +
    '<button class="btn ghost" data-act="skip">跳过</button>' +
    '<button class="btn primary" data-act="submit" id="submitBtn" disabled>提交</button>' +
    '</div></div>';
  return html;
}
function modeName(m) { return m === 'calc' ? '计算' : m === 'locate' ? '找数' : '模考'; }

/* ---------------- 提交与反馈 ---------------- */
function updateSubmitState() {
  var btn = $('#submitBtn');
  if (!btn) return;
  var q = S.cur.q;
  if (q.options) btn.disabled = S.cur.chosen == null;
  else btn.disabled = S.cur.sel.length !== q.multi;
}

function submitAnswer(skip) {
  var c = S.cur, q = c.q;
  if (c.locked) { nextQuestion(); return; }
  if (!skip) {
    if (q.options && c.chosen == null) return;
    if (!q.options && c.sel.length !== q.multi) return;
  }
  var ms = Date.now() - c.t0;
  var correct = false;
  if (skip) { correct = false; }
  else if (q.options) { correct = (c.chosen === q.answer); }
  else {
    var need = q.answerIds.slice().sort().join('|');
    var got = c.sel.slice().sort().join('|');
    correct = (need === got);
  }
  c.locked = true;
  c.correct = correct;
  c.ms = ms;
  buzz(correct ? 18 : [12, 60, 12]);
  markDom(correct);
  showFeedback(correct);
  recordAnswer(q, correct, ms, c.chosen);
  var bar = $('.actionbar .inner');
  if (bar) bar.innerHTML = '<button class="btn ghost" data-act="quit">结束</button><button class="btn primary" data-act="next" id="submitBtn">' +
    (S.idx + 1 >= S.list.length ? '看结果' : '下一题') + '</button>';
}
function markDom(correct) {
  var c = S.cur, q = c.q;
  if (q.options) {
    document.querySelectorAll('.opt').forEach(function (el, i) {
      el.classList.remove('sel');
      if (i === q.answer) el.classList.add('correct');
      else if (i === c.chosen) el.classList.add('wrong');
      el.disabled = true;
    });
    return;
  }
  var need = q.answerIds.join('|');
  document.querySelectorAll('[data-fid]').forEach(function (el) {
    var id = el.getAttribute('data-fid');
    var picked = c.sel.indexOf(id) >= 0;
    var isNeed = need.split('|').indexOf(id) >= 0;
    el.classList.remove('sel');
    if (picked && isNeed) el.classList.add('hit');
    else if (picked && !isNeed) el.classList.add('miss');
    else if (!picked && isNeed) el.classList.add('reveal');
  });
}
function showFeedback(correct) {
  var c = S.cur, q = c.q;
  var h = '<div class="feedback ' + (correct ? 'good' : 'bad') + '">';
  h += '<div class="head">' + (correct ? '✓ 正确' : '✗ 再看一遍') + '<span class="muted" style="font-weight:400;font-size:12.5px;margin-left:auto">用时 ' + fmtSec(c.ms) + '</span></div>';
  h += '<div class="body">' + esc(q.explain) + '</div>';
  if (q.options && !correct) {
    h += '<div class="body" style="margin-top:6px">正确答案：<b>' + esc(q.options[q.answer]) + '</b></div>';
  }
  if (!q.options && !correct) {
    var names = q.answerIds.map(function (id) { return q.material.facts[id]; }).filter(Boolean)
      .map(function (f) { return '<b>' + esc(f.disp) + '</b>（' + esc(f.label) + '）'; }).join('、');
    h += '<div class="body" style="margin-top:6px">应选：' + names + '</div>';
  }
  if (q.tip) h += '<div class="tipbox"><b>技巧</b> · ' + esc(q.tip) + '</div>';
  h += '</div>';
  var box = $('#fb');
  if (box) box.innerHTML = h;
}
function recordAnswer(q, correct, ms, chosen) {
  if (!S.sess) S.sess = { ok: 0, ms: 0, items: [] };
  S.sess.ok += correct ? 1 : 0;
  S.sess.ms += ms;
  S.sess.items.push({ q: q, correct: correct, ms: ms, chosen: (chosen == null ? null : chosen) });
  ST.total += 1;
  if (correct) ST.totalOk += 1;
  var day = ST.days[todayKey()] || { n: 0, ok: 0 };
  day.n += 1; if (correct) day.ok += 1;
  ST.days[todayKey()] = day;
  var st = ST.stats[q.tag] || { n: 0, ok: 0, ms: 0 };
  st.n += 1; if (correct) st.ok += 1; st.ms += ms;
  ST.stats[q.tag] = st;
  save();
}

/* ---------------- 下一题 / 结束 ---------------- */
function nextQuestion() {
  if (S.idx + 1 >= S.list.length) return finishSession();
  S.idx += 1;
  S.cur = { q: S.list[S.idx], sel: [], chosen: null, locked: false, t0: Date.now() };
  render();
  startTimer();
}
function finishSession() {
  stopTimer();
  var total = S.list.length;
  var sess = S.sess || { ok: 0, ms: 0, items: [] };
  var ok = sess.ok, ms = sess.ms;
  var acc = total ? Math.round(ok / total * 100) : 0;
  S.sess = { ok: 0, ms: 0, items: [] };
  S.result = {
    mode: S.mode, total: total, ok: ok, acc: acc,
    avgMs: total ? ms / total : 0, totalMs: ms,
    items: sess.items
  };
  S.view = 'result';
  render();
}
function renderResult() {
  var r = S.result;
  var good = r.acc >= 80;
  var html = topbar('本组结果', { back: true });
  html += '<div id="appbody">';
  html += '<div class="card">';
  html += '<div class="score"><span class="big" style="color:' + (good ? 'var(--ok)' : r.acc >= 50 ? 'var(--warn)' : 'var(--bad)') + '">' + r.acc + '</span><span class="unit">% 正确率 · ' + r.ok + '/' + r.total + '</span></div>';
  html += '<div class="muted" style="font-size:13.5px">' + (good ? '节奏不错，继续保持。' : '错题解析在下面，先看思路再看算式。') + '</div>';
  html += '<div class="statgrid">' +
    '<div class="stat"><div class="v">' + r.total + '</div><div class="k">题量</div></div>' +
    '<div class="stat"><div class="v">' + fmtSec(r.avgMs) + '</div><div class="k">平均用时</div></div>' +
    '<div class="stat"><div class="v">' + fmtSec(r.totalMs) + '</div><div class="k">总用时</div></div>' +
    '</div></div>';

  // 每题用时条
  html += '<div class="section-title">每题用时（绿=对，红=错）</div><div class="card">';
  var maxMs = Math.max.apply(null, r.items.map(function (x) { return x.ms; }).concat([1]));
  html += '<div class="bars">' + r.items.map(function (x, i) {
    var hgt = Math.max(4, Math.round(x.ms / maxMs * 80));
    return '<div class="b" title="' + (x.correct ? '正确 ' : '错误 ') + fmtSec(x.ms) + '"><i style="height:' + hgt + 'px;background:' +
      (x.correct ? 'var(--ok)' : 'var(--bad)') + '"></i><span>' + (i + 1) + '</span></div>';
  }).join('') + '</div></div>';

  var wrong = r.items.filter(function (x) { return !x.correct; });
  if (wrong.length) {
    html += '<div class="section-title">错题回顾</div><div class="review">';
    html += wrong.map(function (x) {
      var q = x.q;
      var mine = q.options ? (x.chosen != null ? q.options[x.chosen] : '未作答') : '定位错误';
      var truth = q.options ? q.options[q.answer] : q.answerIds.map(function (id) {
        var f = q.material.facts[id]; return f ? f.disp : '';
      }).join(' + ');
      return '<div class="rv"><div class="q">' + esc(q.stem) + '</div>' +
        '<div class="ans">你选：<span class="n">' + esc(mine) + '</span> · 正确：<span class="y">' + esc(truth) + '</span></div>' +
        '<div class="muted" style="font-size:13px;margin-top:5px">' + esc(q.explain) + '</div></div>';
    }).join('');
    html += '</div>';
  }
  html += '</div>';
  html += '<div class="actionbar"><div class="inner">' +
    '<button class="btn ghost" data-act="tab" data-v="home">返回</button>' +
    '<button class="btn primary" data-act="again">再来一组</button></div></div>';
  return html;
}

/* ---------------- 统计 ---------------- */
function renderStats() {
  var s = ST.settings;
  var acc = ST.total ? Math.round(ST.totalOk / ST.total * 100) : 0;
  var html = topbar('训练统计', { extra: '<button class="icon-btn" data-act="theme">' + (s.theme === 'dark' ? '☀' : '🌙') + '</button>' });
  html += '<div id="appbody">';
  html += '<div class="card"><div class="row between"><div><div class="label">累计</div><div style="font-size:26px;font-weight:800">' + ST.total + ' <span style="font-size:14px;color:var(--dim)">题</span></div></div>' +
    '<div style="text-align:right"><div class="label">总正确率</div><div style="font-size:26px;font-weight:800;color:' + (acc >= 75 ? 'var(--ok)' : acc >= 50 ? 'var(--warn)' : 'var(--bad)') + '">' + acc + '%</div></div></div>';
  var days = [];
  for (var i = 6; i >= 0; i--) days.push([dayOf(i), ST.days[dayOf(i)] || { n: 0, ok: 0 }]);
  var maxN = Math.max.apply(null, days.map(function (d) { return d[1].n; }).concat([1]));
  html += '<div class="bars" style="margin-top:16px">' + days.map(function (d) {
    var hgt = Math.max(3, Math.round(d[1].n / maxN * 72));
    return '<div class="b" title="' + d[0] + ' ' + d[1].n + '题"><i style="height:' + hgt + 'px"></i><span>' + d[0].slice(5) + '</span></div>';
  }).join('') + '</div><div class="muted center" style="font-size:12px;margin-top:6px">近 7 天做题量</div></div>';

  var tags = Object.keys(ST.stats).filter(function (t) { return ST.stats[t].n >= 3; })
    .map(function (t) { return { tag: t, n: ST.stats[t].n, ok: ST.stats[t].ok, ms: ST.stats[t].ms / ST.stats[t].n }; })
    .sort(function (a, b) { return a.ok / a.n - b.ok / b.n; });
  if (tags.length) {
    html += '<div class="section-title">分项正确率（红条越长越该练）</div><div class="card"><div class="weak">';
    html += tags.map(function (t) {
      var p = Math.round(t.ok / t.n * 100);
      return '<div class="w"><span class="n">' + esc(G.TAG_NAME[t.tag] || t.tag) + '</span>' +
        '<span class="track"><i style="width:' + (100 - p) + '%"></i></span><span class="p">' + p + '%</span></div>';
    }).join('');
    html += '</div></div>';
    var worst = tags[0];
    if (worst.ok / worst.n < 0.75) {
      var tip = G.TIPS[worst.tag] || '';
      html += '<div class="card" style="margin-top:12px"><div class="label">最该补的一项</div>' +
        '<div style="font-weight:700;margin:4px 0 6px">' + esc(G.TAG_NAME[worst.tag] || worst.tag) + ' · ' + Math.round(worst.ok / worst.n * 100) + '%</div>' +
        '<div class="muted" style="font-size:13.5px">' + esc(tip) + '</div></div>';
    }
  } else {
    html += '<div class="card" style="margin-top:14px"><div class="muted">先做几组题，这里会出现分项正确率和弱项建议。</div></div>';
  }
  html += '<div class="sp16"></div><button class="btn small" data-act="reset" style="width:100%">清空全部记录</button>';
  html += '<div class="sp16"></div></div>';
  html += tabbar('stats');
  return html;
}

/* ---------------- 技巧手册 ---------------- */
function renderGuide() {
  var s = ST.settings;
  var html = topbar('技巧手册', { extra: '<button class="icon-btn" data-act="theme">' + (s.theme === 'dark' ? '☀' : '🌙') + '</button>' });
  html += '<div id="appbody"><div class="muted" style="font-size:13.5px;padding:0 2px 12px">资料分析提分只有两条路：算得快、找得准。下面的东西背下来，做题时直接套。</div>';
  html += G.GUIDE.map(function (g, i) {
    return '<details class="guide"' + (i === 0 ? ' open' : '') + '><summary>' + esc(g.t) + '</summary><div class="gbody">' + esc(g.b) + '</div></details>';
  }).join('');
  html += '<div class="card" style="margin-top:14px"><div class="label">训练建议</div><div class="muted" style="font-size:13.5px;line-height:1.8">' +
    '① 每天先做 10 题「计算能力」，重点练截位直除和特征分数；<br>' +
    '② 再做 8 题「找数能力」，强制自己在材料上点出数据，别心算；<br>' +
    '③ 一周做 2 套「综合模考」，按 5 题 6 分钟的真实节奏压时间；<br>' +
    '④ 统计页的红条就是你下周的复习顺序。</div></div>';
  html += '<div class="sp16"></div></div>';
  html += tabbar('guide');
  return html;
}

/* ---------------- 渲染入口 ---------------- */
function render() {
  var root = $('#app');
  var html = '';
  if (S.view === 'home') html = renderHome();
  else if (S.view === 'session') html = renderSession();
  else if (S.view === 'result') html = renderResult();
  else if (S.view === 'stats') html = renderStats();
  else if (S.view === 'guide') html = renderGuide();
  root.innerHTML = html;
  applyTheme();
  if (S.view === 'session') updateSubmitState();
  window.scrollTo(0, 0);
}
function applyTheme() { document.documentElement.setAttribute('data-theme', ST.settings.theme); }

/* ---------------- 事件 ---------------- */
document.addEventListener('click', function (e) {
  var t = e.target.closest('[data-act],[data-fid]');
  if (!t) return;
  // 材料点选
  if (t.hasAttribute('data-fid')) {
    onPick(t);
    return;
  }
  var act = t.getAttribute('data-act');
  switch (act) {
    case 'start': startSession(t.getAttribute('data-mode')); break;
    case 'tab':
      S.view = t.getAttribute('data-v');
      stopTimer();
      render();
      break;
    case 'theme':
      ST.settings.theme = ST.settings.theme === 'dark' ? 'light' : 'dark';
      save(); render();
      break;
    case 'seg': {
      var k = t.getAttribute('data-k'), v = t.getAttribute('data-v');
      if (k === 'count') ST.settings.count = parseInt(v, 10);
      if (k === 'diff') ST.settings.diff = parseInt(v, 10);
      save(); render();
      break;
    }
    case 'toggle-timer':
      ST.settings.timer = !ST.settings.timer; save(); render();
      if (S.view === 'session') startTimer();
      break;
    case 'opt': {
      if (S.cur.locked) return;
      var i = parseInt(t.getAttribute('data-i'), 10);
      S.cur.chosen = i;
      document.querySelectorAll('.opt').forEach(function (el, j) { el.classList.toggle('sel', j === i); });
      updateSubmitState();
      buzz(6);
      break;
    }
    case 'submit': submitAnswer(false); break;
    case 'skip': submitAnswer(true); break;
    case 'next': nextQuestion(); break;
    case 'back':
      stopTimer();
      S.view = 'home'; render();
      break;
    case 'quit': finishSession(); break;
    case 'again': startSession(S.mode); break;
    case 'reset':
      if (window.confirm('清空全部训练记录？')) {
        localStorage.removeItem(KEY);
        ST = loadStore();
        applyTheme();
        render();
      }
      break;
  }
});

function onPick(el) {
  if (S.view !== 'session') return;
  var q = S.cur.q;
  if (!q.material) return;
  var id = el.getAttribute('data-fid');
  if (S.cur.locked) return;
  var interactive = q.kind === 'locate';
  if (!interactive) {          // 计算题也允许点材料做辅助定位，只是不计分
    el.classList.toggle('sel');
    return;
  }
  var idx = S.cur.sel.indexOf(id);
  if (idx >= 0) S.cur.sel.splice(idx, 1);
  else {
    if (S.cur.sel.length >= q.multi) S.cur.sel.shift();
    S.cur.sel.push(id);
  }
  document.querySelectorAll('[data-fid]').forEach(function (x) {
    x.classList.toggle('sel', S.cur.sel.indexOf(x.getAttribute('data-fid')) >= 0);
  });
  buzz(5);
  updateSubmitState();
}

document.addEventListener('keydown', function (e) {
  if (S.view !== 'session') return;
  var q = S.cur.q;
  if (e.key >= '1' && e.key <= '4' && q.options) {
    var i = parseInt(e.key, 10) - 1;
    if (i < q.options.length && !S.cur.locked) {
      S.cur.chosen = i;
      document.querySelectorAll('.opt').forEach(function (el, j) { el.classList.toggle('sel', j === i); });
      updateSubmitState();
    }
    e.preventDefault();
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (S.cur.locked) nextQuestion();
    else submitAnswer(false);
  } else if (e.key === 'Escape') {
    S.view = 'home'; stopTimer(); render();
  }
});

/* ---------------- 启动 ---------------- */
applyTheme();
render();
if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js').catch(function () {});
  });
}
})();
