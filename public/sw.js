// Service Worker for Peymen - Background Sync & Notifications
const CACHE_NAME = 'peymen-v1';
const SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Periodic Background Sync
let syncInterval = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'START_SYNC') {
    const interval = event.data.interval || SYNC_INTERVAL;
    startPeriodicSync(interval);
  } else if (event.data && event.data.type === 'STOP_SYNC') {
    stopPeriodicSync();
  } else if (event.data && event.data.type === 'CHECK_NOW') {
    checkForNewTransactions();
  }
});

function startPeriodicSync(interval) {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  console.log('[SW] Starting periodic sync with interval:', interval);
  syncInterval = setInterval(() => {
    checkForNewTransactions();
  }, interval);
  
  // Check immediately
  checkForNewTransactions();
}

function stopPeriodicSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('[SW] Stopped periodic sync');
  }
}

async function checkForNewTransactions() {
  try {
    console.log('[SW] Checking for new transactions...');
    
    // Get last known transaction count from storage
    const lastCount = await getLastTransactionCount();
    
    // Notify main app to check for new transactions
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach((client) => {
      client.postMessage({
        type: 'CHECK_TRANSACTIONS',
        lastCount: lastCount
      });
    });
  } catch (error) {
    console.error('[SW] Error checking transactions:', error);
  }
}

async function getLastTransactionCount() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('/last-count');
    if (response) {
      const data = await response.json();
      return data.count || 0;
    }
  } catch (error) {
    console.error('[SW] Error getting last count:', error);
  }
  return 0;
}

async function saveLastTransactionCount(count) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(JSON.stringify({ count }), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put('/last-count', response);
  } catch (error) {
    console.error('[SW] Error saving last count:', error);
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Push notification handler (for future use)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || data.message,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'peymen-notification',
      data: data.data || {},
      requireInteraction: false,
      silent: false
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Peymen', options)
    );
  }
});

// Background sync (when browser supports it)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(checkForNewTransactions());
  }
});

console.log('[SW] Service Worker loaded');
