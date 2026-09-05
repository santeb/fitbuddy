// FitBuddy 恢复码备份 v1 — 把全部进度打包成一段文本码
// 复制到手机备忘录/微信收藏即可, 数据丢失或换域名/换手机时粘贴回来一键恢复
// 格式: FB2:<deflate-raw压缩+base64> (现代浏览器) / FB1:<明文JSON+base64> (老浏览器兜底)
(function () {
  'use strict';

  var PREFIX_RAW = 'FB1:';
  var PREFIX_DEFLATE = 'FB2:';
  var LAST_BACKUP_KEY = 'fitbuddy_lastbackupcode';

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
      '<button id="fbCopyBtn" style="' + btnStyle + '">📋 复制恢复码</button>');
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.updateBackupHint);
  } else {
    window.updateBackupHint();
  }
})();
