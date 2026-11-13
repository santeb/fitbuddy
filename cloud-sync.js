// ============ FitBuddy 云同步层 v1 (Supabase) ============
// 解决：localStorage 单设备存储，换手机 = 数据全清零（留存杀手）。
//
// 设计要点（与 persistence.js 同款零侵入风格）：
//   - **链式包装**：persistence.js 已包过一层 Storage.prototype，本层再包一层，
//     setItem 调用会依次穿过两层，互不干扰
//   - **key-value 整块同步**：一行数据 = 一个 localStorage key，不拆表，
//     客户端所有"读整块→改→写回"逻辑一行不改
//   - **新时间戳赢**：per-key LWW（last-write-wins），健身记录不需要 merge
//   - **匿名登录**：用户零感知，Supabase 自动签发 user_id 存本地，
//     同一浏览器/设备数据自动续上
//   - **降级友好**：CDN 挂了 / 网络不通 / 匿名登录关闭 → 全部静默降级，
//     纯本地功能不受任何影响
//
// 安全：anon publishable key 本来就是公开钥匙（同 Firebase apiKey），真正的
// 防线是 RLS —— 每个匿名 user 只能读写 user_id = auth.uid() 的行。
//
// 不同步的 key：RPG（本地专属）、错误日志、GA/埋点 ID、一次性 dismiss 标记。

(function () {
  'use strict';

  if (window.FB_cloud) return;

  // ---------- 配置 ----------
  var SUPABASE_URL = 'https://ndnltjsoomgcihnaqbov.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_EZBD5zLGGpLExRQfyvMfDQ_l853mLEx';
  var TABLE = 'user_data';
  var META_KEY = 'fitbuddy_syncmeta';          // 本地 {key: 上次写入时间戳ms}
  var PUSH_DEBOUNCE = 1500;                    // 写入后 1.5s 批量推送
  var JS_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';

  // 同步白名单：fitbuddy_ 前缀内排除这些（按前缀或全名）
  var EXCLUDE = [
    'fitbuddy_rpg_',          // RPG 本地专属，不上云
    'fitbuddy_errlog',        // 错误日志，噪音
    'fitbuddy_gaid',          // GA4 配置
    'fitbuddy_laid',          // GA4 配置
    'fitbuddy_onboarded',     // 一次性标记
    'fitbuddy_deload_dismissed_',
    'fitbuddy_reschedule_dismiss_',
    META_KEY                  // 自己的时间戳表不同步自己
  ];
  function shouldSync(k) {
    if (typeof k !== 'string' || k.indexOf('fitbuddy_') !== 0) return false;
    for (var i = 0; i < EXCLUDE.length; i++) {
      if (k.indexOf(EXCLUDE[i]) === 0) return false;
    }
    return true;
  }

  // ---------- 状态 ----------
  var client = null;          // supabase client
  var userId = null;          // 匿名 user id
  var ready = false;          // 登录 + 首次拉取完成
  var applyingRemote = false; // 远端数据落地时跳过 push 钩子，防回环
  var dirty = {};             // 待推送 {key: true}
  var pushTimer = null;
  var statusText = '初始化…';

  // ---------- 本地时间戳表 ----------
  function getMeta() {
    try { return JSON.parse(localStorage.getItem(META_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function setMetaKey(k, ts) {
    try {
      var m = getMeta();
      m[k] = ts;
      localStorage.setItem(META_KEY, JSON.stringify(m));
    } catch (e) {}
  }
  function delMetaKey(k) {
    try {
      var m = getMeta();
      delete m[k];
      localStorage.setItem(META_KEY, JSON.stringify(m));
    } catch (e) {}
  }

  // ---------- 状态条 UI（数据管理区） ----------
  function setStatus(s, color) {
    statusText = s;
    try {
      var el = document.getElementById('fbCloudStatus');
      if (el) { el.textContent = s; el.style.color = color || 'inherit'; }
    } catch (e) {}
  }

  // ---------- 包装 Storage.prototype（链在 persistence.js 之后） ----------
  var _wrapped = false;
  function wrapStorage() {
    if (_wrapped) return;
    _wrapped = true;
    try {
      var proto = Storage.prototype;
      var origSet = proto.setItem;      // persistence.js 包装后的那个
      var origDel = proto.removeItem;
      proto.setItem = function (k, v) {
        origSet.call(this, k, v);
        if (shouldSync(k) && !applyingRemote) {
          setMetaKey(k, Date.now());
          dirty[k] = true;
          schedulePush();
        }
      };
      proto.removeItem = function (k) {
        origDel.call(this, k);
        if (shouldSync(k) && !applyingRemote) {
          delMetaKey(k);
          if (ready && userId) {
            // 删除立即推（不 debounce，防止重置后又被旧数据复活）
            client.from(TABLE).delete().eq('key', k).eq('user_id', userId)
              .then(function () {}, function () {});
          }
        }
      };
    } catch (e) { /* 降级：只用本地 */ }
  }

  // ---------- 推送（debounce 批量） ----------
  function schedulePush() {
    if (!ready) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(flushPush, PUSH_DEBOUNCE);
  }
  function flushPush() {
    if (!ready || !userId) return;
    var keys = Object.keys(dirty);
    if (!keys.length) return;
    dirty = {};
    setStatus('☁ 同步中…');
    var now = new Date().toISOString();
    var rows = keys.map(function (k) {
      var raw = null;
      try { raw = localStorage.getItem(k); } catch (e) {}
      return { user_id: userId, key: k, value: raw, updated_at: now };
    });
    client.from(TABLE).upsert(rows).then(function (res) {
      if (res && res.error) {
        // 推送失败 → 回滚进 dirty，等下次写入或手动同步再试
        keys.forEach(function (k) { dirty[k] = true; });
        setStatus('☁ 同步失败', '#DC2626');
      } else {
        setStatus('☁ 已同步');
      }
    }).catch(function () {
      keys.forEach(function (k) { dirty[k] = true; });
      setStatus('☁ 离线', '#9CA3AF');
    });
  }

  // ---------- 远端值落地 ----------
  function applyRemote(k, value) {
    applyingRemote = true;
    try {
      if (value === null || value === undefined) {
        localStorage.removeItem(k);
      } else {
        // 存的时候原样塞字符串（jsonb 收下就是 JSON 字符串标量），取出来直接用
        var raw = (typeof value === 'string') ? value : JSON.stringify(value);
        localStorage.setItem(k, raw);
      }
      delMetaKey(k); // 本地时间戳清掉，下次以云端为准再定
    } catch (e) {}
    applyingRemote = false;
  }

  // ---------- 启动：登录 → 拉取合并 → flush 待推 ----------
  function loadSupabaseJS() {
    return new Promise(function (resolve, reject) {
      if (window.supabase && window.supabase.createClient) return resolve();
      var s = document.createElement('script');
      s.src = JS_CDN;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('CDN 加载失败')); };
      document.head.appendChild(s);
    });
  }

  function pullAndMerge() {
    return client.from(TABLE).select('key,value,updated_at').eq('user_id', userId)
      .then(function (res) {
        if (res && res.error) throw res.error;
        var rows = (res && res.data) || [];
        var meta = getMeta();
        var pulled = 0, newer = 0;
        rows.forEach(function (r) {
          if (!shouldSync(r.key)) return;
          var cloudTs = Date.parse(r.updated_at || '') || 0;
          var localTs = meta[r.key] || 0;
          var raw = null;
          try { raw = localStorage.getItem(r.key); } catch (e) {}
          var same = false;
          try {
            var cv = (typeof r.value === 'string') ? r.value : JSON.stringify(r.value);
            same = (raw === cv);
          } catch (e) {}
          if (same) { setMetaKey(r.key, Math.max(cloudTs, localTs)); return; }
          if (cloudTs >= localTs) {
            applyRemote(r.key, r.value);
            pulled++;
          } else {
            dirty[r.key] = true; // 本地更新 → 推上去
            newer++;
          }
        });
        return { pulled: pulled, newer: newer, total: rows.length };
      });
  }

  function init() {
    setStatus('☁ 连接中…');
    return loadSupabaseJS().then(function () {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
      // 已有匿名会话直接用，没有就匿名登录
      return client.auth.getSession().then(function (res) {
        var sess = res && res.data && res.data.session;
        if (sess && sess.user) return sess.user;
        return client.auth.signInAnonymously().then(function (r2) {
          if (r2 && r2.error) throw r2.error;
          return r2.data.user;
        });
      });
    }).then(function (user) {
      if (!user) throw new Error('no user');
      userId = user.id;
      return pullAndMerge();
    }).then(function (info) {
      ready = true;
      flushPush(); // 把启动期间攒下的本地写入 + 比云端新的 key 一并推上去
      if (info && info.pulled > 0) {
        try {
          if (typeof showToast === 'function') showToast('☁ 已从云端恢复 ' + info.pulled + ' 项数据，刷新生效');
        } catch (e) {}
      }
      setStatus('☁ 已同步');
      console.log('[cloud-sync] ok, rows:', info && info.total, 'pulled:', info && info.pulled);
    }).catch(function (e) {
      setStatus('☁ 未连接', '#9CA3AF');
      console.warn('[cloud-sync] 降级为纯本地:', e && (e.message || e));
    });
  }

  // ---------- 手动同步 ----------
  function syncNow() {
    if (!ready) { setStatus('☁ 未连接，稍后再试', '#DC2626'); return; }
    setStatus('☁ 同步中…');
    // 全量对账：云端拉一遍合并，再把本地全部白名单 key 推上去
    pullAndMerge().then(function () {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (shouldSync(k)) dirty[k] = true;
      }
      flushPush();
    }).catch(function () {
      setStatus('☁ 同步失败', '#DC2626');
    });
  }

  // ---------- API ----------
  window.FB_cloud = {
    init: init,
    syncNow: syncNow,
    status: function () { return { ready: ready, userId: userId, statusText: statusText, dirty: Object.keys(dirty).length }; },
    version: '1.0.0'
  };

  // 立即装钩子（拦住启动阶段的一切写入），登录拉取异步进行
  wrapStorage();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 800); });
  } else {
    setTimeout(init, 800);
  }
  // 离开页面前把攒着的写入推出去
  window.addEventListener('pagehide', function () { clearTimeout(pushTimer); flushPush(); });

})();
