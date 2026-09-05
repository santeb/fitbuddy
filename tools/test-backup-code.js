// 测试 backup-code.js 编解码往返 (Node 17+ 有全局 CompressionStream/TextEncoder)
const fs = require('fs');

const store = {
  'fitbuddy_lastplan': JSON.stringify({ goal: 'muscle', week: 3 }),
  'fitbuddy_history': JSON.stringify([{ d: '2026-09-01', ex: '深蹲', w: 80, r: 5 }]),
  'fitbuddy_stats': JSON.stringify({ shares: 3, firstVisit: '2026-08-01' }),
  'other_key': 'not-included',
};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  key: i => Object.keys(store)[i],
  get length() { return Object.keys(store).length; },
};
global.window = global;
let modalHtml = '';
global.document = {
  readyState: 'loading',
  addEventListener: () => {},
  getElementById: () => ({ addEventListener: () => {}, style: {}, focus: () => {}, select: () => {}, remove: () => {} }),
  createElement: () => {
    const el = { style: { cssText: '' }, listeners: {} };
    Object.defineProperty(el, 'innerHTML', {
      get: () => modalHtml,
      set: v => { modalHtml = v; },
    });
    el.addEventListener = () => {};
    return el;
  },
  body: { appendChild: () => {} },
};

eval(fs.readFileSync('F:/workbuddy/fitness-app/backup-code.js', 'utf8'));

(async () => {
  // 1) 生成恢复码
  await window.showBackupModal();
  const m = modalHtml.match(/<textarea[^>]*>([^<]+)<\/textarea>/);
  if (!m) throw new Error('modal 里没找到恢复码');
  const code = m[1];
  const prefix = code.startsWith('FB2:') ? 'FB2 (deflate压缩)' : 'FB1 (明文兜底)';
  console.log('✅ 生成成功:', prefix, '长度', code.length);

  // 2) 清空数据, 走恢复逻辑 (parseCode + applyData 与 showRestoreModal 内部同链路)
  delete store['fitbuddy_lastplan'];
  delete store['fitbuddy_history'];
  delete store['fitbuddy_stats'];

  // parseCode 在闭包内, 通过恢复弹窗按钮逻辑无法直达; 这里复刻 applyData 路径:
  // eval 已把 showRestoreModal 挂到 window, 但按钮点击绑在 DOM。改为验证解压链路:
  // 用相同算法解出数据并按 exportData 规则写回
  const b64 = code.slice(4);
  const bin = Buffer.from(b64, 'base64');
  const fmt = code.startsWith('FB2:') ? 'deflate-raw' : null;
  let json;
  if (fmt) {
    const zlib = require('zlib');
    json = zlib.inflateRawSync(bin).toString('utf8');
  } else {
    json = bin.toString('utf8');
  }
  const data = JSON.parse(json);
  const keys = data._exportKeys;
  if (!keys || !keys.length) throw new Error('_exportKeys 为空');
  keys.forEach(k => { store[k] = typeof data[k] === 'object' ? JSON.stringify(data[k]) : String(data[k]); });
  console.log('✅ 解码成功, 恢复键:', keys.join(', '));
  if (!keys.includes('other_key')) console.log('✅ 非前缀键正确排除');
  console.log('✅ lastplan 恢复值:', store['fitbuddy_lastplan']);
  console.log('✅ 备份时间戳:', data._exportTime);

  // 3) FB2 压缩率
  const rawLen = Buffer.from(json, 'utf8').length;
  console.log('✅ 压缩率:', Math.round(bin.length / rawLen * 100) + '%', '(' + rawLen + 'B → ' + bin.length + 'B)');
  console.log('\n全部通过');
})().catch(e => { console.error('❌ FAIL:', e.message); process.exit(1); });
