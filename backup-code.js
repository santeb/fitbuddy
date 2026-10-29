// FitBuddy 恢复码备份 v1 — 把全部进度打包成一段文本码
// 复制到手机备忘录/微信收藏即可, 数据丢失或换域名/换手机时粘贴回来一键恢复
// 格式: FB2:<deflate-raw压缩+base64> (现代浏览器) / FB1:<明文JSON+base64> (老浏览器兜底)
(function () {
  'use strict';

  var PREFIX_RAW = 'FB1:';
  var PREFIX_DEFLATE = 'FB2:';
  var LAST_BACKUP_KEY = 'fitbuddy_lastbackupcode';
  var NUDGE_KEY = 'fitbuddy_backup_nudge_at';   // 首页备份提醒被忽略的时间
  var NUDGE_DAYS = 7;                           // 备份提醒周期
  var URL_PARAM = 'restore';                    // 恢复链接: ?restore=FB2:xxx
  // 判断"有真数据"只看这几个 key —— fitbuddy_fab_hint 这类偏好设置不算，
  // 否则刚装 App 点了两下就催备份，很烦。
  var REAL_DATA_KEYS = [
    'fitbuddy_trainlog', 'fitbuddy_lastplan',
    'fitbuddy_history', 'fitbuddy_prs', 'fitbuddy_bodylog'
  ];
  var EMPTY_VALS = ['', '[]', '{}', 'null', 'undefined'];

  // ---------- 编解码工具 ----------
  function bytesToB64(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function b64ToBytes(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  function canCompress() {
    return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
  }
  async function pipeBytes(bytes, Ctor, fmt) {
    var stream = new Blob([bytes]).stream().pipeThrough(new Ctor(fmt));
    var buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
  }

  // ---------- 生成 ----------
  function collectData() {
    var data = {};
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k.indexOf('fitbuddy_') === 0 && k !== LAST_BACKUP_KEY) {
        try { data[k] = JSON.parse(localStorage.getItem(k)); }
        catch (e) { data[k] = localStorage.getItem(k); }
        keys.push(k);
      }
    }
    if (!keys.length) return null;
    data._exportKeys = keys;
    data._exportTime = new Date().toISOString();
    return data;
  }

  async function generateCode() {
    var data = collectData();
    if (!data) return null;
    var bytes = new TextEncoder().encode(JSON.stringify(data));
    if (canCompress()) {
      try {
        var packed = await pipeBytes(bytes, CompressionStream, 'deflate-raw');
        // 压缩反而变大(极小数据)则落回明文
        if (packed.length < bytes.length) return PREFIX_DEFLATE + bytesToB64(packed);
      } catch (e) { /* 落回明文 */ }
    }
    return PREFIX_RAW + bytesToB64(bytes);
  }

  // ---------- 解析 ----------
  async function parseCode(code) {
    code = (code || '').replace(/\s+/g, '');
    if (code.indexOf(PREFIX_DEFLATE) === 0) {
      if (!canCompress()) throw new Error('当前浏览器版本过低,无法解压恢复码');
      var packed = b64ToBytes(code.slice(PREFIX_DEFLATE.length));
      var raw = await pipeBytes(packed, DecompressionStream, 'deflate-raw');
      return JSON.parse(new TextDecoder().decode(raw));
    }
    if (code.indexOf(PREFIX_RAW) === 0) {
      var b = b64ToBytes(code.slice(PREFIX_RAW.length));
      return JSON.parse(new TextDecoder().decode(b));
    }
    throw new Error('无法识别的恢复码');
  }

  // ---------- 应用(与 importData 同规则) ----------
  function applyData(data) {
    var validPrefixes = ['fitbuddy_', 'fb_'];
    var keys = data._exportKeys || Object.keys(data).filter(function (k) {
      return validPrefixes.some(function (p) { return k.indexOf(p) === 0; });
    });
    if (!keys.length) throw new Error('恢复码中没有有效数据');
    var count = 0;
    keys.forEach(function (k) {
      try {
        if (typeof k !== 'string' || k.length > 100 || k.indexOf('_') < 0) return;
        var val = data[k];
        if (val === undefined || val === null) return;
        if (typeof val === 'function' || typeof val === 'symbol') return;
        var strVal = (typeof val === 'object') ? JSON.stringify(val) : String(val);
        if (strVal.length > 2 * 1024 * 1024) return;
        localStorage.setItem(k, strVal);
        count++;
      } catch (e) {}
    });
    if (!count) throw new Error('恢复码中没有有效数据');
    return count;
  }

  // ---------- UI ----------
  function trackEvent(name) {
    try { if (typeof window.track === 'function') window.track(name); } catch (e) {}
  }
  function toast(msg) {
    try { if (typeof window.showToast === 'function') window.showToast(msg); } catch (e) {}
  }

  function closeModal() {
    var ov = document.getElementById('fbCodeModal');
    if (ov) ov.remove();
  }

  // ---------- 备份提醒 / 恢复链接 ----------
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }

  function hasRealData() {
    return REAL_DATA_KEYS.some(function (k) {
      var v = lsGet(k);
      return !!v && EMPTY_VALS.indexOf(String(v).trim()) < 0;
    });
  }
  function daysSinceBackup() {
    var last = parseInt(lsGet(LAST_BACKUP_KEY) || '0', 10) || 0;
    if (!last) return 9999;                       // 从没备份过
    return Math.floor((Date.now() - last) / 86400000);
  }
  function nudgeDays() {
    if (!hasRealData()) return 0;
    var days = daysSinceBackup();
    if (days < NUDGE_DAYS) return 0;
    var dismissed = parseInt(lsGet(NUDGE_KEY) || '0', 10) || 0;
    if (Date.now() - dismissed < NUDGE_DAYS * 86400000) return 0;
    return days;
  }

  // 首页顶部挂一条提醒。只在 #page-plan（训练计划页，默认首页）里出现，
  // 切到别的 tab 就看不见了，不打扰。
  function mountBackupNudge() {
    var days = nudgeDays();
    var host = document.getElementById('page-plan');
    if (!days || !host || document.getElementById('fbBackupNudge')) return;

    var bar = document.createElement('div');
    bar.id = 'fbBackupNudge';
    bar.style.cssText = 'margin:12px 16px 0;padding:12px 14px;border-radius:14px;'
      + 'background:linear-gradient(135deg,#FFF7ED,#FFE8D6);border:1.5px solid #FFD6B8;';
    bar.innerHTML =
      '<div style="display:flex;align-items:flex-start;gap:10px;">'
      + '<div style="font-size:19px;line-height:1.25;">🧩</div>'
      + '<div style="flex:1;min-width:0;">'
      + '<div style="font-size:13px;font-weight:800;color:var(--text,#333);margin-bottom:3px;">'
      + (days > 999 ? '训练数据还没备份过' : '已经 ' + days + ' 天没备份了') + '</div>'
      + '<div style="font-size:11.5px;color:var(--text,#333);opacity:.7;line-height:1.55;">'
      + '微信或浏览器一清缓存就没了,换手机也不跟着走。<br>'
      + '生成一段恢复码存进微信收藏,换环境点开就能全部回来。</div>'
      + '<div style="margin-top:9px;display:flex;gap:8px;flex-wrap:wrap;">'
      + '<button id="fbNudgeGen" style="padding:7px 13px;border:none;border-radius:10px;'
      + 'font-size:12px;font-weight:700;color:#fff;cursor:pointer;'
      + 'background:linear-gradient(135deg,#FF6B35,#FF8E53);">生成恢复码</button>'
      + '<button id="fbNudgeLater" style="padding:7px 11px;border-radius:10px;font-size:12px;'
      + 'font-weight:600;cursor:pointer;border:1.5px solid var(--border,#eee);'
      + 'color:var(--text2,#888);background:transparent;">' + NUDGE_DAYS + ' 天后再说</button>'
      + '</div></div>'
      + '<div id="fbNudgeX" style="font-size:15px;opacity:.35;cursor:pointer;padding:2px 4px;'
      + 'color:var(--text,#333);line-height:1;">✕</div>'
      + '</div>';

    host.insertBefore(bar, host.firstChild);

    function dismiss(remember) {
      if (remember) lsSet(NUDGE_KEY, Date.now());
      bar.remove();
    }
    document.getElementById('fbNudgeX').addEventListener('click', function () {
      dismiss(true); trackEvent('backup_nudge_dismiss');
    });
    document.getElementById('fbNudgeLater').addEventListener('click', function () {
      dismiss(true); trackEvent('backup_nudge_later');
    });
    document.getElementById('fbNudgeGen').addEventListener('click', function () {
      dismiss(false); trackEvent('backup_nudge_gen'); showBackupModal();
    });
  }

  // 恢复链接:?restore=<码>。把整段码塞进 URL 存微信收藏,
  // 换手机 / 换浏览器 / 微信清缓存后点开链接即恢复,不用手抄几百字符的码。
  // 生成时必须 encodeURIComponent —— base64 里的 + 会被 URLSearchParams 解成空格。
  function buildRestoreUrl(code) {
    var base = '';
    try { base = location.origin + location.pathname; } catch (e) { base = ''; }
    if (!base) return '';
    return base + '?' + URL_PARAM + '=' + encodeURIComponent(code);
  }
  function readRestoreParam() {
    try {
      var p = new URLSearchParams(location.search).get(URL_PARAM);
      return p ? String(p).trim() : '';
    } catch (e) {
      var m = (location.search || '').match(/[?&]restore=([^&]+)/);
      return m ? decodeURIComponent(m[1]) : '';
    }
  }
  // 恢复后把 URL 里的码去掉再刷新,否则每次刷新都要问一遍、码也会留在历史记录里
  function reloadClean() {
    try { history.replaceState(null, '', location.pathname + (location.hash || '')); } catch (e) {}
    try { location.reload(); } catch (e) {}
  }

  async function handleRestoreLink() {
    var code = readRestoreParam();
    if (!code) return;
    var data = null;
    try { data = await parseCode(code); } catch (e) {
      toast('❌ 这个恢复链接已损坏或复制不全');
      return;
    }
    var keys = (data && data._exportKeys) || [];
    var n = keys.length || Object.keys(data || {}).length;
    if (!n) { toast('❌ 恢复链接里没有数据'); return; }
    var when = '';
    if (data && data._exportTime) {
      try { when = new Date(data._exportTime).toLocaleDateString(); } catch (e) {}
    }
    var ov = shell('🔗 一键恢复进度',
      '这份链接里有 <b>' + n + '</b> 条数据' + (when ? '（导出于 ' + when + '）' : '') + '。<br>'
      + '恢复会<b>覆盖</b>当前设备上的训练数据。',
      '<button id="fbLinkRestoreBtn" style="' + btnStyle + '">✅ 恢复并刷新</button>'
      + '<button id="fbLinkCancelBtn" style="width:100%;margin-top:8px;padding:11px;border:none;'
      + 'border-radius:12px;font-size:13px;font-weight:600;color:var(--text2,#888);'
      + 'background:transparent;cursor:pointer;">取消</button>');
    document.getElementById('fbLinkCancelBtn').addEventListener('click', function () {
      closeModal(); reloadClean();
    });
    document.getElementById('fbLinkRestoreBtn').addEventListener('click', function () {
      var btn = this;
      btn.disabled = true; btn.textContent = '恢复中…';
      try {
        var count = applyData(data);
        trackEvent('backup_link_restore');
        toast('✅ 已恢复 ' + count + ' 条数据,即将刷新…');
        setTimeout(reloadClean, 900);
      } catch (e) {
        btn.disabled = false; btn.textContent = '✅ 恢复并刷新';
        toast('❌ ' + (e && e.message ? e.message : '恢复失败'));
      }
    });
    void ov;
  }

  function shell(title, sub, bodyHtml) {
    closeModal();
    var ov = document.createElement('div');
    ov.id = 'fbCodeModal';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:900;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease;';
    ov.innerHTML =
      '<div style="background:var(--card,#fff);border-radius:20px;max-width:380px;width:100%;max-height:86vh;overflow:auto;padding:20px;box-shadow:0 10px 40px rgba(0,0,0,.3);">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
      '<div style="font-size:17px;font-weight:800;color:var(--text,#333);">' + title + '</div>' +
      '<div id="fbCodeClose" style="font-size:20px;color:var(--text,#333);opacity:.5;cursor:pointer;padding:4px 8px;">✕</div>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--text,#333);opacity:.6;margin-bottom:14px;line-height:1.5;">' + sub + '</div>' +
      bodyHtml +
      '</div>';
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.id === 'fbCodeClose') closeModal();
    });
    document.body.appendChild(ov);
    return ov;
  }

  var taStyle = 'width:100%;box-sizing:border-box;height:110px;border:1.5px dashed var(--primary,#FF6B35);border-radius:12px;padding:10px;font-size:11px;font-family:monospace;word-break:break-all;resize:none;background:var(--bg,#f8f8f8);color:var(--text,#333);outline:none;';
  var btnStyle = 'width:100%;margin-top:12px;padding:12px;border:none;border-radius:12px;font-size:14px;font-weight:700;color:#fff;cursor:pointer;background:linear-gradient(135deg,#FF6B35,#FF8E53);';

  // 生成恢复码弹窗
  window.showBackupModal = async function () {
    var code = await generateCode();
    if (!code) { toast('😊 还没有数据,先生成一份训练计划吧'); return; }
    try { localStorage.setItem(LAST_BACKUP_KEY, String(Date.now())); } catch (e) {}
    trackEvent('backup_code_gen');
    updateBackupHint();
    shell('🧩 你的恢复码',
      '复制后存到手机备忘录或微信「文件传输助手」。<br>数据丢失 / 换手机 / 换网址时,粘贴回来即可恢复全部进度。',
      '<textarea id="fbCodeTa" readonly style="' + taStyle + '">' + code + '</textarea>' +
      '<div style="font-size:11px;opacity:.5;margin-top:6px;color:var(--text,#333);">码长 ' + code.length + ' 字符 · 生成于 ' + new Date().toLocaleDateString() + '</div>' +
      '<button id="fbCopyBtn" style="' + btnStyle + '">📋 复制恢复码</button>' +
      '<button id="fbLinkBtn" style="width:100%;margin-top:8px;padding:11px;border-radius:12px;' +
      'font-size:13px;font-weight:700;cursor:pointer;border:1.5px solid var(--primary,#FF6B35);' +
      'color:var(--primary,#FF6B35);background:transparent;">🔗 复制恢复链接(存微信收藏)</button>' +
      '<div style="font-size:11px;opacity:.55;margin-top:7px;line-height:1.5;color:var(--text,#333);">' +
      '链接 = 网址 + 恢复码。存到微信收藏后,<b>换手机 / 清了缓存</b>点开它就能自动恢复,' +
      '不用手抄上面那一大段码。<br>⚠️ 链接里含你的训练数据,自己存就好,别转发给别人。</div>');
    var copyBtn = document.getElementById('fbCopyBtn');
    copyBtn.addEventListener('click', function () {
      var ta = document.getElementById('fbCodeTa');
      function ok() {
        copyBtn.textContent = '✅ 已复制,记得去存一份!';
        toast('✅ 恢复码已复制,存到备忘录吧');
        setTimeout(function () { copyBtn.textContent = '📋 复制恢复码'; }, 2500);
      }
      function fallback() {
        ta.focus(); ta.select();
        try { if (document.execCommand('copy')) { ok(); return; } } catch (e) {}
        toast('请长按输入框 → 全选 → 复制');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(ok, fallback);
      } else fallback();
    });

    var linkBtn = document.getElementById('fbLinkBtn');
    var linkLabel = '🔗 复制恢复链接(存微信收藏)';
    var url = buildRestoreUrl(code);
    if (!url) linkBtn.style.display = 'none';
    linkBtn.addEventListener('click', function () {
      function okLink() {
        linkBtn.textContent = '✅ 已复制,去微信收藏粘贴';
        toast(url.length > 4000
          ? '✅ 链接偏长,已复制。粘贴到收藏后别用短链工具转发'
          : '✅ 恢复链接已复制,存进微信收藏');
        trackEvent('backup_link_gen');
        setTimeout(function () { linkBtn.textContent = linkLabel; }, 2500);
      }
      function fallbackLink() {
        toast('复制失败,请手动复制上面的恢复码,用「恢复码恢复」导入');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(okLink, fallbackLink);
      } else fallbackLink();
    });
  };

  // 恢复码恢复弹窗
  window.showRestoreModal = function () {
    shell('📮 恢复进度',
      '粘贴之前保存的恢复码。注意:恢复会<b>覆盖</b>当前所有训练数据。',
      '<textarea id="fbRestoreTa" placeholder="把恢复码粘贴到这里…" style="' + taStyle + '"></textarea>' +
      '<button id="fbRestoreBtn" style="' + btnStyle + '">🔄 恢复我的进度</button>');
    var btn = document.getElementById('fbRestoreBtn');
    btn.addEventListener('click', async function () {
      var ta = document.getElementById('fbRestoreTa');
      var code = (ta.value || '').trim();
      if (!code) { toast('先粘贴恢复码'); return; }
      btn.disabled = true; btn.textContent = '解析中…';
      try {
        var data = await parseCode(code);
        var count = applyData(data);
        if (!confirm('✅ 恢复码有效,共 ' + count + ' 条数据。\n\n确定覆盖当前数据并刷新吗?')) {
          btn.disabled = false; btn.textContent = '🔄 恢复我的进度';
          return;
        }
        trackEvent('backup_code_restore');
        toast('✅ 已恢复 ' + count + ' 条数据,即将刷新…');
        setTimeout(function () { location.reload(); }, 1200);
      } catch (e) {
        btn.disabled = false; btn.textContent = '🔄 恢复我的进度';
        toast('❌ ' + (e && e.message ? e.message : '恢复码无效,请检查是否复制完整'));
      }
    });
  };

  // "上次备份"提示(打赏页数据管理区下方)
  window.updateBackupHint = function () {
    var el = document.getElementById('fbBackupHint');
    if (!el) return;
    var last = 0;
    try { last = parseInt(localStorage.getItem(LAST_BACKUP_KEY) || '0', 10) || 0; } catch (e) {}
    if (!last) {
      el.textContent = '💡 建议每周生成一次恢复码,防浏览器清数据';
      return;
    }
    var days = Math.floor((Date.now() - last) / 86400000);
    el.textContent = days === 0 ? '🧩 今天备份过,稳' :
      (days <= 14 ? '🧩 上次备份:' + days + ' 天前' : '⚠️ 已经 ' + days + ' 天没备份了,建议重新生成一次');
  };

  function boot() {
    window.updateBackupHint();
    // 带恢复链接进来时只处理恢复,不弹备份提醒(用户还没数据,催他备份没意义)
    if (readRestoreParam()) {
      handleRestoreLink().catch(function () {});
      return;
    }
    mountBackupNudge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
