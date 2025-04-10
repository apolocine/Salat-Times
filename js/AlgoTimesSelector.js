 // Ajouter cette variable aux variables globales 
 let currentCalculationMethod = 2; // Méthode par défaut: ISNA (2)
    
 // Ajouter cet écouteur d'événement dans la fonction attachEventHandlers()
 document.getElementById('calculation-method').addEventListener('change', function(event) {
     currentCalculationMethod = parseInt(event.target.value);
     console.debug(`Méthode de calcul changée pour: `+currentCalculationMethod);
     refreshData(); // Rafraîchir les données avec la nouvelle méthode
 });
 
 // Modifier la fonction fetchPrayerTimes pour utiliser la méthode sélectionnée
 // Dans la section où vous construisez l'URL de l'API, remplacez:
 // const apiUrl = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=2`;
 // Par:
 // const apiUrl = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=${currentCalculationMethod}`;
 
 // Ajouter cette fonction pour charger la méthode enregistrée (à appeler dans initApp)
 function loadSavedMethod() {
     try {
         const savedMethod = localStorage.getItem('calculationMethod');
         if (savedMethod !== null) {
             currentCalculationMethod = parseInt(savedMethod);
             document.getElementById('calculation-method').value = currentCalculationMethod;
            console.debug(`Méthode de calcul chargée depuis le stockage: ${currentCalculationMethod}`);
         }
     } catch (error) {
         console.debug(`Erreur lors du chargement de la méthode: ${error}`);
     }
 }
 
 // Ajouter cette fonction pour sauvegarder la méthode sélectionnée
 function saveCalculationMethod(method) {
     try {
         localStorage.setItem('calculationMethod', method);
         console.debug(`Méthode de calcul sauvegardée: ${method}`);
     } catch (error) {
        console.debug(`Erreur lors de la sauvegarde de la méthode: ${error}`);
     }
 }
 
 // Modifier l'écouteur d'événement du sélecteur pour sauvegarder la méthode
 document.getElementById('calculation-method').addEventListener('change', function(event) {
     currentCalculationMethod = parseInt(event.target.value);
     saveCalculationMethod(currentCalculationMethod);
     console.debug(`Méthode de calcul changée pour: ${currentCalculationMethod}`);
     refreshData(); // Rafraîchir les données avec la nouvelle méthode
 });
 