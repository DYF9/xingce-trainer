/* 把 index.html + css + js 打包成单个 html，方便直接发到手机 */
import { readFile, writeFile } from 'node:fs/promises';

const idx = await readFile('index.html', 'utf8');
const css = await readFile('assets/style.css', 'utf8');
const gen = await readFile('assets/gen.js', 'utf8');
const app = await readFile('assets/app.js', 'utf8');

let out = idx
  .replace(/<link rel="manifest"[^>]*>\s*/g, '')
  .replace(/<link rel="icon"[^>]*>\s*/g, '')
  .replace(/<link rel="apple-touch-icon"[^>]*>\s*/g, '')
  .replace(/<link rel="stylesheet" href="assets\/style.css">/, '<style>\n' + css + '\n</style>')
  .replace(/<script src="assets\/gen.js"><\/script>/, '<script>\n' + gen + '\n</script>')
  .replace(/<script src="assets\/app.js"><\/script>/, '<script>\n' + app + '\n</script>');

out = out.replace('<title>', '<!-- 单文件版：双击即可运行，可直接发到手机 -->\n<title>');
await writeFile('xingce-single.html', out, 'utf8');
console.log('built xingce-single.html', (out.length / 1024).toFixed(1) + ' KB');
