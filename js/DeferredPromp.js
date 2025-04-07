 

window.addEventListener('beforeinstallprompt', (e) => {
  // Empêche Chrome d'afficher automatiquement la mini-bannière
  e.preventDefault();
  deferredPrompt = e;

  // Affiche ton bouton "Installer"
  const installBtn = document.getElementById('install-btn');
  installBtn.style.display = 'inline-block';

  installBtn.addEventListener('click', async () => {
    installBtn.style.display = 'none';
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('L’utilisateur a accepté l’installation');
    } else {
      console.log('L’utilisateur a refusé l’installation');
    }
    deferredPrompt = null;
  });
});


	//l'install du basser
	window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('install-banner').style.display = 'block';
});

document.getElementById('install-confirm').addEventListener('click', async () => {
  document.getElementById('install-banner').style.display = 'none';
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;	
   // console.log('User choice:', choiceResult.outcome);
	showInstallToast();
    deferredPrompt = null;
		
  }else{
  alert('deferredPrompt :'+deferredPrompt);
  }
});

document.getElementById('install-cancel').addEventListener('click', () => {
  document.getElementById('install-banner').style.display = 'none';
});


function showInstallToast() {
  const toast = document.getElementById('install-toast');
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 4000);
}

