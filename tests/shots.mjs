import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync, mkdirSync } from 'node:fs';

const PORT = 9333;
const FILE = 'file:///D:/2_code/xc/index.html';
mkdirSync('D:/2_code/xc/shots', { recursive: true });
const target = await (await fetch('http://127.0.0.1:' + PORT + '/json/new?' + encodeURIComponent(FILE), { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
await new Promise(r => ws.addEventListener('open', r));
const send = (method, params) => { const i = ++id; return new Promise(res => { pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params: params || {} })); }); };
const ev = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result && r.result.exceptionDetails) throw new Error('EVAL: ' + expr);
  return r.result.result.value;
};
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('D:/2_code/xc/shots/' + name + '.png', Buffer.from(r.result.data, 'base64'));
  console.log('shot', name);
};
await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 414, height: 896, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url: FILE }); await sleep(900);
await shot('m1-home');
await ev('document.querySelector("[data-mode=\'calc\']").click()'); await sleep(300); await shot('m2-calc');
await ev('document.querySelectorAll(".opt")[0].click()'); await sleep(80);
await ev('document.querySelector("#submitBtn").click()'); await sleep(250); await shot('m3-feedback');
await ev('document.querySelector("[data-act=\'back\']").click()'); await sleep(250);
await ev('document.querySelector("[data-mode=\'locate\']").click()'); await sleep(350); await shot('m4-locate');
await ev('document.querySelector("[data-act=\'back\']").click()'); await sleep(250);
await ev('document.querySelector("[data-mode=\'paper\']").click()'); await sleep(350); await shot('m5-paper');
await ev('document.querySelector("[data-act=\'back\']").click()'); await sleep(250);
await ev('document.querySelector("[data-act=\'tab\'][data-v=\'stats\']").click()'); await sleep(300); await shot('m6-stats');
await ev('document.querySelector("[data-act=\'tab\'][data-v=\'guide\']").click()'); await sleep(300); await shot('m7-guide');
// 结果页
await ev('document.querySelector("[data-act=\'tab\'][data-v=\'home\']").click()'); await sleep(200);
await ev('document.querySelector("[data-mode=\'calc\']").click()'); await sleep(250);
for (let i = 0; i < 3; i++) {
  await ev('document.querySelectorAll(".opt")[1].click()'); await sleep(60);
  await ev('document.querySelector("#submitBtn").click()'); await sleep(120);
  await ev('document.querySelector("#submitBtn").click()'); await sleep(140);
}
for (let i = 0; i < 7; i++) {
  const opts = await ev('document.querySelectorAll(".opt").length');
  if (opts === 0) break;
  await ev('document.querySelectorAll(".opt")[0].click()'); await sleep(50);
  await ev('document.querySelector("#submitBtn").click()'); await sleep(110);
  const done = await ev('document.querySelector("#submitBtn").textContent.indexOf("看结果") >= 0');
  await ev('document.querySelector("#submitBtn").click()'); await sleep(140);
  if (done) break;
}
await sleep(300); await shot('m8-result');
// 桌面
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 860, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: FILE }); await sleep(800);
await shot('d1-home');
await ev('document.querySelector("[data-mode=\'locate\']").click()'); await sleep(350); await shot('d2-locate');
console.log('done');
ws.close(); process.exit(0);
