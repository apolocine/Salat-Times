
function updateNextPrayerInfo() {
  if (!prayerTimes || Object.keys(prayerTimes).length === 0) return;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const prayerOrder = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
  let nextPrayerName = null;
  let nextPrayerTime = null;
  let nextMinutes = null;

  for (let key of prayerOrder) {
    const [h, m] = prayerTimes[key].split(":").map(Number);
    const total = h * 60 + m;

    if (total > currentMinutes) {
      nextPrayerName = key;
      nextPrayerTime = prayerTimes[key];
      nextMinutes = total;
      break;
    }
  }

  // Si toutes les prières sont passées
  if (!nextPrayerName) {
    nextPrayerName = "fajr";
    nextPrayerTime = prayerTimes["fajr"];
    const [h, m] = prayerTimes["fajr"].split(":").map(Number);
    nextMinutes = (24 * 60) + h * 60 + m; // demain
  }

  const displayName = {
    fajr: "Fajr",
    sunrise: "Shourouk",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha"
  };

  const diff = nextMinutes - currentMinutes;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  const countdown = `${hours > 0 ? hours + " h " : ""}${minutes} min`;

  const text = `
    📌 Prochaine prière : <strong>${displayName[nextPrayerName]}</strong> à <strong>${nextPrayerTime}</strong><br>
    ⏳ Temps restant : <strong>${countdown}</strong>
  `;

  document.getElementById("next-prayer-info").innerHTML = text;
}