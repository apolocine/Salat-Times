
async function generateAndDownloadLockscreen() {
  const canvas = document.getElementById("lockscreenCanvas");
  const ctx = canvas.getContext("2d");
canvas.width = 1080*0.60;
  canvas.height = 1920*0.55	;
  
  // 🎲 Sélection aléatoire d’un template entre 01 et 11
  const randomIndex = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const templateName = `${randomIndex}-template.png`; // Ex: "07-template.png"// ;"07-template.png"
  const templatePath = `screenshots/templates/${templateName}`;
 
 
try {
  const bg = await loadImage(templatePath);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
} catch (err) {
  alert("Erreur : impossible de charger le template " + templatePath);
  console.error(err);
  return;
}
 


  // Données : coordonnées et horaires depuis le DOM et prayerTimes
  const coordsText = document.getElementById("location-coordinates")?.textContent || "Ville ...";
  const locationText = document.getElementById("location-name")?.textContent || "Ville ...";
  const dateHijri =  document.getElementById("date-hijri")?.textContent || "15 Ramadan 1445"; //"15 Ramadan 1445"; // (à remplacer dynamiquement si tu veux)

  // Horaires (depuis la variable globale prayerTimes)
  const names = {
    fajr: "Fajr",
    sunrise: "Shourouk",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha"
  };

  // Couleurs & Polices
 /// ctx.fillStyle = "#ffffff";
  ///ctx.font = "bold 64px sans-serif";
  ///ctx.fillText("Horaires de Prière", 50, 100);
  ///ctx.font = "42px sans-serif";
  ///ctx.fillText(locationText, 60, 120);
  ///ctx.fillText("🗓 " + dateHijri, 70, 190);

ctx.font = "bold 64px sans-serif";
ctx.fillText("Horaires de Prière", 60, 80);
ctx.font = "42px sans-serif";
ctx.fillText(locationText, 60, 140);
ctx.fillText("📅 " + dateHijri, 60, 200);


  // Bande date
  ctx.fillStyle = "#EEEEEE";
  // ctx.fillRect(0, 340, canvas.width, 70);
 // ctx.fillStyle = "#333";
  ctx.font = "42px sans-serif";
  const date = new Date();
  const dateStr = date.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  //ctx.fillText(dateStr, 70, 390);
ctx.fillText(dateStr, 60, 300);

  // Horaires
  let y = 380;//460;
  ctx.font = "52px sans-serif";
  for (const [key, label] of Object.entries(names)) {
    const heure = prayerTimes[key] || "--:--";
    ctx.strokeStyle = "#CCCCCC";
    ctx.beginPath();
   // ctx.moveTo(70, y - 20);
   // ctx.lineTo(canvas.width - 70, y - 20);
   ctx.moveTo(60, y + 50);
ctx.lineTo(canvas.width - 60, y + 50);

    ctx.stroke();

    ctx.fillStyle = "#222";
    ctx.fillText(label, 100, y);
    ctx.fillStyle = "#F44336";
    ctx.fillText(heure, canvas.width - 280, y);
    y += 105;//90;
  }

  // Footer
  ctx.fillStyle = "#999";
  ctx.font = "38px sans-serif";
  ctx.fillText("📲 Généré par Salat Times", 50, canvas.height - 60);

  // Télécharger
  const link = document.createElement("a");
  link.download = "salat_lockscreen.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// ✅ Fonction utilitaire fiable pour charger une image
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
} 
