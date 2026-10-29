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
  // 第二批：同样是"丢了很心疼"的数据，但重要性低于上面那批。
  // 以前这 4 个 key 根本没进快照 —— 换域名/清缓存后 PR 纪录、饮食草稿、马拉松配速、
  // 减载设置全没了，而训练日志还在，看起来就像"练了半年纪录被清零"。
  // 单独放一批是为了容量兜底：window.name 有上限，超了先丢这批，保住上面那批。
  var SNAPSHOT_KEYS_EXTRA = [
    'fitbuddy_prs',
    'fitbuddy_diet',
    'fitbuddy_marathon_paces',
    'fitbuddy_deload'
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
      var serialized = '';
      var snap = buildSnapshot(SNAPSHOT_KEYS.concat(SNAPSHOT_KEYS_EXTRA));
      if (!Object.keys(snap).length) return;
      // ⚠️ 快照只增不减。这是被真实事故逼出来的：
      //    缓存被清过之后又练了一次，trainlog 只剩 259 字符；而 window.name 里躺着
      //    清之前的完整记录（9360 字符）。旧逻辑每次写数据都**无脑重建整份快照**，
      //    于是残缺的那份把完整的那份覆盖了 —— 最后一份完整数据就这么没了。
      //    现在逐个 key 比较：旧快照里更长的那份一律保留，只把更长的新值并进来。
      //    （真的要清空是 resetAllData 的职责，那里会显式 window.name = ''）
      var prev = readWindowName();
      if (prev) {
        Object.keys(prev).forEach(function (k) {
          var ov = prev[k];
          if (ov === null || ov === undefined) return;
          var nv = snap[k];
          if (nv === undefined || String(ov).length > String(nv).length) snap[k] = ov;
        });
      }
      serialized = encodeSnapshot(snap);
      // 容量兜底：超过 1.5 MB 就退回到只存核心那批（实测各浏览器普遍 2-3 MB）
      // —— 不能因为加了 4 个新 key 反而把最要紧的训练日志一起挤掉。
      if (serialized.length > 1500000) {
        snap = buildSnapshot(SNAPSHOT_KEYS);
        serialized = encodeSnapshot(snap);
        if (serialized.length > 1500000) return;
      }
      window.name = WINDOW_NAME_PREFIX + serialized;
    } catch (e) {
      // window.name 容量超限 / 隐私模式 → 静默放弃
    }
  }
  var _lastWinNameUpdate = 0;

  function buildSnapshot(keys) {
    var snap = {};
    for (var i = 0; i < keys.length; i++) {
      var v = localStorage.getItem(keys[i]);
      if (v) snap[keys[i]] = v;
    }
    return snap;
  }

  function encodeSnapshot(snap) {
    // base64 安全编码（处理中文）
    return btoa(unescape(encodeURIComponent(JSON.stringify(snap))));
  }

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

  // ---------- 快照比现有数据更全 → 主动提示救援 ----------
  // 只算「localStorage 里确实有一份，但快照里那份明显更长」的。
  // localStorage 完全为空的不算 —— 那种走上面 showRestoreToast 的整份恢复流程。
  function snapLongerKeys(snap) {
    if (!snap) return [];
    var out = [];
    Object.keys(snap).forEach(function (k) {
      var cur = null;
      try { cur = localStorage.getItem(k); } catch (e) {}
      if (cur === null) return;   // 完全缺失 → 归整份恢复流程管
      var sv = String(snap[k] === null || snap[k] === undefined ? '' : snap[k]);
      if (!sv) return;
      if (sv.length > String(cur).length) {
        out.push({ key: k, cur: String(cur).length, snap: sv.length });
      }
    });
    return out;
  }

  // 提示条：告诉用户「还有一份更全的，去救援」。
  // 注意 **忽略 ≠ 删除** —— 关掉提示不会动 window.name，快照继续留着当底牌。
  function showSnapLongerToast(list) {
    if (!list || !list.length) return;
    if (document.getElementById('fb-snap-longer')) return;
    var run = function () {
      if (!document.body || document.getElementById('fb-snap-longer')) return;
      try {
        if (sessionStorage.getItem('fb_snaplonger_dismiss')) return;
      } catch (e) {}
      var c = 0, s = 0;
      list.forEach(function (x) { c += x.cur; s += x.snap; });
      var names = list.slice(0, 3).map(function (x) {
        return x.key.replace(NS_PREFIX, '');
      }).join('、') + (list.length > 3 ? ' 等' + list.length + ' 项' : '');

      var wrap = document.createElement('div');
      wrap.id = 'fb-snap-longer';
      wrap.setAttribute('role', 'dialog');
      wrap.style.cssText = [
        'position:fixed', 'left:50%', 'transform:translateX(-50%)',
        'bottom:88px', 'z-index:999998',
        'background:linear-gradient(135deg,#D97706 0%,#F59E0B 100%)',
        'color:#fff', 'padding:13px 15px', 'border-radius:14px',
        'box-shadow:0 8px 28px rgba(217,119,6,.45)',
        'display:flex', 'align-items:center', 'gap:10px',
        'font-size:14px', 'max-width:min(94vw,430px)',
        'font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif'
      ].join(';');
      wrap.innerHTML = [
        '<div style="flex:1;line-height:1.45;min-width:0">',
        '  <div style="font-weight:700;margin-bottom:2px">⚠️ 检测到更完整的训练数据</div>',
        '  <div style="opacity:.93;font-size:11.5px">' + escapeHtml(names) + '：现在 ' + c,
        '  字符，本地快照里还有 <b>' + s + '</b> 字符</div>',
        '</div>',
        '<button id="fb-sl-go" style="background:#fff;color:#D97706;border:0;padding:7px 12px;',
        'border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;white-space:nowrap">去恢复</button>',
        '<button id="fb-sl-no" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.55);',
        'padding:7px 10px;border-radius:8px;cursor:pointer;font-size:13px;white-space:nowrap">忽略</button>'
      ].join('');
      document.body.appendChild(wrap);

      wrap.querySelector('#fb-sl-no').onclick = function () {
        try { sessionStorage.setItem('fb_snaplonger_dismiss', '1'); } catch (e) {}
        wrap.parentNode && wrap.parentNode.removeChild(wrap);
      };
      wrap.querySelector('#fb-sl-go').onclick = function () {
        try { location.href = location.pathname + '?fbrescue=1'; } catch (e) {}
      };
    };
    if (document.body) run();
    else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else setTimeout(run, 300);
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

        // ⚠️⚠️ 这一行是 san 数据丢失的真正最后一刀，看清楚：
        //    旧逻辑是「localStorage 里有**任何** fitbuddy_ 数据 → 把 window.name 快照清掉」。
        //    门槛是「有任何」，不是「有完整的」。缓存被清过之后又练了一次的情况下：
        //      · trainlog 只剩 259 字符的残留 → hasAnyFitBuddyData() 照样 true
        //      · window.name 里躺着清之前的完整记录 9360 字符 → **直接被删**
        //    也就是**每次打开 App，最后一份完整数据就被抹一次**。救援当然什么都扫不到。
        //    现在改成先比大小：快照里只要有 key 比 localStorage 现在这份更长，
        //    就**留住快照**，并提示用户去救援。只有快照确实不比现在全时才清。
        var bigger = snapLongerKeys(winSnap);
        window.__fbSnapLongerKeys = bigger;
        if (bigger.length) {
          try { showSnapLongerToast(bigger); } catch (e) {}
          return null;
        }

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