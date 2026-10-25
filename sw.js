/* TO IN ONE — 오프라인 저장
   - 앱 화면(index.html 등)은 저장해 둔 것을 바로 보여주고, 뒤에서 새 버전을 받아 두었다가 "새 버전이 있어요"로 알린다
   - 글꼴은 한 번 받으면 저장해 두고 쓴다
   - Firebase·구글 로그인·지도 등 데이터 요청은 저장하지 않고 그대로 보낸다 */
const APP = 'toinone-app-v2', FONTS = 'toinone-fonts-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png', './bg-default.jpg'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== APP && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* 화면(index.html)을 새로 받아 저장하고, 보여 준 것과 내용이 다르면 열린 창에 "새 버전" 알림을 보낸다 */
const PAGE = './index.html';
async function pageCheck(c, old) {
  try {
    const r = await fetch(PAGE, { cache: 'no-store' }); if (!r || !r.ok) return;
    const nt = await r.clone().text(); await c.put(PAGE, r);
    if (!old || nt === await old.text()) return;
    (await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).forEach(w => w.postMessage('toinone-new'));
  } catch (x) {}
}
self.addEventListener('message', e => {
  if (e.data === 'toinone-check') e.waitUntil(caches.open(APP).then(async c => pageCheck(c, await c.match(PAGE))));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    const isPage = req.mode === 'navigate';
    e.respondWith(caches.open(APP).then(async c => {
      if (isPage) {
        const hit = await c.match(PAGE, { ignoreSearch: true });
        if (hit) { e.waitUntil(pageCheck(c, hit.clone())); return hit; }
      } else {
        const hit = await c.match(req);
        if (hit) { e.waitUntil(fetch(req).then(r => { if (r && r.ok) return c.put(req, r); }).catch(() => {})); return hit; }
      }
      const r = await fetch(req).catch(() => null);
      if (r && r.ok) await c.put(isPage ? PAGE : req, r.clone());
      return r || new Response('오프라인이에요. 인터넷에 연결한 뒤 다시 열어 주세요.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
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
