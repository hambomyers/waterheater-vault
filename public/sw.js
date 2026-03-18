// Service Worker for offline functionality
const CACHE_NAME = 'warrantyfile-v2'

// Only cache static assets that never change between builds
// NEVER cache HTML pages — they reference build-specific JS/CSS hashes
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/192x192.png',
  '/icons/512x512.png'
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  )
})

self.addEventListener('fetch', (event) => {
  // Navigation requests (HTML pages): always go to network
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request))
    return
  }

  // Static assets: check cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((cached) => cached || fetch(event.request))
  )
})

self.addEventListener('activate', (event) => {
  self.clients.claim()
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
})
