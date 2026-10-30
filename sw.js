// FitBuddy Service Worker v3.1 — 完整离线缓存 + 后台提醒
// 生产环境禁用 console.log（控制台执行 self._DEBUG=1 可重新启用）
(function(){ if (!self._DEBUG) { var _noOp=function(){}; try{console.log=_noOp;}catch(e){} } })();

// ⚠️ 发版必须 bump 这个数字。名字一变, activate 里"删掉不在白名单的 cache"
//   那段就会自动清掉旧的缓存桶, 用户下次打开必然重新拉全部资源。
//   v10 → v11 的血案: v122 那次 bump 之后, v126/v129/v136~v148 全都没 bump,
//   而当时 JS/CSS 还走 cacheFirst(靠 index.html 里的 ?v=NNN 刷新)。
//   微信 webview 连 index.html 一起缓存 → 手机拿到旧 HTML → 引用旧 ?v= →
//   旧 js 在缓存里直接命中 → 整站停在几周前的版本, 表现为"进度页好几个功能凭空没了"。
//   现在 JS/CSS 已改成 networkFirst, 但 bump 仍然是发版习惯: 清掉历史堆积的旧条目。
var APP_VER = '31';
var CACHE_STATIC = 'fitbuddy-static-v' + APP_VER;
var CACHE_GIFS   = 'fitbuddy-gifs-v1';
var CACHE_MAX    = 60; // GIF 缓存最多保留 60 个，超出后按 LRU 清理

// 核心静态资源（首次安装必须全部缓存）
var CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// ============ 安装阶段：缓存核心资源 ============
self.addEventListener('install', function(e) {
  console.log('[SW] 安装中...');
  e.waitUntil(
    caches.open(CACHE_STATIC).then(function(cache) {
      console.log('[SW] 缓存核心文件');
      return cache.addAll(CORE_ASSETS).catch(function(err) {
        console.warn('[SW] 部分核心文件缓存失败（离线仍可用）：', err.message);
      });
    }).then(function() {
      console.log('[SW] 安装完成，进入激活阶段');
      return self.skipWaiting();
    })
  );
});

// ============ 激活阶段：清理旧缓存 ============
self.addEventListener('activate', function(e) {
  console.log('[SW] 激活中，清理旧缓存...');
  e.waitUntil(
    caches.keys().then(function(allKeys) {
      return Promise.all(
        allKeys
          .filter(function(k) {
            return k !== CACHE_STATIC && k !== CACHE_GIFS;
          })
          .map(function(k) {
            console.log('[SW] 删除旧缓存：', k);
            return caches.delete(k);
          })
      );
    }).then(function() {
      console.log('[SW] 激活完成，劫持所有客户端');
      return self.clients.claim();
    })
  );
});

// ============ 请求拦截：分层缓存策略 ============
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // 只处理 GET 请求
  if (e.request.method !== 'GET') return;

  // 跳过 chrome 扩展和跨域请求
  if (url.indexOf('chrome-extension://') === 0) return;
  if (url.indexOf('://') > -1 && !url.match(/^https?:\/\/[^/]*\/(.*)/)) {
    // 允许所有同源请求，包括 file:// 和 https://
  }
  try {
    var parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:' &&
        parsed.protocol !== 'file:' && parsed.protocol !== 'data:') return;
  } catch(e) { return; }

  var isGif   = /\.gif(\?|$)/i.test(url);
  var isLocal = url.indexOf(location.origin) === 0 || url.indexOf('/') === 0 ||
                url.indexOf('file://') === 0;

  // GIF 文件：缓存优先 + 网络更新（后台刷新）
  if (isGif && isLocal) {
    e.respondWith(handleGifRequest(e.request));
    return;
  }

  // HTML 文件：网络优先（确保 HTML 更新即时生效）
  if (isLocal && (/\.(html|webmanifest)(\?|$)/i.test(url) ||
                  url === './' || url === '/' || url.endsWith(location.pathname))) {
    e.respondWith(networkFirst(e.request, CACHE_STATIC));
    return;
  }

  // JS/CSS/JSON：网络优先 + 缓存兜底（离线仍可用）
  // 以前这里是 cacheFirst，靠 index.html 里的 ?v=NNN 刷新，实测不可靠 —— 详见 APP_VER 注释。
  // 只要 index.html 被微信 webview 或磁盘缓存拦住一版，用户就永远回不到新代码。
  // networkFirst 联网时必拿最新（cache:'no-cache' 会重新验证，命中 304 很便宜），
  // 断网时才退回缓存，离线可用性不受影响。
  if (isLocal && /\.(js|css|json)(\?|$)/i.test(url)) {
    e.respondWith(networkFirst(e.request, CACHE_STATIC));
    return;
  }

  // 其他同源资源：网络优先，失败时走缓存
  if (isLocal) {
    e.respondWith(networkFirst(e.request, CACHE_STATIC));
    return;
  }

  // 外部资源（CDN/图片等）：只缓存成功响应
  e.respondWith(fetchAndCache(e.request, CACHE_STATIC));
});

// ============ GIF 处理：Cache-First + 后台刷新 + LRU 清理 ============
function handleGifRequest(request) {
  return caches.match(request).then(function(cached) {
    // 立即返回缓存（如果有）
    if (cached) {
      // 后台刷新：不管有没有缓存，都去网络拿一份更新缓存
      fetch(request).then(function(response) {
        if (response && response.status === 200) {
          caches.open(CACHE_GIFS).then(function(cache) {
            cache.put(request, response.clone()).then(function() {
              trimGifCache();
            });
          });
        }
      }).catch(function() {});
      return cached;
    }

    // 没有缓存，走网络
    return fetch(request).then(function(response) {
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE_GIFS).then(function(cache) {
          cache.put(request, clone).then(function() { trimGifCache(); });
        });
      }
      return response;
    }).catch(function() {
      // GIF 加载失败，返回兜底 SVG
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">' +
        '<rect width="200" height="150" fill="#f0f0f0" rx="12"/>' +
        '<text x="100" y="75" text-anchor="middle" dominant-baseline="middle" ' +
        'font-size="48">🏋️</text>' +
        '</svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    });
  });
}

// GIF 缓存超过上限时清理最老的
function trimGifCache() {
  caches.open(CACHE_GIFS).then(function(cache) {
    cache.keys().then(function(keys) {
      if (keys.length > CACHE_MAX) {
        // 删除前 N-M 个（LRU：越早缓存的越先删）
        var toDelete = keys.slice(0, keys.length - CACHE_MAX);
        toDelete.forEach(function(req) { cache.delete(req); });
        console.log('[SW] GIF 缓存清理：删除 ' + toDelete.length + ' 个旧文件');
      }
    });
  });
}

// ============ 缓存策略工具 ============

// Cache-First：先缓存，没有则网络
// 注：JS/CSS 已改用 networkFirst（见 fetch 拦截），这里只留给将来可能的静态资源。
function cacheFirst(request, cacheName) {
  return caches.match(request).then(function(cached) {
    if (cached) return cached;
    return fetch(request).then(function(response) {
      if (response && response.status === 200) {
        caches.open(cacheName).then(function(cache) { cache.put(request, response.clone()); });
      }
      return response;
    }).catch(function() {
      // 网络失败 → 走统一兜底（JS/CSS 不会拿到 index.html）
      return offlineFallback(request);
    });
  });
}

// Network-First：先网络，失败用缓存
function networkFirst(request, cacheName) {
  // cache:'no-cache' = 每次向服务器重新验证（命中 304 成本极低），
  // 不让浏览器磁盘缓存 / 微信 webview 把旧版本一直喂给用户
  //
  // ⚠️ 别写成 `response || caches.match(request) || offlineFallback(request)` ——
  // caches.match() 返回的是 Promise，永远 truthy，会短路掉后面的兜底，
  // 最终 respondWith(undefined) 直接抛错。兜底必须放在独立的 then 里判断。
  return fetch(request, { cache: 'no-cache' })
    .then(function(response) {
      if (response && response.status === 200) {
        caches.open(cacheName).then(function(cache) { cache.put(request, response.clone()); });
      }
      return response;
    })
    .catch(function() {
      return caches.match(request);
    })
    .then(function(response) {
      if (response) return response;
      return offlineFallback(request);
    });
}

// 离线兜底。⚠️ 只有 HTML 导航请求能回退到 index.html。
// 以前 JS/CSS 请求失败也返回 index.html —— <script> 收到一段 HTML 直接解析报错，
// 后面依赖它的功能集体消失，而且很难往缓存方向去想。现在直接报网络错误。
function offlineFallback(request) {
  var u = (request && request.url) || '';
  if (/\.(js|css|json)(\?|$)/i.test(u)) return Response.error();
  return caches.match('./index.html');
}

// 仅抓取并缓存（用于外部资源）
function fetchAndCache(request, cacheName) {
  return fetch(request).then(function(response) {
    if (response && response.status === 200) {
      caches.open(cacheName).then(function(cache) { cache.put(request, response.clone()); });
    }
    return response;
  }).catch(function() {});
}

// ============ 定期同步：后台检测提醒 ============
self.addEventListener('periodicsync', function(e) {
  if (e.tag === 'fitbuddy-reminder-sync') {
    console.log('[SW] periodicSync 触发，检查提醒...');
    e.waitUntil(checkReminderOnWake());
  }
});

// 后台同步事件
self.addEventListener('sync', function(e) {
  if (e.tag === 'fitbuddy-reminder-sync') {
    console.log('[SW] sync 事件触发，检查提醒...');
    e.waitUntil(checkReminderOnWake());
  }
});

// SW 被唤醒时检查提醒
async function checkReminderOnWake() {
  try {
    var clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (var i = 0; i < clients.length; i++) {
      clients[i].postMessage({ type: 'CHECK_REMINDER' });
    }
    if (clients.length === 0) {
      // 没有窗口打开，尝试直接发送通知（通过 IndexedDB 读取提醒设置）
      checkAndShowNotification();
      // 场景化推送：3天未打卡挽留 / 周日生成下周计划
      checkSceneNotificationsSW();
    }
  } catch(e) {
    console.warn('[SW] checkReminderOnWake 失败：', e.message);
  }
}

// 从 IndexedDB 读取提醒设置并显示通知
function checkAndShowNotification() {
  var dbReq = indexedDB.open('fitbuddy_reminder_db', 1);
  dbReq.onerror = function() {};

  dbReq.onupgradeneeded = function(e) {
    try {
      e.target.result.createObjectStore('settings', { keyPath: 'key' });
    } catch(ex) {}
  };

  dbReq.onsuccess = function(e) {
    try {
      var tx = e.target.result.transaction('settings', 'readonly');
      var store = tx.objectStore('settings');
      var getReq = store.get('reminder');
      getReq.onsuccess = function() {
        var rem = getReq.result;
        if (!rem || !rem.enabled) return;

        var now = new Date();
        var [h, m] = (rem.time || '20:00').split(':').map(Number);
        var remindDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
        var diffMin = (now - remindDate) / 60000;

        if (diffMin >= -30 && diffMin <= 30) {
          var todayKey = 'fitbuddy_reminder_shown_' + now.getFullYear() + '-' +
                         (now.getMonth()+1) + '-' + now.getDate();
          // SW 侧无法存 localStorage，用 sessionStorage 标记（不可靠，这里直接发通知）
          self.registration.showNotification('FitBuddy - 该训练啦！💪', {
            body: '今天还有训练等着你，打开 App 开始打卡！',
            icon: 'data:image/svg+xml,' + encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
              '<rect width="100" height="100" rx="22" fill="#FF6B35"/>' +
              '<text y=".9em" font-size="60" text-anchor="middle" x="50" fill="white">🏋️</text>' +
              '</svg>'
            ),
            tag: 'fitbuddy-reminder',
            requireInteraction: true,
            vibrate: [200, 100, 200],
            data: { url: './' }
          });
        }
      };
    } catch(ex) {}
  };
}

// 场景化推送：3天未打卡挽留 + 周日生成下周计划（SW 后台无窗口时）
function checkSceneNotificationsSW() {
  var dbReq = indexedDB.open('fitbuddy_reminder_db', 1);
  dbReq.onerror = function() {};
  dbReq.onupgradeneeded = function(e) {
    try { e.target.result.createObjectStore('settings', { keyPath: 'key' }); } catch(ex) {}
  };
  dbReq.onsuccess = function(e) {
    try {
      var tx = e.target.result.transaction('settings', 'readonly');
      var store = tx.objectStore('settings');
      var getReq = store.get('scene');
      getReq.onsuccess = function() {
        var scene = getReq.result;
        if (!scene) return; // 无场景数据（未生成过计划）
        var now = new Date();
        var pad = function(n){ return String(n).padStart(2, '0'); };
        var today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());

        // 场景1: 连续3天未打卡 → 挽留
        if (scene.hasPlan && scene.lastCheckin) {
          var gap = Math.floor((new Date(today) - new Date(scene.lastCheckin)) / 86400000);
          if (gap >= 3) {
            var tag1 = 'fitbuddy-scene-retention';
            self.registration.getNotifications({ tag: tag1 }).then(function(list) {
              if (!list.length) {
                var msg = gap >= 7
                  ? '已经 ' + gap + ' 天没训练了，你的肌肉在等你回来！'
                  : '连续 ' + gap + ' 天没打卡啦，休息够了就回来撸铁吧 💪';
                self.registration.showNotification('FitBuddy - 想你了！', {
                  body: msg, icon: makeDataUri(), tag: tag1,
                  requireInteraction: false, vibrate: [200, 100, 200], data: { url: './' }
                });
              }
            });
          }
        }

        // 场景2: 周日 → 提醒生成下周计划
        if (scene.hasPlan && now.getDay() === 0) {
          var tag2 = 'fitbuddy-scene-sunday';
          self.registration.getNotifications({ tag: tag2 }).then(function(list) {
            if (!list.length) {
              self.registration.showNotification('FitBuddy - 新周计划', {
                body: '新的一周开始啦！来 FitBuddy 规划下周训练 📅',
                icon: makeDataUri(), tag: tag2,
                requireInteraction: false, vibrate: [200, 100, 200], data: { url: './' }
              });
            }
          });
        }
      };
    } catch(ex) {}
  };
}

// ============ 客户端消息：让主线程发送通知 ============
self.addEventListener('message', function(e) {
  var d = e.data;
  if (!d || !d.type) return;

  switch (d.type) {
    // 主线程通知 SW 发送系统通知
    case 'SHOW_NOTIFICATION':
      self.registration.showNotification(d.title || 'FitBuddy - 该训练啦！', {
        body: d.body || '今天还有训练等着你！',
        icon: d.icon || makeDataUri(),
        tag: d.tag || 'fitbuddy-reminder',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: { url: d.url || './' }
      });
      break;

    // 主线程同步提醒设置到 IndexedDB（让 SW 也能读取）
    case 'SYNC_REMINDER_SETTINGS':
      saveReminderToIDB(d.settings);
      break;
  }
});

// 保存提醒设置到 IndexedDB（SW 可读）
function saveReminderToIDB(settings) {
  var dbReq = indexedDB.open('fitbuddy_reminder_db', 1);
  dbReq.onerror = function() {};
  dbReq.onupgradeneeded = function(e) {
    try {
      e.target.result.createObjectStore('settings', { keyPath: 'key' });
    } catch(ex) {}
  };
  dbReq.onsuccess = function(e) {
    try {
      var tx = e.target.result.transaction('settings', 'readwrite');
      var store = tx.objectStore('settings');
      store.put({ key: 'reminder', enabled: settings.enabled, time: settings.time });
    } catch(ex) {}
  };
}

// 生成 SVG Data URI（用于通知图标）
function makeDataUri() {
  return 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
    '<rect width="100" height="100" rx="22" fill="#FF6B35"/>' +
    '<text y=".9em" font-size="60" text-anchor="middle" x="50" fill="white">🏋️</text>' +
    '</svg>'
  );
}

// ============ 点击通知：打开 App ============
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // 优先聚焦已打开的窗口
      for (var i = 0; i < clientList.length; i++) {
        if (clientList[i].url.indexOf('index.html') >= 0) {
          clientList[i].focus();
          clientList[i].postMessage({ type: 'NOTIFICATION_CLICKED' });
          return;
        }
      }
      // 没有窗口就新建
      if (self.clients.openWindow) {
        self.clients.openWindow('./').then(function(client) {
          if (client) client.postMessage({ type: 'NOTIFICATION_CLICKED' });
        });
      }
    })
  );
});

// ============ 预缓存：扫描并缓存 exercise-gifs 目录 ============
// 注意：由于无法直接读取目录，我们采用"按需缓存"策略
// 当 GIF 被首次请求时自动缓存，由 LRU 机制控制上限
