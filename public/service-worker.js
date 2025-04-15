const CACHE_NAME = 'gate-tracker-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/assets/index.css',
  '/favicon.ico',
  '/favicons/apple-touch-icon.png',
  '/favicons/favicon-32x32.png',
  '/favicons/favicon-16x16.png'
];

// Install a service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response - one to return, one to cache
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});

// Update a service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  let notificationData = {};
  
  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: 'Lecture Reminder',
      body: 'You have a scheduled lecture now!'
    };
  }
  
  const options = {
    body: notificationData.body || 'Time for your scheduled lecture!',
    icon: '/favicons/apple-touch-icon.png',
    badge: '/favicons/favicon-32x32.png',
    vibrate: [100, 50, 100],
    data: {
      url: notificationData.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title || 'Lecture Reminder', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        const url = event.notification.data.url;
        
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Periodic sync for background notifications (if supported)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-lectures') {
    event.waitUntil(checkScheduledLectures());
  }
});

// Function to check for scheduled lectures
async function checkScheduledLectures() {
  try {
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
    // Ideally we would fetch this data from the server or IndexedDB
    // But for simplicity, we'll use a message to the client to check localStorage
    const allClients = await clients.matchAll({ type: 'window' });
    
    if (allClients.length > 0) {
      // Ask the client to check for lectures
      allClients[0].postMessage({
        type: 'CHECK_LECTURES',
        currentTime: currentTimeStr,
        currentDate: currentDateStr
      });
    }
  } catch (error) {
    console.error('Error checking lectures:', error);
  }
}

// Listen for messages from the client
self.addEventListener('message', event => {
  const data = event.data;
  
  if (data.type === 'SCHEDULE_NOTIFICATION') {
    const { id, title, time, date } = data;
    const scheduledTime = new Date(`${date}T${time}`);
    const now = new Date();
    
    // Calculate delay until notification (in milliseconds)
    const delay = scheduledTime.getTime() - now.getTime();
    
    if (delay > 0) {
      setTimeout(() => {
        self.registration.showNotification('Lecture Reminder', {
          body: `Your lecture "${title}" is starting now!`,
          icon: '/favicons/apple-touch-icon.png',
          badge: '/favicons/favicon-32x32.png',
          vibrate: [100, 50, 100],
          data: {
            url: `/subject/${data.subjectId}/lectures`
          }
        });
      }, delay);
    }
  }
}); 