/* TO IN ONE — 오프라인 저장
   - 앱 화면(index.html 등)은 저장해 둔 것을 바로 보여주고, 뒤에서 새 버전을 받아 다음에 열 때 바꾼다
   - 글꼴은 한 번 받으면 저장해 두고 쓴다
   - Firebase·구글 로그인·지도 등 데이터 요청은 저장하지 않고 그대로 보낸다 */
const APP = 'toinone-app-v1', FONTS = 'toinone-fonts-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== APP && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    const isPage = req.mode === 'navigate';
    const key = isPage ? './index.html' : req;
    e.respondWith(caches.open(APP).then(async c => {
      const hit = await c.match(key, { ignoreSearch: isPage });
      const net = fetch(req).then(r => { if (r && r.ok) c.put(key, r.clone()); return r; }).catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      const r = await net; return r || new Response('오프라인이에요. 인터넷에 연결한 뒤 다시 열어 주세요.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }));
    return;
  }
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try { const r = await fetch(req); if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }
      catch (x) { return Response.error(); }
    }));
  }
});
