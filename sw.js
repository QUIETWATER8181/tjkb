/* 课表提醒助手 Service Worker */
const CACHE_NAME = 'tjkb-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 安装：预缓存核心资源，立即激活
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 激活：清理旧版本缓存，接管所有客户端
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 拦截请求：网络优先、缓存兜底；云端 API 与第三方 CDN 永不缓存
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Supabase 云端数据与 supabase-js CDN：直连，不走缓存
  if (url.origin === 'https://egwuciyieaqvavhfpzbc.supabase.co') return;
  if (url.origin === 'https://cdn.jsdelivr.net') return;
  if (url.origin === 'https://unpkg.com') return;

  // 同源资源：网络优先，离线回退缓存
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() =>
          caches.match(e.request).then(r => r || caches.match('./index.html'))
        )
    );
  }
});
