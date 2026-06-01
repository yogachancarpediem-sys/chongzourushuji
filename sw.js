/**
 * Service Worker — 离线缓存策略
 * 首次访问后缓存核心资源，重复访问零等待
 */

var CACHE_NAME = 'rushu-v1';

/* 静态资源使用相对路径，适配任何部署根 */
var STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/data.js',
  './js/tts.js',
  './js/shader-bg.js',
  './js/sfx.js',
  './js/ambient.js',
  './js/idle-events.js',
  './js/device.js'
];

/* Install: 预缓存核心静态资源 */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS).catch(function(err) {
        /* 个别资源加载失败不阻塞安装 */
        console.warn('[SW] pre-cache partial failure:', err);
      });
    })
  );
  self.skipWaiting();
});

/* Activate: 清理旧版本缓存 */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

/* Fetch: 缓存策略分发 */
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  /* 跳过非 GET 请求 */
  if (event.request.method !== 'GET') return;

  /* 只处理同源请求 */
  if (url.origin !== self.location.origin) return;

  /* 跳过 Google Fonts（已有 CDN） */
  if (url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com' ||
      url.hostname === 'fonts.loli.net') return;

  /* HTML: Network First */
  if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  /* JS/CSS: Cache First（版本号做 cache busting） */
  if (url.pathname.match(/\.(js|css)(\?|$)/)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  /* 媒体资源（图片/音频/视频）: Cache First */
  if (url.pathname.match(/\.(webp|mp3|mp4|png|jpg|svg|ico)(\?|$)/)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  /* 字体: Cache First */
  if (url.pathname.match(/\.(woff2?|ttf|eot)(\?|$)/)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
});

/* Cache First 策略 */
function cacheFirst(request) {
  return caches.match(request).then(function(cached) {
    if (cached) return cached;
    return fetch(request).then(function(response) {
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      var clone = response.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(request, clone);
      });
      return response;
    }).catch(function() {
      /* 离线时返回已缓存的资源 */
      return caches.match(request);
    });
  });
}

/* Network First 策略 */
function networkFirst(request) {
  return fetch(request).then(function(response) {
    var clone = response.clone();
    caches.open(CACHE_NAME).then(function(cache) {
      cache.put(request, clone);
    });
    return response;
  }).catch(function() {
    return caches.match(request);
  });
}
