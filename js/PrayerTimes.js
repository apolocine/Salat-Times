
        // Déclaration des variables globales
        let prayerTimes = {}; // Stocke les horaires de prière
        let currentLocation = {}; // Stocke les informations de localisation
        let deferredPrompt; // Pour l'installation de l'application
        let nextPrayerTime = ''; // Stocke la prochaine prière
        let refreshInterval; // Pour l'actualisation automatique de l'heure
        
        // Constantes pour les noms des prières en français et en arabe
        const PRAYER_NAMES = {
            fajr: { fr: "Fajr", ar: "الفجر", icon: "☀️" },
            sunrise: { fr: "Lever du soleil", ar: "الشروق", icon: "🌅" },
            dhuhr: { fr: "Dhuhr", ar: "الظهر", icon: "☀️" },
            asr: { fr: "Asr", ar: "العصر", icon: "🌤️" },
            maghrib: { fr: "Maghrib", ar: "المغرب", icon: "🌆" },
            isha: { fr: "Isha", ar: "العشاء", icon: "🌙" }
        };
        
        // Au chargement du document
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Application chargée - Démarrage des initialisations');
            
            // Initialisation de l'application
            initApp();
            
            // Gestion des événements des boutons
            document.getElementById('refresh-button').addEventListener('click', refreshData);
            document.getElementById('add-to-lockscreen').addEventListener('click', addToLockscreen);
            document.getElementById('share-button').addEventListener('click', sharePrayerTimes);
            document.getElementById('settings-button').addEventListener('click', openSettings);
            document.getElementById('install-button').addEventListener('click', installApp);
        });
        
        /**
         * Affiche un message d'erreur à l'utilisateur
         * @param {string} message - Message d'erreur à afficher
         */
      /*  function displayError(message) {
            console.error(`ERREUR: ${message}`);
            const errorElement = document.getElementById('error-message');
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Masquage du loader si visible
            const loader = document.getElementById('prayer-times-loader'); if (loader) loader.style.display = 'none';
        }
		
		*/
		
			function displayError(message) {
				console.error(`ERREUR: ${message}`);
				const errorElement = document.getElementById('error-message');
				if (errorElement) {
					errorElement.textContent = message;
					errorElement.style.display = 'block';
				}

				// Sécuriser la ligne suivante :
				const loader = document.getElementById('prayer-times-loader');
				if (loader) {
					loader.style.display = 'none';
				}
			}


        
        /**
         * Ajoute les horaires de prière à l'écran de verrouillage
         * via l'API Web Periodic Background Sync
         */
        async function addToLockscreen() {
            console.log('Tentative d\'ajout à l\'écran de verrouillage');
            
            try {
                // Vérification de la prise en charge de l'API Notifications
                if (!('Notification' in window)) {
                    throw new Error('Les notifications ne sont pas prises en charge par ce navigateur');
                }
                
                // Demande d'autorisation pour les notifications si nécessaire
                if (Notification.permission !== 'granted') {
                    const permission = await Notification.requestPermission();
                    if (permission !== 'granted') {
                        throw new Error('L\'autorisation de notification est requise');
                    }
                }
                
                // Vérification de la prise en charge de l'API Background Sync
                if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
                    // Solution de secours pour les navigateurs sans support de Background Sync
                    // Planifier les notifications pour la prochaine prière uniquement
                    if (nextPrayerTime) {
                        scheduleNextPrayerNotification(nextPrayerTime);
                        alert('Notification programmée pour la prochaine prière');
                    }
                    return;
                }
                
                // Enregistrement du Background Sync pour mettre à jour les notifications périodiquement
                const registration = await navigator.serviceWorker.ready;
                await registration.periodicSync.register('prayer-times-sync', {
                    minInterval: 60 * 60 * 1000, // 1 heure en millisecondes
                });
                
                alert('Les horaires de prière seront affichés sur votre écran de verrouillage');
                
            } catch (error) {
                console.error('Erreur lors de l\'ajout à l\'écran de verrouillage:', error);
                alert(`Impossible d'ajouter à l'écran de verrouillage: ${error.message}`);
            }
        }
        
        /**
         * Planifie une notification pour la prochaine prière
         * @param {Object} prayerTime - Informations sur la prochaine prière
         */
        function scheduleNextPrayerNotification(prayerTime) {
            console.log(`Planification de notification pour ${prayerTime.name} à ${prayerTime.time}`);
            
            // Création d'une date pour la prière
            const prayerDate = new Date();
            const [hours, minutes] = prayerTime.time.split(':').map(Number);
            prayerDate.setHours(hours, minutes, 0, 0);
            
            // Si la prière est déjà passée aujourd'hui, passer à demain
            if (prayerDate < new Date()) {
                prayerDate.setDate(prayerDate.getDate() + 1);
            }
            
            // Temps restant en millisecondes
            const timeUntilPrayer = prayerDate.getTime() - new Date().getTime();
            
            // Planification de la notification
            setTimeout(() => {
                const prayerInfo = PRAYER_NAMES[prayerTime.name] || { fr: prayerTime.name, ar: prayerTime.name, icon: "🕋" };
                
                // Envoi de la notification
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification('Salat Times', {
                        body: `C'est l'heure de la prière ${prayerInfo.fr} (${prayerInfo.ar})`,
                        icon: '/icons/icon-192x192.png',
                        vibrate: [200, 100, 200],
                        tag: 'prayer-notification',
                        requireInteraction: true,
                        silent: false
                    });
                    
                    // Planifier la notification pour la prochaine prière après celle-ci
                    const prayerTimesArray = Object.entries(prayerTimes).map(([key, value]) => ({
                        name: key,
                        time: value
                    }));
                    
                    const nextPrayer = getNextPrayer(prayerTimesArray, prayerTime.time);
                    scheduleNextPrayerNotification(nextPrayer);
                });
            }, timeUntilPrayer);
        }
        
        /**
         * Partage les horaires de prière via l'API Web Share
         */
        async function sharePrayerTimes() {
            console.log('Partage des horaires de prière');
            
            try {
                // Vérification de la prise en charge de l'API Web Share
                if (!navigator.share) {
                    throw new Error('L\'API Web Share n\'est pas prise en charge par ce navigateur');
                }
                
                // Génération du texte à partager
                let shareText = `📆 Horaires de prière pour ${currentLocation.name}, ${currentLocation.country}\n\n`;
                
                // Ajout des horaires de prière
                for (const [prayer, time] of Object.entries(prayerTimes)) {
                    const prayerInfo = PRAYER_NAMES[prayer] || { fr: prayer, ar: prayer, icon: "🕋" };
                    shareText += `${prayerInfo.icon} ${prayerInfo.fr} (${prayerInfo.ar}): ${time}\n`;
                }
                
                // Ajout d'un lien vers l'application
                shareText += `\nPartagé depuis l'application Salat Times`;
                
                // Partage du texte
                await navigator.share({
                    title: 'Horaires de prière',
                    text: shareText,
                    url: window.location.href
                });
                
                console.log('Horaires de prière partagés avec succès');
                
            } catch (error) {
                console.error('Erreur lors du partage des horaires de prière:', error);
                alert(`Impossible de partager: ${error.message}`);
            }
        }
        
        /**
         * Ouvre les paramètres de l'application
         */
        function openSettings() {
            console.log('Ouverture des paramètres');
            alert('Les paramètres de l\'application seront disponibles dans une prochaine version');
        }
        
        /**
         * Installe l'application sur l'appareil de l'utilisateur
         */
        async function installApp() {
            console.log('Installation de l\'application');
            
            if (!deferredPrompt) {
                alert('Cette application est déjà installée ou n\'est pas compatible avec votre navigateur');
                return;
            }
            
            // Affichage de l'invite d'installation
            deferredPrompt.prompt();
            
            // Attente de la réponse de l'utilisateur
            const choiceResult = await deferredPrompt.userChoice;
            
            // Réinitialisation de l'invite
            deferredPrompt = null;
            
            // Masquage du bouton d'installation
            document.getElementById('install-button').style.display = 'none';
            
            console.log('Résultat de l\'installation:', choiceResult.outcome);
        }
        
        /**
         * Initialise l'application
         * - Vérifie la compatibilité du navigateur
         * - Enregistre le service worker pour le PWA
         * - Récupère la position et les horaires de prière
         */
        async function initApp() {
            console.log('Initialisation de l\'application');
            
            // Affichage de l'heure et de la date actuelle
            updateCurrentTimeAndDate();
            // Mise à jour de l'heure toutes les secondes
            refreshInterval = setInterval(updateCurrentTimeAndDate, 1000);
            
            // Enregistrement du service worker
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register('js/service-worker.js');
                    console.log('Service Worker enregistré avec succès:', registration.scope);
                } catch (error) {
                    console.error('Échec de l\'enregistrement du Service Worker:', error);
                }
            }
            
            // Gestion de l'installation de l'application
            window.addEventListener('beforeinstallprompt', (e) => {
                // Empêche l'apparition automatique de la bannière d'installation
                e.preventDefault();
                // Stocke l'événement pour l'utiliser plus tard
                deferredPrompt = e;
                // Affiche le bouton d'installation
                document.getElementById('install-button').style.display = 'block';
            });
            
            // Obtention de la position et des horaires de prière
            await getLocationAndPrayerTimes();
        }
        
        /**
         * Récupère la position de l'utilisateur et les horaires de prière
         */
        async function getLocationAndPrayerTimes() {
            console.log('Tentative d\'obtention de la position de l\'utilisateur');
            
            try {
                // Vérification de la prise en charge de la géolocalisation
                if (!navigator.geolocation) {
                    throw new Error('La géolocalisation n\'est pas prise en charge par votre navigateur');
                }
                
                // Obtention de la position de l'utilisateur
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    });
                });
                
                // Extraction des coordonnées
                const { latitude, longitude } = position.coords;
                console.log(`Position obtenue: Lat: ${latitude}, Long: ${longitude}`);
                
                // Mise à jour des informations de localisation
                document.getElementById('location-coordinates').textContent = `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`;
                
                // Récupération du nom de la localité
                await getLocationName(latitude, longitude);
                
                // Récupération des horaires de prière
                await fetchPrayerTimes(latitude, longitude);
                
            } catch (error) {
                console.error('Erreur lors de l\'obtention de la position:', error);
                displayError(`Erreur de géolocalisation: ${error.message}`);
            }
        }
        
        /**
         * Récupère le nom de la localité à partir des coordonnées GPS
         * @param {number} latitude - Latitude
         * @param {number} longitude - Longitude
         */
        async function getLocationName(latitude, longitude) {
            console.log('Récupération du nom de la localité');
            try {
                // Utilisation de l'API de géocodage inverse pour obtenir le nom de la localité
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                const data = await response.json();
                
                console.log('Données de localisation:', data);
                
                // Extraction du nom de la ville, de la région et du pays
                const city = data.address.city || data.address.town || data.address.village || data.address.hamlet || 'Inconnu';
                const country = data.address.country || '';
                
                // Mise à jour des informations de localisation
                currentLocation = {
                    name: city,
                    country: country,
                    latitude: latitude,
                    longitude: longitude
                };
                
                // Affichage du nom de la localité
                document.getElementById('location-name').textContent = `${city}, ${country}`;
                
            } catch (error) {
                console.error('Erreur lors de la récupération du nom de la localité:', error);
                document.getElementById('location-name').textContent = 'Localité inconnue';
            }
        }
        
        /**
         * Rafraîchit les données de localisation et les horaires de prière
         */
        async function refreshData() {
            console.log('Rafraîchissement des données');
            
            // Animation du bouton de rafraîchissement
            const refreshButton = document.getElementById('refresh-button');
            refreshButton.style.transform = 'rotate(360deg)';
            refreshButton.style.transition = 'transform 1s';
            
            // Réinitialisation de l'animation après 1 seconde
            setTimeout(() => {
                refreshButton.style.transform = 'rotate(0deg)';
                refreshButton.style.transition = 'none';
            }, 1000);
            
            // Effacement de tout message d'erreur
            document.getElementById('error-message').style.display = 'none';
            
            // Récupération de la position et des horaires de prière
            await getLocationAndPrayerTimes();
        }
        
        /**
         * Récupère les horaires de prière à partir des coordonnées GPS
         * @param {number} latitude - Latitude
         * @param {number} longitude - Longitude
         */
        async function fetchPrayerTimes(latitude, longitude) {
            console.log('Récupération des horaires de prière');
            
            try {
                // Affichage du loader
                const loader = document.getElementById('prayer-times-loader'); if (loader) loader.style.display = 'flex';
                
                // Date actuelle
                const today = new Date();
                const month = today.getMonth() + 1;
                const year = today.getFullYear();
                console.log(`Date actuelle: ${today.toLocaleDateString()}`);
                console.log(`Mois: ${month}, Année: ${year}`);
                console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
                // Vérification de la prise en charge de l'API Fetch
                if (!window.fetch) {
                    throw new Error('L\'API Fetch n\'est pas prise en charge par ce navigateur');
                }   

                // const apiUrl = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=2`;
                    // Par:
                const apiUrl = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=${currentCalculationMethod}`;
                    
                // Utilisation de l'API Aladhan pour obtenir les horaires de prière
                const response = await fetch(apiUrl);
                const data = await response.json();
                
                console.log('Données des horaires de prière:', data);
                
                if (data.code === 200 && data.data) {
                    // Récupération du jour actuel
                    const day = today.getDate() - 1; // L'API utilise un index commençant à 0
                    
                    // Extraction des horaires de prière pour aujourd'hui
                    const timings = data.data[day].timings;
                    
                    // Extraction de la date hijri
                    const hijriDate = data.data[day].date.hijri;
                    const hijriDateFormatted = `${hijriDate.day} ${hijriDate.month.ar} ${hijriDate.year}`;
                    
                    // Mise à jour de la date hijri
                    document.getElementById('date-hijri').textContent = hijriDateFormatted;
                    
                    // Formater les horaires de prière (suppression des suffixes comme "+05:00")
                    prayerTimes = {
                        fajr: timings.Fajr.split(' ')[0],
                        sunrise: timings.Sunrise.split(' ')[0],
                        dhuhr: timings.Dhuhr.split(' ')[0],
                        asr: timings.Asr.split(' ')[0],
                        maghrib: timings.Maghrib.split(' ')[0],
                        isha: timings.Isha.split(' ')[0]
                    };
                    
                    console.log('Horaires de prière pour aujourd\'hui:', prayerTimes);
                    
                    // Affichage des horaires de prière
                    displayPrayerTimes(prayerTimes);
					updateNextPrayerInfo();
					setInterval(updateNextPrayerInfo, 60000);
                } else {
                    throw new Error('Impossible de récupérer les horaires de prière');
                }
                
            } catch (error) {
                console.error('Erreur lors de la récupération des horaires de prière:', error);
                displayError(`Erreur: ${error.message}`);
            } finally {
                // Masquage du loader
                const loader = document.getElementById('prayer-times-loader'); if (loader) loader.style.display = 'none';
            }
        }
        
        /**
         * Met à jour l'heure et la date actuelles dans l'interface
         */
        function updateCurrentTimeAndDate() {
            const now = new Date();
            
            // Format de l'heure (HH:MM:SS)
            const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
            const timeString = now.toLocaleTimeString('fr-FR', timeOptions);
            
            // Format de la date (jour de la semaine, jour mois année)
            const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const dateString = now.toLocaleDateString('fr-FR', dateOptions);
            
            // Mise à jour de l'interface
            document.getElementById('current-time').textContent = timeString;
            document.getElementById('current-date').textContent = dateString;
            
            // Si les horaires de prière sont disponibles, mettre à jour l'affichage
            // pour indiquer la prochaine prière (toutes les minutes)
            if (Object.keys(prayerTimes).length > 0 && now.getSeconds() === 0) {
                const currentTimeString = timeString.substring(0, 5);
                displayPrayerTimes(prayerTimes);
            }
        }
        
        /**
         * Affiche les horaires de prière dans l'interface
         * @param {Object} prayerTimes - Les horaires de prière
         */
        function displayPrayerTimes(prayerTimes) {
            console.log('Affichage des horaires de prière dans l\'interface');
            
            // Récupération du conteneur des horaires de prière
            const container = document.getElementById('prayer-times-container');
            
            // Suppression du contenu existant
            container.innerHTML = '';
            
            // Conversion de l'objet en tableau pour faciliter le traitement
            const prayerTimesArray = Object.entries(prayerTimes).map(([key, value]) => ({
                name: key,
                time: value
            }));
            
            // Récupération de l'heure actuelle pour déterminer la prière active/suivante
            const now = new Date();
            const currentTimeString = now.toTimeString().split(' ')[0].substring(0, 5);
            console.log(`Heure actuelle: ${currentTimeString}`);
            
            // Déterminer la prochaine prière
            nextPrayerTime = getNextPrayer(prayerTimesArray, currentTimeString);
            
            // Création des éléments pour chaque prière
            prayerTimesArray.forEach(prayer => {
                // Création de l'élément de prière
                const prayerElement = document.createElement('div');
                prayerElement.className = 'prayer-time-item';
                
                // Vérification si c'est la prochaine prière
                if (prayer.name === nextPrayerTime.name) {
                    prayerElement.classList.add('active');
                }
                
                // Calcul du temps restant avant la prochaine prière
                let remainingTimeText = '';
                if (prayer.name === nextPrayerTime.name) {
                    const remainingTime = getTimeUntilNextPrayer(nextPrayerTime.time);
                    remainingTimeText = `<div class="remaining-time">Dans ${remainingTime}</div>`;
                }
                
                // Récupération des noms et icônes de prière
                const prayerInfo = PRAYER_NAMES[prayer.name] || { fr: prayer.name, ar: prayer.name, icon: "🕋" };
                
                // Construction du HTML pour l'élément de prière
                prayerElement.innerHTML = `
                    <div class="prayer-name">
                        <span class="prayer-icon">${prayerInfo.icon}</span>
                        <div>
                            <div>${prayerInfo.fr}</div>
                            <div>${prayerInfo.ar}</div>
                        </div>
                    </div>
                    <div>
                        <div>${prayer.time}</div>
                        ${remainingTimeText}
                    </div>
                `;
                
                // Ajout de l'élément au conteneur
                container.appendChild(prayerElement);
            });
        }
        
        /**
         * Convertit une heure au format HH:MM en minutes depuis minuit
         * @param {string} time - Heure au format HH:MM
         * @returns {number} Minutes depuis minuit
         */
        function timeToMinutes(time) {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        }
        
        /**
         * Calcule le temps restant avant la prochaine prière
         * @param {string} prayerTime - Heure de la prochaine prière au format HH:MM
         * @returns {string} Temps restant au format HH:MM
         */
        function getTimeUntilNextPrayer(prayerTime) {
            // Obtention de l'heure actuelle
            const now = new Date();
            
            // Création d'une date pour la prière
            const prayerDate = new Date();
            const [prayerHours, prayerMinutes] = prayerTime.split(':').map(Number);
            prayerDate.setHours(prayerHours, prayerMinutes, 0, 0);
            
            // Si la prière est déjà passée aujourd'hui, passer à demain
            if (prayerDate < now) {
                prayerDate.setDate(prayerDate.getDate() + 1);
            }
            
            // Calcul de la différence en millisecondes
            const diffMs = prayerDate - now;
            
            // Conversion en heures et minutes
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            
            // Formatage du temps restant
            if (diffHours > 0) {
                return `${diffHours}h ${diffMinutes}min`;
            } else {
                return `${diffMinutes}min`;
            }
        }
        
        /**
         * Détermine la prochaine prière à partir de l'heure actuelle
         * @param {Array} prayerTimes - Tableau des horaires de prière
         * @param {string} currentTime - Heure actuelle au format HH:MM
         * @returns {Object} La prochaine prière et son heure
         */
        function getNextPrayer(prayerTimes, currentTime) {
            console.log(`Détermination de la prochaine prière à partir de l'heure actuelle: ${currentTime}`);
            
            // Convertir l'heure actuelle en minutes depuis minuit
            const currentMinutes = timeToMinutes(currentTime);
            
            // Trouver la prochaine prière
            let nextPrayer = null;
            let minDiff = Infinity;
            
            prayerTimes.forEach(prayer => {
                const prayerMinutes = timeToMinutes(prayer.time);
                let diff = prayerMinutes - currentMinutes;
                
                // Si la prière est déjà passée aujourd'hui, ajouter 24h pour la considérer pour demain
                if (diff < 0) {
                    diff += 24 * 60; // 24 heures en minutes
                }
                
                // Si cette prière est plus proche que la précédente "prochaine prière"
                if (diff < minDiff) {
                    minDiff = diff;
                    nextPrayer = prayer;
                }
            });
            
            console.log(`Prochaine prière: ${nextPrayer.name} à ${nextPrayer.time}`);
        return nextPrayer;
    }
    
    /**
     * Convertit une heure au format HH:MM en minutes depuis minuit
     * @param {string} time - Heure au format HH:MM
     * @returns {number} Minutes depuis minuit
     */
    function timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
    
    /**
     * Calcule le temps restant avant la prochaine prière
     * @param {string} prayerTime - Heure de la prochaine prière au format HH:MM
     * @returns {string} Temps restant au format HH:MM
     */
    function getTimeUntilNextPrayer(prayerTime) {
        // Obtention de l'heure actuelle
        const now = new Date();
        
        // Création d'une date pour la prière
        const prayerDate = new Date();
        const [prayerHours, prayerMinutes] = prayerTime.split(':').map(Number);
        prayerDate.setHours(prayerHours, prayerMinutes, 0, 0);
        
        // Si la prière est déjà passée aujourd'hui, passer à demain
        if (prayerDate < now) {
            prayerDate.setDate(prayerDate.getDate() + 1);
        }
        
        // Calcul de la différence en millisecondes
        const diffMs = prayerDate - now;
        
        // Conversion en heures et minutes
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        // Formatage du temps restant
        if (diffHours > 0) {
            return `${diffHours}h ${diffMinutes}min`;
        } else {
            return `${diffMinutes}min`;
        }
    }
    
    /**
     * Met à jour l'heure et la date actuelles dans l'interface
     */
    function updateCurrentTimeAndDate() {
        const now = new Date();
        
        // Format de l'heure (HH:MM:SS)
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        const timeString = now.toLocaleTimeString('fr-FR', timeOptions);
        
        // Format de la date (jour de la semaine, jour mois année)
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = now.toLocaleDateString('fr-FR', dateOptions);
        
        // Mise à jour de l'interface
        document.getElementById('current-time').textContent = timeString;
        document.getElementById('current-date').textContent = dateString;
        
        // Si les horaires de prière sont disponibles, mettre à jour l'affichage
        // pour indiquer la prochaine prière (toutes les minutes)
        if (Object.keys(prayerTimes).length > 0 && now.getSeconds() === 0) {
            const currentTimeString = timeString.substring(0, 5);
            displayPrayerTimes(prayerTimes);
        }
    }
    
    /**
     * Rafraîchit les données de localisation et les horaires de prière
     */
    async function refreshData() {
        console.log('Rafraîchissement des données');
        
        // Animation du bouton de rafraîchissement
        const refreshButton = document.getElementById('refresh-button');
        refreshButton.style.transform = 'rotate(360deg)';
        refreshButton.style.transition = 'transform 1s';
        
        // Réinitialisation de l'animation après 1 seconde
        setTimeout(() => {
            refreshButton.style.transform = 'rotate(0deg)';
            refreshButton.style.transition = 'none';
        }, 1000);
        
        // Effacement de tout message d'erreur
        document.getElementById('error-message').style.display = 'none';
        
        // Récupération de la position et des horaires de prière
        await getLocationAndPrayerTimes();
    }
    
    /**
     * Affiche un message d'erreur à l'utilisateur
     * @param {string} message - Message d'erreur à afficher
     */
    function displayError(message) {
        console.error(`ERREUR: ${message}`);
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Masquage du loader si visible
        const loader = document.getElementById('prayer-times-loader'); if (loader) loader.style.display = 'none';
    }
    
    /**
     * Ajoute les horaires de prière à l'écran de verrouillage
     * via l'API Web Periodic Background Sync
     */
    async function addToLockscreen() {
        console.log('Tentative d\'ajout à l\'écran de verrouillage');
        
        try {
            // Vérification de la prise en charge de l'API Notifications
            if (!('Notification' in window)) {
                throw new Error('Les notifications ne sont pas prises en charge par ce navigateur');
            }
            
            // Demande d'autorisation pour les notifications si nécessaire
            if (Notification.permission !== 'granted') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    throw new Error('L\'autorisation de notification est requise');
                }
            }
            
            // Vérification de la prise en charge de l'API Background Sync
            if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
                // Solution de secours pour les navigateurs sans support de Background Sync
                // Planifier les notifications pour la prochaine prière uniquement
                if (nextPrayerTime) {
                    scheduleNextPrayerNotification(nextPrayerTime);
                    alert('Notification programmée pour la prochaine prière');
                }
                return;
            }
            
            // Enregistrement du Background Sync pour mettre à jour les notifications périodiquement
            const registration = await navigator.serviceWorker.ready;
            
            // Vérifier si periodicSync est disponible
            if ('periodicSync' in registration) {
                try {
                    await registration.periodicSync.register('prayer-times-sync', {
                        minInterval: 60 * 60 * 1000, // 1 heure en millisecondes
                    });
                    alert('Les horaires de prière seront affichés sur votre écran de verrouillage');
                } catch (error) {
                    // Fallback si periodicSync n'est pas disponible
                    console.error('PeriodicSync non disponible:', error);
                    scheduleNextPrayerNotification(nextPrayerTime);
                    alert('Notification programmée pour la prochaine prière uniquement');
                }
            } else {
                // Fallback pour les navigateurs sans periodicSync
                console.log('PeriodicSync API non supportée');
                scheduleNextPrayerNotification(nextPrayerTime);
                alert('Notification programmée pour la prochaine prière uniquement');
            }
            
        } catch (error) {
            console.error('Erreur lors de l\'ajout à l\'écran de verrouillage:', error);
            alert(`Impossible d'ajouter à l'écran de verrouillage: ${error.message}`);
        }
    }
    
    /**
     * Planifie une notification pour la prochaine prière
     * @param {Object} prayerTime - Informations sur la prochaine prière
     */
    function scheduleNextPrayerNotification(prayerTime) {
        console.log(`Planification de notification pour ${prayerTime.name} à ${prayerTime.time}`);
        
        // Création d'une date pour la prière
        const prayerDate = new Date();
        const [hours, minutes] = prayerTime.time.split(':').map(Number);
        prayerDate.setHours(hours, minutes, 0, 0);
        
        // Si la prière est déjà passée aujourd'hui, passer à demain
        if (prayerDate < new Date()) {
            prayerDate.setDate(prayerDate.getDate() + 1);
        }
        
        // Temps restant en millisecondes
        const timeUntilPrayer = prayerDate.getTime() - new Date().getTime();
        
        // Planification de la notification
        setTimeout(() => {
            const prayerInfo = PRAYER_NAMES[prayerTime.name] || { fr: prayerTime.name, ar: prayerTime.name, icon: "🕋" };
            
            // Envoi de la notification
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('Salat Times', {
                    body: `C'est l'heure de la prière ${prayerInfo.fr} (${prayerInfo.ar})`,
                    icon: '/icons/icon-192x192.png',
                    vibrate: [200, 100, 200],
                    tag: 'prayer-notification',
                    requireInteraction: true,
                    silent: false
                });
                
                // Planifier la notification pour la prochaine prière après celle-ci
                const prayerTimesArray = Object.entries(prayerTimes).map(([key, value]) => ({
                    name: key,
                    time: value
                }));
                
                const nextPrayer = getNextPrayer(prayerTimesArray, prayerTime.time);
                scheduleNextPrayerNotification(nextPrayer);
            });
        }, timeUntilPrayer);
    }
    
    /**
     * Partage les horaires de prière via l'API Web Share
     */
    async function sharePrayerTimes() {
        console.log('Partage des horaires de prière');
        
        try {
            // Vérification de la prise en charge de l'API Web Share
            if (!navigator.share) {
                throw new Error('L\'API Web Share n\'est pas prise en charge par ce navigateur');
            }
            
            // Génération du texte à partager
            let shareText = `📆 Horaires de prière pour ${currentLocation.name}, ${currentLocation.country}\n\n`;
            
            // Ajout des horaires de prière
            for (const [prayer, time] of Object.entries(prayerTimes)) {
                const prayerInfo = PRAYER_NAMES[prayer] || { fr: prayer, ar: prayer, icon: "🕋" };
                shareText += `${prayerInfo.icon} ${prayerInfo.fr} (${prayerInfo.ar}): ${time}\n`;
            }
            
            // Ajout d'un lien vers l'application
            shareText += `\nPartagé depuis l'application Salat Times`;
            
            // Partage du texte
            await navigator.share({
                title: 'Horaires de prière',
                text: shareText,
                url: window.location.href
            });
            
            console.log('Horaires de prière partagés avec succès');
            
        } catch (error) {
            console.error('Erreur lors du partage des horaires de prière:', error);
            alert(`Impossible de partager: ${error.message}`);
        }
    }
    
    /**
     * Ouvre les paramètres de l'application
     */
    function openSettings() {
        console.log('Ouverture des paramètres');
        alert('Les paramètres de l\'application seront disponibles dans une prochaine version');
    }
    
    /**
     * Installe l'application sur l'appareil de l'utilisateur
     */
    async function installApp() {
        console.log('Installation de l\'application');
        
        if (!deferredPrompt) {
            alert('Cette application est déjà installée ou n\'est pas compatible avec votre navigateur');
            return;
        }
        
        // Affichage de l'invite d'installation
        deferredPrompt.prompt();
        
        // Attente de la réponse de l'utilisateur
        const choiceResult = await deferredPrompt.userChoice;
        
        // Réinitialisation de l'invite
        deferredPrompt = null;
        
        // Masquage du bouton d'installation
        document.getElementById('install-button').style.display = 'none';
        
        console.log('Résultat de l\'installation:', choiceResult.outcome);
    }
    
    /**
     * Active le mode test avec des données statiques 
     * Utile pour déboguer sans dépendre des API externes
     */
    function activateTestMode() {
        console.log('Activation du mode test');
        
        // Données de localisation statiques
        currentLocation = {
            name: 'Paris',
            country: 'France',
            latitude: 48.8566,
            longitude: 2.3522
        };
        
        // Mise à jour de l'interface
        document.getElementById('location-name').textContent = `${currentLocation.name}, ${currentLocation.country} (Mode Test)`;
        document.getElementById('location-coordinates').textContent = `Lat: ${currentLocation.latitude.toFixed(4)}, Long: ${currentLocation.longitude.toFixed(4)}`;
        document.getElementById('date-hijri').textContent = '15 Ramadan 1445';
        
        // Horaires de prière statiques
        prayerTimes = {
            fajr: "05:30",
            sunrise: "06:45",
            dhuhr: "12:30",
            asr: "15:45",
            maghrib: "18:45",
            isha: "20:15"
        };
        
        // Affichage des horaires de prière
        displayPrayerTimes(prayerTimes);
        const loader = document.getElementById('prayer-times-loader'); if (loader) loader.style.display = 'none';
        
        alert('Mode test activé. Toutes les fonctionnalités utilisent maintenant des données statiques.');
    }