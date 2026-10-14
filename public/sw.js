// Saddle Point service worker: makes the installed app open offline.
// - Pages: network first, falling back to the cached app shell when offline.
// - /assets/*: cache first (file names carry content hashes, so a cached copy is never stale).
// - Google Fonts: stale-while-revalidate.
// - Never touched: /api/* (grading proxy), api.anthropic.com, and the scoring model from Hugging Face
//   (transformers.js caches the model itself).
// Bump VERSION to drop old caches after a change to this file.
const VERSION = 'v1'
const SHELL = `sp-shell-${VERSION}`
const ASSETS = `sp-assets-${VERSION}`
const FONTS = `sp-fonts-${VERSION}`
const SHELL_FILES = ['/', '/manifest.webmanifest', '/favicon.svg', '/favicon-32.png', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('sp-') && ![SHELL, ASSETS, FONTS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api/')) return
    if (req.mode === 'navigate') {
      event.respondWith(
        fetch(req)
          .then((res) => { const copy = res.clone(); caches.open(SHELL).then((c) => c.put('/', copy)); return res })
          .catch(() => caches.match('/', { cacheName: SHELL })),
      )
      return
    }
    if (url.pathname.startsWith('/assets/')) {
      event.respondWith(
        caches.open(ASSETS).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res }))),
      )
      return
    }
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req)))
    return
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONTS).then((c) => c.match(req).then((hit) => {
        const net = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res }).catch(() => hit)
        return hit || net
      })),
    )
  }
})
