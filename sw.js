// FitBuddy Service Worker v1.0
var CACHE = 'fitbuddy-v1';
var ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 安装
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// 请求拦截：缓存优先，网络兜底
self.addEventListener('fetch', function(e) {
  // 跳过 chrome-extension 和非 GET 请求
  if (e.request.method !== 'GET') return;
  if (e.request.url.indexOf('chrome-extension://') === 0) return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        // 只缓存同源成功的 HTML/JS/CSS
        if (response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function() {
        // 离线时返回缓存的 index.html（SPA fallback）
        return caches.match('./index.html');
      });
    })
  );
});
