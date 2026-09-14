// ============ FitBuddy 数据持久化层 v1 ============
// 解决三个场景：
//   1) 用户清 localStorage / 换浏览器 → IndexedDB 兜底回灌
//   2) 跨 origin 切换（localhost ↔ github.io / repo 改名 / http↔https）→ window.name 桥接
//   3) 任意 origin 都找不到数据 → 弹出"检测到上次训练记录"恢复 toast
//
// 设计要点：
//   - **零侵入**：包装 Storage.prototype.setItem / removeItem，所有现有 localStorage 调用自动镜像到 IndexedDB
//   - **主源不变**：localStorage 仍是读写主源，IndexedDB 是冗余备份
//   - **降级友好**：IndexedDB 不可用时静默降级（不影响主流程），所有异步操作都有 catch
//   - **window.name 节流**：5 秒内最多触发一次更新，避免频繁同步写影响性能

(function () {
  'use strict';

  if (window.FB_persistence) return; // 防重复挂载

  var NS_PREFIX = 'fitbuddy_';
  var DB_NAME = 'fitbuddy_persist_db';
  var DB_VERSION = 1;
  var STORE = 'kv';
  var WINDOW_NAME_PREFIX = 'FB_SNAP:';
  var WINDOW_NAME_THROTTLE = 5000;     // ms
  var SNAPSHOT_KEYS = [                 // 写入 window.name 的关键 key
    'fitbuddy_trainlog',
    'fitbuddy_lastplan',
    'fitbuddy_profile',
    'fitbuddy_history',
    'fitbuddy_prefs'
  ];

  // ---------- IndexedDB 封装 ----------
  var _dbPromise = null;
  function openDB() {
    if (_dbPromise) return _dbPromise;
    if (typeof indexedDB === 'undefined') {
      _dbPromise = Promise.reject(new Error('IndexedDB 不可用'));
      return _dbPromise;
    }
    _dbPromise = new Promise(function (resolve, reject) {
      try {
        var req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = function (e) {
          var db = e.target.result;
          if (!db.objectStoreNames.contains(STORE)) {
            db.createObjectStore(STORE);
          }
        };
        req.onsuccess = function (e) { resolve(e.target.result); };
        req.onerror = function (e) { reject(e.target.error || new Error('IDB open failed')); };
        req.onblocked = function () { reject(new Error('IDB blocked')); };
      } catch (err) {
        reject(err);
      }
    });
    return _dbPromise;
  }

  function idbSet(key, value) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        try {
          var tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).put(value, key);
          tx.oncomplete = function () { resolve(); };
          tx.onerror = function (e) { reject(e.target.error); };
        } catch (e) { reject(e); }
      });
    }).catch(function () { /* 静默降级 */ });
  }

  function idbGet(key) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        try {
          var tx = db.transaction(STORE, 'readonly');
          var req = tx.objectStore(STORE).get(key);
          req.onsuccess = function (e) { resolve(e.target.result === undefined ? null : e.target.result); };
          req.onerror = function (e) { reject(e.target.error); };
        } catch (e) { reject(e); }
      });
    }).catch(function () { return null; });
  }

  function idbRemove(key) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        try {
          var tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).delete(key);
          tx.oncomplete = function () { resolve(); };
          tx.onerror = function (e) { reject(e.target.error); };
        } catch (e) { reject(e); }
      });
    }).catch(function () { /* 静默降级 */ });
  }

  function idbGetAllKeys() {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        try {
          var tx = db.transaction(STORE, 'readonly');
          var req = tx.objectStore(STORE).getAllKeys();
          req.onsuccess = function (e) { resolve(e.target.result || []); };
          req.onerror = function (e) { reject(e.target.error); };
        } catch (e) { reject(e); }
      });
    }).catch(function () { return []; });
  }

  // ---------- window.name 桥接 ----------
  // 跨 origin 跳转后 window.name 仍保留。写入用 base64 + JSON 序列化。
  function updateWindowName() {
    var now = Date.now();
    if (now - _lastWinNameUpdate < WINDOW_NAME_THROTTLE) return;
    _lastWinNameUpdate = now;
    try {
      var snap = {};
      var serialized = '';
      for (var i = 0; i < SNAPSHOT_KEYS.length; i++) {
        var k = SNAPSHOT_KEYS[i];
        var v = localStorage.getItem(k);
        if (v) snap[k] = v;
      }
      if (!Object.keys(snap).length) return;
      var json = JSON.stringify(snap);
      // base64 安全编码（处理中文）
      serialized = btoa(unescape(encodeURIComponent(json)));
      // 容量兜底：超过 1.5 MB 直接放弃（实测各浏览器普遍 2-3 MB）
      if (serialized.length > 1500000) return;
      window.name = WINDOW_NAME_PREFIX + serialized;
    } catch (e) {
      // window.name 容量超限 / 隐私模式 → 静默放弃
    }
  }
  var _lastWinNameUpdate = 0;

  function readWindowName() {
    try {
      var n = window.name;
      if (!n || n.indexOf(WINDOW_NAME_PREFIX) !== 0) return null;
      var b64 = n.slice(WINDOW_NAME_PREFIX.length);
      var json = decodeURIComponent(escape(atob(b64)));
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  // ---------- 包装 Storage.prototype ----------
  // 拦截 fitbuddy_* 写入，自动镜像到 IndexedDB + 更新 window.name
  var _wrapped = false;
  function wrapStorage() {
    if (_wrapped) return;
    _wrapped = true;
    try {
      var proto = Storage.prototype;
      var origSet = proto.setItem;
      var origDel = proto.removeItem;

      proto.setItem = function (k, v) {
        origSet.call(this, k, v);
        if (typeof k === 'string' && k.indexOf(NS_PREFIX) === 0) {
          idbSet(k, v);
          updateWindowName();
        }
      };

      proto.removeItem = function (k) {
        origDel.call(this, k);
        if (typeof k === 'string' && k.indexOf(NS_PREFIX) === 0) {
          idbRemove(k);
          updateWindowName();
        }
      };
    } catch (e) {
      // strict mode / 不可写 Storage.prototype → 静默放弃（降级到只用 localStorage）
    }
  }

  // ---------- 启动恢复流程 ----------
  // 优先级：localStorage > IndexedDB > window.name
  function hasAnyFitBuddyData() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i).indexOf(NS_PREFIX) === 0) return true;
      }
    } catch (e) {}
    return false;
  }

  function restoreFromIDB() {
    return idbGetAllKeys().then(function (keys) {
      if (!keys.length) return 0;
      var restored = 0;
      var tasks = [];
      keys.forEach(function (k) {
        if (typeof k !== 'string' || k.indexOf(NS_PREFIX) !== 0) return;
        if (localStorage.getItem(k) !== null) return; // 已存在，不覆盖
        tasks.push(
          idbGet(k).then(function (v) {
            if (v !== null && v !== undefined && localStorage.getItem(k) === null) {
              try {
                localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
                restored++;
              } catch (e) {}
            }
          })
        );
      });
      return Promise.all(tasks).then(function () { return restored; });
    });
  }

  // ---------- 恢复提示 UI ----------
  function showRestoreToast(snapshot, originInfo) {
    var keys = Object.keys(snapshot);
    if (!keys.length) return;
    // 防止重复弹
    if (document.getElementById('fb-restore-toast')) return;

    var info = originInfo || '上次 origin';
    var wrap = document.createElement('div');
    wrap.id = 'fb-restore-toast';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', '检测到训练数据，可恢复');
    wrap.style.cssText = [
      'position:fixed', 'left:50%', 'transform:translateX(-50%)',
      'bottom:88px', 'z-index:999999',
      'background:linear-gradient(135deg,#FF6B35 0%,#FF3E7F 100%)',
      'color:#fff', 'padding:14px 16px', 'border-radius:14px',
      'box-shadow:0 8px 28px rgba(255,107,53,0.45)',
      'display:flex', 'align-items:center', 'gap:10px',
      'font-size:14px', 'max-width:min(94vw,420px)',
      'font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif'
    ].join(';');

    wrap.innerHTML = [
      '<div style="flex:1;line-height:1.4">',
      '  <div style="font-weight:600;margin-bottom:2px">检测到训练数据</div>',
      '  <div style="opacity:.9;font-size:12px">从 <code style="background:rgba(255,255,255,.18);padding:1px 5px;border-radius:4px">' + escapeHtml(info) + '</code> · 共 ' + keys.length + ' 项</div>',
      '</div>',
      '<button id="fb-restore-yes" style="background:#fff;color:#FF3E7F;border:0;padding:7px 12px;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px">恢复</button>',
      '<button id="fb-restore-no" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5);padding:7px 12px;border-radius:8px;cursor:pointer;font-size:13px">忽略</button>'
    ].join('');

    document.body.appendChild(wrap);

    wrap.querySelector('#fb-restore-yes').onclick = function () {
      try {
        Object.keys(snapshot).forEach(function (k) {
          var v = snapshot[k];
          try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) {}
        });
      } catch (e) {}
      // 清掉 window.name 防止下次再问
      try { window.name = ''; } catch (e) {}
      // 软刷新让 UI 反映数据
      location.reload();
    };
    wrap.querySelector('#fb-restore-no').onclick = function () {
      try { window.name = ''; } catch (e) {} // 永久忽略
      wrap.parentNode && wrap.parentNode.removeChild(wrap);
    };
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- 初始化 ----------
  function init() {
    wrapStorage();

    var restoredCount = 0;
    var winSnap = readWindowName();

    return Promise.resolve()
      .then(function () { return restoreFromIDB(); })
      .then(function (n) {
        restoredCount = n || 0;
        // localStorage 已有数据 → window.name 是冗余的，清掉避免污染下次跨域
        if (hasAnyFitBuddyData()) {
          if (winSnap) {
            try { window.name = ''; } catch (e) {}
          }
          return null;
        }
        // localStorage 空 + window.name 有数据 → 询问恢复
        if (winSnap && Object.keys(winSnap).length) {
          var info = '上次访问';
          try {
            // window.name 里塞个 origin 标识会泄露隐私，这里只给"上次访问"提示
          } catch (e) {}
          showRestoreToast(winSnap, info);
        }
        return null;
      })
      .catch(function (e) {
        // 全程静默降级
        console.warn('[persistence] init skipped:', e && e.message);
      });
  }

  // 暴露 API（用于外部调用，比如手动触发备份）
  window.FB_persistence = {
    init: init,
    forceBackup: function () { _lastWinNameUpdate = 0; updateWindowName(); },
    hasIDB: function () { return _dbPromise !== null; },
    version: '1.0.0'
  };

  // DOMContentLoaded 时自动启动（planner-core.js 也是 deferred）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.FB_persistence.init();
    });
  } else {
    window.FB_persistence.init();
  }

  // pagehide 时强制刷一次 window.name（捕获用户切换页面前的最新数据）
  window.addEventListener('pagehide', function () {
    _lastWinNameUpdate = 0;
    updateWindowName();
  });

})();