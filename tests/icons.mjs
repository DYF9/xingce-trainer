import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';
const sizes = [[180, 'icons/icon-180.png'], [192, 'icons/icon-192.png'], [512, 'icons/icon-512.png']];
const target = await (await fetch('http://127.0.0.1:9333/json/new?' + encodeURIComponent('file:///D:/2_code/xc/tests/icon.html'), { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
await new Promise(r => ws.addEventListener('open', r));
const send = (m, p) => { const i = ++id; return new Promise(res => { pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }); };
await send('Runtime.enable'); await send('Page.enable');
for (const [size, out] of sizes) {
  await send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'file:///D:/2_code/xc/tests/icon.html' });
  await sleep(600);
  const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: size, height: size, scale: 1 } });
  writeFileSync('D:/2_code/xc/' + out, Buffer.from(r.result.data, 'base64'));
  console.log(out, size);
}
ws.close(); process.exit(0);
