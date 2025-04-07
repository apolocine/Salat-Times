# Salat Times - Application des Horaires de Prière

Cette application web progressive (PWA) permet de consulter les horaires de prière islamiques en fonction de votre position GPS. Elle est conçue pour fonctionner sur tous les appareils mobiles et peut être installée sur l'écran d'accueil pour un accès rapide.

## Fonctionnalités

- 🌍 **Détection automatique de la position** pour des horaires précis
- 🕋 **Affichage des horaires des 5 prières quotidiennes**
- 🌅 **Affichage du lever du soleil**
- ⏱️ **Compte à rebours jusqu'à la prochaine prière**
- 📅 **Affichage du calendrier hégirien**
- 🔔 **Notifications sur l'écran de verrouillage**
- 📱 **Installation sur l'écran d'accueil (PWA)**
- 📡 **Fonctionnement hors ligne**
- 📤 **Partage des horaires avec vos contacts**

## Installation

### Sur smartphone ou tablette

1. Ouvrez l'application dans votre navigateur à l'adresse : `https://salat.amia.fr/`
2. Pour iOS (Safari) :
   - Appuyez sur l'icône de partage (rectangle avec une flèche vers le haut)
   - Faites défiler et appuyez sur "Sur l'écran d'accueil"
   - Confirmez en appuyant sur "Ajouter"
3. Pour Android (Chrome) :
   - Appuyez sur les trois points en haut à droite
   - Sélectionnez "Ajouter à l'écran d'accueil"
   - Confirmez en appuyant sur "Ajouter"

Vous pouvez également utiliser le bouton "Installer l'application" directement depuis l'interface.

## Fonctionnement de l'écran de verrouillage

Pour afficher les horaires de prière sur votre écran de verrouillage :

1. Ouvrez l'application
2. Appuyez sur le bouton "Écran de verrouillage"
3. Acceptez les autorisations de notification si demandées

L'application utilisera alors les notifications pour afficher les horaires de prière sur votre écran de verrouillage. Vous recevrez une notification quelques minutes avant chaque prière.

## Personnalisation

L'application détecte automatiquement si votre appareil est en mode sombre et adapte son interface en conséquence.

## Technologies utilisées

- **HTML5/CSS3/JavaScript** pour l'interface utilisateur
- **API Geolocation** pour la détection de position
- **API Aladhan** pour le calcul des horaires de prière
- **Service Workers** pour le fonctionnement hors ligne
- **Web Notifications API** pour les notifications
- **IndexedDB** pour le stockage local des données
- **Web Share API** pour le partage

## Confidentialité

Votre position n'est utilisée que localement pour calculer les horaires de prière. Aucune donnée personnelle n'est stockée sur des serveurs distants.

## Notes importantes

- L'application nécessite les autorisations de localisation et de notification pour fonctionner correctement
- Pour des notifications fiables sur l'écran de verrouillage, assurez-vous que les notifications sont activées pour l'application
- Sur certains appareils Android, des optimisations de batterie peuvent empêcher les notifications en arrière-plan, vous devrez peut-être exclure cette application des optimisations de batterie

## Support et contact

Pour toute question ou suggestion, veuillez contacter :

- Email : support@amia.fr
- Site web : https://salat.amia.fr

---

© 2025 Salat Times - Application développée avec ❤️ pour la communauté
