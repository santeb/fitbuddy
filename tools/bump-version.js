#!/usr/bin/env node
/**
 * 版本号一键 bump 工具
 * 作用: 把 index.html 里 <script src="xxx.js?v=N"> 的版本号 +1,
 *       防止浏览器/SW 缓存旧 JS(改完代码忘记 bump 是经典坑)。
 *
 * 用法:
 *   node tools/bump-version.js            # 所有 JS 版本号 +1
 *   node tools/bump-version.js planner    # 只 bump 名字以 planner 开头的
 *   node tools/bump-version.js a b        # 多个模块名(前缀匹配)
 *
 * 退出码: 0=成功 1=未找到匹配项
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(process.cwd(), 'index.html');
const targets = process.argv.slice(2);

if (!fs.existsSync(htmlPath)) {
  console.error('未找到 index.html（请在项目根目录运行）');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');
const RE = /([\w.-]+\.js)\?v=(\d+)/g;
let count = 0;

html = html.replace(RE, (m, name, ver) => {
  if (targets.length && !targets.some((t) => name.indexOf(t) === 0)) return m;
  count++;
  const nv = parseInt(ver, 10) + 1;
  console.log(`  ${name}  v${ver} → v${nv}`);
  return `${name}?v=${nv}`;
});

if (!count) {
  console.error('未找到可 bump 的版本号' + (targets.length ? `（匹配: ${targets.join(', ')}）` : ''));
  process.exit(1);
}

fs.writeFileSync(htmlPath, html);
console.log(`✓ 已 bump ${count} 个版本号`);
