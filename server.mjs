/* 零依赖静态服务器：给手机在局域网里打开本目录用
 * 用法：node server.mjs        端口默认 8080，可用 PORT=9000 node server.mjs
 */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { networkInterfaces } from 'node:os';

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 8080);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function lanAddresses() {
  const out = [];
  const n = networkInterfaces();
  for (const name of Object.keys(n)) {
    for (const a of n[name] || []) {
      if (a.family === 'IPv4' && !a.internal) out.push({ name, address: a.address });
    }
  }
  // 家用路由器网段优先，虚拟网卡（VPN/虚拟机）排后面
  const score = (ip) => ip.startsWith('192.168.') ? 0 : ip.startsWith('10.') ? 1 :
    /^172.(1[6-9]|2\d|3[01])\./.test(ip) ? 2 : 3;
  return out.sort((x, y) => score(x.address) - score(y.address));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let rel = normalize(url).replace(/^(\.\.[/\\])+/, '');
    let file = join(ROOT, rel);
    if (rel === '/' || rel === '' || rel === '\\') file = join(ROOT, 'index.html');
    let info = await stat(file).catch(() => null);
    if (info && info.isDirectory()) { file = join(file, 'index.html'); info = await stat(file).catch(() => null); }
    if (!info) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404 Not Found'); return; }
    const buf = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Service-Worker-Allowed': '/'
    });
    res.end(buf);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 ' + e.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const list = lanAddresses();
  console.log('');
  console.log('  行测资料分析训练 · 本地服务器已启动');
  console.log('  ------------------------------------');
  console.log('  电脑访问   http://localhost:' + PORT);
  if (list.length === 0) {
    console.log('  没找到局域网 IP：请确认电脑已连上 WiFi/网线');
  } else {
    for (const a of list) console.log('  手机访问   http://' + a.address + ':' + PORT + '   (' + a.name + ')');
  }
  console.log('  ------------------------------------');
  console.log('  手机要与电脑连同一个 WiFi；打不开多半是 Windows 防火墙拦截，');
  console.log('  首次运行弹窗请勾选“专用网络”并允许访问。按 Ctrl+C 停止。');
  console.log('');
});
