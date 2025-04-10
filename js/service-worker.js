// Service Worker pour l'application Salat Times
// Ce service worker permet:
// 1. La mise en cache des ressources pour un fonctionnement hors ligne
// 2. La synchronisation en arrière-plan pour les notifications
// 3. Les notifications sur l'écran de verrouillage

// Nom et version du cache
const CACHE_NAME = 'salat-times-cache-v1';

// Ressources à mettre en cache lors de l'installation
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon.png'
];

// Événement d'installation du service worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Installation');
  
  // Mise en cache des ressources essentielles
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Mise en cache globale');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation terminée');
        return self.skipWaiting();
      })
  );
});

// Événement d'activation du service worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activation');
  
  // Suppression des anciens caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activation terminée');
      return self.clients.claim();
    })
  );
});

// Événement de récupération des ressources
self.addEventListener('fetch', event => {
  console.log('[Service Worker] Récupération:', event.request.url);
  
  // Stratégie de mise en cache: "Cache with Network Fallback"
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retour du cache si disponible
        if (response) {
          console.log('[Service Worker] Ressource trouvée dans le cache');
          return response;
        }
        
        console.log('[Service Worker] Ressource non trouvée dans le cache, récupération depuis le réseau');
        
        // Récupération depuis le réseau si non disponible dans le cache
        return fetch(event.request)
          .then(networkResponse => {
            // Vérification de la validité de la réponse
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              console.log('[Service Worker] Ressource non mise en cache (réponse non valide)');
              return networkResponse;
            }
            
            // Mise en cache de la ressource
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                console.log('[Service Worker] Mise en cache de la ressource:', event.request.url);
                cache.put(event.request, responseToCache);
              });
            
            return networkResponse;
          });
      })
      .catch(error => {
        console.log('[Service Worker] Erreur de récupération:', error);
        // Ici, on pourrait retourner une page d'erreur personnalisée
      })
  );
});

// Événement de synchronisation en arrière-plan
self.addEventListener('sync', event => {
  console.log('[Service Worker] Événement de synchronisation:', event.tag);
  
  if (event.tag === 'prayer-times-sync') {
    event.waitUntil(synchronizePrayerTimes());
  }
});

// Événement de synchronisation périodique en arrière-plan
self.addEventListener('periodicsync', event => {
  console.log('[Service Worker] Événement de synchronisation périodique:', event.tag);
  
  if (event.tag === 'prayer-times-sync') {
    event.waitUntil(synchronizePrayerTimes());
  }
});

// Fonction de synchronisation des horaires de prière
async function synchronizePrayerTimes() {
  console.log('[Service Worker] Synchronisation des horaires de prière');
  
  try {
    // Récupération des données stockées
    const storedData = await getStoredData();
    
    // Si aucune donnée n'est stockée, on ne peut pas synchroniser
    if (!storedData || !storedData.location) {
      throw new Error('Aucune donnée de localisation stockée');
    }
    
    // Récupération des horaires de prière depuis l'API
    const { latitude, longitude } = storedData.location;
    const prayerTimes = await fetchPrayerTimes(latitude, longitude);
    
    // Mise à jour des horaires de prière stockés
    await updateStoredPrayerTimes(prayerTimes);
    
    // Planification des notifications pour les prières
    schedulePrayerNotifications(prayerTimes);
    
    console.log('[Service Worker] Synchronisation terminée avec succès');
    return true;
    
  } catch (error) {
    console.error('[Service Worker] Erreur lors de la synchronisation:', error);
    return false;
  }
}

// Fonction pour récupérer les données stockées
async function getStoredData() {
  try {
    // Ouverture de la base de données IndexedDB
    const db = await openDatabase();
    
    // Récupération des données de localisation
    const transaction = db.transaction(['data'], 'readonly');
    const store = transaction.objectStore('data');
    
    return new Promise((resolve, reject) => {
      const request = store.get('user-data');
      
      request.onsuccess = event => {
        resolve(event.target.result);
      };
      
      request.onerror = event => {
        reject(new Error('Erreur lors de la récupération des données'));
      };
    });
    
  } catch (error) {
    console.error('[Service Worker] Erreur lors de la récupération des données stockées:', error);
    return null;
  }
}

// Fonction pour ouvrir la base de données IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SalatTimesDB', 1);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      db.createObjectStore('data', { keyPath: 'id' });
    };
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
    
    request.onerror = event => {
      reject(new Error('Erreur lors de l\'ouverture de la base de données'));
    };
  });
}

// Fonction pour mettre à jour les horaires de prière stockés
async function updateStoredPrayerTimes(prayerTimes) {
  try {
    // Ouverture de la base de données IndexedDB
    const db = await openDatabase();
    
    // Mise à jour des horaires de prière
    const transaction = db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    
    // Récupération des données actuelles
    const userData = await new Promise((resolve, reject) => {
      const request = store.get('user-data');
      
      request.onsuccess = event => {
        resolve(event.target.result || { id: 'user-data' });
      };
      
      request.onerror = event => {
        reject(new Error('Erreur lors de la récupération des données'));
      };
    });
    
    // Mise à jour des horaires de prière
    userData.prayerTimes = prayerTimes;
    userData.lastUpdated = new Date().toISOString();
    
    // Enregistrement des données mises à jour
    store.put(userData);
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        resolve(true);
      };
      
      transaction.onerror = () => {
        reject(new Error('Erreur lors de la mise à jour des horaires de prière'));
      };
    });
    
  } catch (error) {
    console.error('[Service Worker] Erreur lors de la mise à jour des horaires de prière:', error);
    return false;
  }
}

// Fonction pour récupérer les horaires de prière depuis l'API
async function fetchPrayerTimes(latitude, longitude) {
  console.log(`[Service Worker] Récupération des horaires de prière pour Lat: ${latitude}, Long: ${longitude}`);
  
  try {
    // Date actuelle
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
              // const apiUrl = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=2`;
                    // Par:
                    const apiUrl = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=${currentCalculationMethod}`;
                
    // Requête à l'API Aladhan
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.code === 200 && data.data) {
      // Récupération du jour actuel
      const day = today.getDate() - 1; // L'API utilise un index commençant à 0
      
      // Extraction des horaires de prière pour aujourd'hui
      const timings = data.data[day].timings;
      
      // Formater les horaires de prière (suppression des suffixes comme "+05:00")
      return {
        fajr: timings.Fajr.split(' ')[0],
        sunrise: timings.Sunrise.split(' ')[0],
        dhuhr: timings.Dhuhr.split(' ')[0],
        asr: timings.Asr.split(' ')[0],
        maghrib: timings.Maghrib.split(' ')[0],
        isha: timings.Isha.split(' ')[0],
        date: data.data[day].date
      };
    } else {
      throw new Error('Impossible de récupérer les horaires de prière');
    }
    
  } catch (error) {
    console.error('[Service Worker] Erreur lors de la récupération des horaires de prière:', error);
    throw error;
  }
}

// Fonction pour planifier les notifications pour les prières
function schedulePrayerNotifications(prayerTimes) {
  console.log('[Service Worker] Planification des notifications pour les prières');
  
  try {
    // Noms des prières
    const prayerNames = {
      fajr: { fr: "Fajr", ar: "الفجر", icon: "☀️" },
      sunrise: { fr: "Lever du soleil", ar: "الشروق", icon: "🌅" },
      dhuhr: { fr: "Dhuhr", ar: "الظهر", icon: "☀️" },
      asr: { fr: "Asr", ar: "العصر", icon: "🌤️" },
      maghrib: { fr: "Maghrib", ar: "المغرب", icon: "🌆" },
      isha: { fr: "Isha", ar: "العشاء", icon: "🌙" }
    };
    
    // Date actuelle
    const now = new Date();
    
    // Planification des notifications pour chaque prière
    for (const [prayer, time] of Object.entries(prayerTimes)) {
      // Si la prière n'est pas une date, c'est un horaire de prière
      if (prayer !== 'date') {
        // Création d'une date pour la prière
        const prayerDate = new Date();
        const [hours, minutes] = time.split(':').map(Number);
        prayerDate.setHours(hours, minutes, 0, 0);
        
        // Si la prière est déjà passée aujourd'hui, passer à demain
        if (prayerDate < now) {
          prayerDate.setDate(prayerDate.getDate() + 1);
        }
        
        // Temps restant en millisecondes
        const timeUntilPrayer = prayerDate.getTime() - now.getTime();
        
        // Planification de la notification (si le temps restant est inférieur à 24h)
        if (timeUntilPrayer > 0 && timeUntilPrayer < 24 * 60 * 60 * 1000) {
          const prayerInfo = prayerNames[prayer] || { fr: prayer, ar: prayer, icon: "🕋" };
          
          // Planification de la notification avec l'API setTimeout
          setTimeout(() => {
            // Envoi de la notification
            self.registration.showNotification('Salat Times', {
              body: `C'est l'heure de la prière ${prayerInfo.fr} (${prayerInfo.ar})`,
              icon: '/icons/icon-192x192.png',
              vibrate: [200, 100, 200],
              tag: `prayer-${prayer}`,
              requireInteraction: true,
              silent: false,
              actions: [
                {
                  action: 'open',
                  title: 'Ouvrir l\'application'
                },
                {
                  action: 'dismiss',
                  title: 'Ignorer'
                }
              ]
            });
          }, timeUntilPrayer);
          
          console.log(`[Service Worker] Notification planifiée pour ${prayer} dans ${Math.round(timeUntilPrayer / 60000)} minutes`);
        }
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('[Service Worker] Erreur lors de la planification des notifications:', error);
    return false;
  }
}

// Événement de clic sur une notification
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Clic sur une notification:', event.notification.tag);
  
  // Fermeture de la notification
  event.notification.close();
  
  // Gestion des actions
  if (event.action === 'open') {
    // Ouverture de l'application
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(clientList => {
          // Si une fenêtre de l'application est déjà ouverte, la focaliser
          for (const client of clientList) {
            if (client.url.includes('/index.html') && 'focus' in client) {
              return client.focus();
            }
          }
          // Sinon, ouvrir une nouvelle fenêtre
          return clients.openWindow('/');
        })
    );
  }
});

// Événement de réception d'un push
self.addEventListener('push', event => {
  console.log('[Service Worker] Notification push reçue');
  
  let notificationData = {
    title: 'Salat Times',
    body: 'Nouvel horaire de prière disponible',
    icon: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'prayer-update',
    requireInteraction: true,
    data: {}
  };
  
  // Si des données sont fournies dans la notification
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('[Service Worker] Erreur lors du parse des données de notification:', error);
    }
  }
  
  // Affichage de la notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});