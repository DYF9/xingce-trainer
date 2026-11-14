import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 9333;
const FILE = 'file:///D:/2_code/xc/index.html';
const errors = [];
const logs = [];
let pass = 0, fail = 0;
function check(cond, name) { if (cond) { pass++; console.log('  PASS', name); } else { fail++; console.log('  FAIL', name); } }

const url = 'http://127.0.0.1:' + PORT + '/json/new?' + encodeURIComponent(FILE);
const target = await (await fetch(url, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
let msgId = 0;
const pending = new Map();
ws.addEventListener('message', function (ev) {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails;
    errors.push((d.exception && d.exception.description) || d.text);
  }
  if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) {
    logs.push(m.params.type + ': ' + m.params.args.map(function (a) { return a.value || a.description || a.type; }).join(' '));
  }
});
await new Promise(function (r) { ws.addEventListener('open', r); });
function send(method, params) {
  const id = ++msgId;
  return new Promise(function (res) { pending.set(id, res); ws.send(JSON.stringify({ id: id, method: method, params: params || {} })); });
}
async function ev(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result && r.result.exceptionDetails) {
    throw new Error('EVAL FAILED: ' + (r.result.exceptionDetails.exception && r.result.exceptionDetails.exception.description) + ' || ' + expr);
  }
  if (r.error) throw new Error('CDP FAILED: ' + JSON.stringify(r.error));
  return r.result.result.value;
}
const click = function (sel) { return ev('document.querySelector(' + JSON.stringify(sel) + ').click()'); };
const count = function (sel) { return ev('document.querySelectorAll(' + JSON.stringify(sel) + ').length'); };
const txt = function (sel) { return ev('(document.querySelector(' + JSON.stringify(sel) + ')||{}).textContent || ""'); };

await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');
await send('Page.navigate', { url: FILE });
await sleep(1000);

console.log('== 首页 ==');
check(await count('.mode') === 3, '三个训练入口');
check((await ev('document.title')).indexOf('资料分析') >= 0, '页面标题');
check(await count('.tabbar button') === 3, '底部导航三项');
check((await txt('.hero h2')).length > 2, '首页副标题');

console.log('== 计算模式 ==');
await click('[data-mode="calc"]');
await sleep(250);
check(await count('.opt') === 4, '四个选项');
check((await txt('.stem')).length > 6, '题干非空');
check(await ev('document.querySelector("#submitBtn").disabled') === true, '未作答时提交禁用');
await ev('document.querySelectorAll(".opt")[1].click()');
check(await count('.opt.sel') === 1, '选项高亮');
check(await ev('document.querySelector("#submitBtn").disabled') === false, '选中后可提交');
await click('#submitBtn');
await sleep(150);
check(await ev('!!document.querySelector(".feedback")'), '出现解析面板');
check(await count('.opt.correct') === 1, '标出正确项');
check((await txt('#submitBtn')).indexOf('下一题') >= 0, '按钮变为下一题');
await click('#submitBtn');
await sleep(150);
const w1 = await ev('document.querySelector(".progress i").style.width');
await ev('document.dispatchEvent(new KeyboardEvent("keydown",{key:"2",bubbles:true}))');
await sleep(60);
check(await count('.opt.sel') === 1, '键盘数字选中');
await ev('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}))');
await sleep(150);
check(await ev('!!document.querySelector(".feedback")'), '回车提交');
await ev('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}))');
await sleep(150);
const w2 = await ev('document.querySelector(".progress i").style.width');
check(w1 !== w2, '进度条推进 ' + w1 + ' -> ' + w2);

console.log('== 找数模式 ==');
await click('[data-act="back"]');
await sleep(250);
await click('[data-mode="locate"]');
await sleep(300);
check(await ev('!!document.querySelector(".material")'), '材料区渲染');
check(await count('[data-fid]') >= 6, '可点数据点数量 ' + (await count('[data-fid]')));
const needStr = await ev('(function(){var cs=[].slice.call(document.querySelectorAll(".chip"));for(var i=0;i<cs.length;i++){if(cs[i].textContent.indexOf("点选")>=0){return cs[i].textContent;}}return "1";})()');
const need = Number(String(needStr).replace(/[^0-9]/g, '') || 1);
await ev('document.querySelectorAll("[data-fid]")[0].click()');
check(await count('.num.sel, .cell.sel') === 1, '点选高亮');
await ev('(function(){var els=[].slice.call(document.querySelectorAll("[data-fid]"));for(var i=1;i<' + need + ';i++){els[i].click();}})()');
check(await ev('document.querySelector("#submitBtn").disabled') === false, '点够 ' + need + ' 处后可提交');
await click('#submitBtn');
await sleep(200);
check(await ev('!!document.querySelector(".feedback")'), '找数解析出现');
check(await count('.num.hit, .num.miss, .num.reveal, .cell.hit, .cell.miss, .cell.reveal') > 0, '标出对/错数据点');

console.log('== 综合模考 ==');
await click('[data-act="back"]');
await sleep(250);
await click('[data-mode="paper"]');
await sleep(350);
check(await ev('!!document.querySelector("table.mat")'), '表格材料渲染');
check(await ev('document.querySelectorAll("table.mat tbody tr").length') >= 4, '表格行数');
check(await ev('document.querySelectorAll("table.mat td.cell").length') >= 12, '可点单元格');
for (let i = 0; i < 5; i++) {
  const opts = await count('.opt');
  if (opts === 0) {
    const ns = await ev('(function(){var cs=[].slice.call(document.querySelectorAll(".chip"));for(var i=0;i<cs.length;i++){if(cs[i].textContent.indexOf("点选")>=0){return cs[i].textContent;}}return "1";})()');
    const n = Number(String(ns).replace(/[^0-9]/g, '') || 1);
    await ev('(function(){var els=[].slice.call(document.querySelectorAll("[data-fid]"));for(var k=0;k<' + n + ';k++){els[k].click();}})()');
  } else {
    await ev('document.querySelectorAll(".opt")[0].click()');
  }
  await click('#submitBtn');
  await sleep(130);
  const label = await txt('#submitBtn');
  await click('#submitBtn');
  await sleep(160);
  if (label.indexOf('看结果') >= 0) break;
}
await sleep(250);
check(await ev('!!document.querySelector(".score .big")'), '结果页得分展示');
check(await count('.bars .b') >= 5, '每题用时条形图');
check(await count('.stat') >= 3, '结果统计卡');

console.log('== 统计 / 手册 / 主题 ==');
await click('[data-act="tab"][data-v="home"]');
await sleep(250);
check(await count('.mode') === 3, '结果页可返回首页');
await click('[data-act="tab"][data-v="stats"]');
await sleep(250);
check((await ev('document.body.textContent')).indexOf('近 7 天') >= 0, '统计页 7 日柱状');
check(await ev('document.documentElement.scrollWidth <= window.innerWidth + 1'), '无横向溢出');
await click('[data-act="tab"][data-v="guide"]');
await sleep(250);
check(await count('details.guide') >= 8, '手册条目数 ' + (await count('details.guide')));
await click('[data-act="theme"]');
await sleep(150);
check(await ev('document.documentElement.getAttribute("data-theme")') === 'light', '主题切换为浅色');
check(await ev('getComputedStyle(document.body).backgroundColor') !== 'rgb(13, 17, 23)', '浅色背景生效');
await click('[data-act="theme"]');
await sleep(100);

console.log('== 持久化 ==');
const stored = await ev('!!window.localStorage.getItem("xc.sprint.v1")');
check(stored, '成绩已写入 localStorage');

console.log('== 控制台 ==');
const realErrors = errors.filter(function (e) { return !/favicon|manifest/i.test(e); });
const errLogs = logs.filter(function (l) { return l.indexOf('error') === 0; });
check(realErrors.length === 0, '无运行期异常' + (realErrors.length ? ' -> ' + realErrors.slice(0, 3).join(' | ') : ''));
check(errLogs.length === 0, '无 console.error' + (errLogs.length ? ' -> ' + errLogs.slice(0, 3).join(' | ') : ''));

console.log('');
console.log('RESULT pass=' + pass + ' fail=' + fail);
ws.close();
process.exit(fail ? 1 : 0);
