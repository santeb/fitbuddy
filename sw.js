// FitBuddy Service Worker v3.0 — 完整离线缓存 + 后台提醒
var CACHE_STATIC = 'fitbuddy-static-v3';
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

  // 静态资源（JS/CSS/HTML/JSON）：缓存优先
  if (isLocal && (/\.(js|css|html|json|webmanifest)(\?|$)/i.test(url) ||
                  url === './' || url === '/' || url.endsWith(location.pathname))) {
    e.respondWith(cacheFirst(e.request, CACHE_STATIC));
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
function cacheFirst(request, cacheName) {
  return caches.match(request).then(function(cached) {
    if (cached) return cached;
    return fetch(request).then(function(response) {
      if (response && response.status === 200) {
        caches.open(cacheName).then(function(cache) { cache.put(request, response.clone()); });
      }
      return response;
    }).catch(function() {
      // 网络失败 → 返回离线兜底
      return caches.match('./index.html');
    });
  });
}

// Network-First：先网络，失败用缓存
function networkFirst(request, cacheName) {
  return fetch(request).catch(function() {
    return caches.match(request);
  }).then(function(response) {
    if (response && response.status === 200 && !response.fromCache) {
      caches.open(cacheName).then(function(cache) { cache.put(request, response.clone()); });
    }
    return response || caches.match('./index.html');
  });
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
