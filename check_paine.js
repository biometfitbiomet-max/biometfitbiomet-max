const admin = require("firebase-admin");
const serviceAccount = require("/Users/teraki/Downloads/virgilapp-firebase-adminsdk-fbsvc-23488b6eba.json");
admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();

db.collection("users")
  .doc("cZpNfK4CRnX8zPgNh6QzYFf38Y83")
  .collection("nutrition_diary")
  .where("date", "==", "2026-06-18")
  .get()
  .then(snap => {
    if (snap.empty) {
      console.log("Nu s-au gasit intrari din 18 Iunie");
      process.exit(0);
    }
    console.log("Gasit", snap.size, "intrari din 18 Iunie:");
    snap.forEach(doc => {
      const d = doc.data();
      console.log("\nIngredient:", d.ingredientName);
      console.log("  amount:", d.amount, "g");
      console.log("  energy:", d.energy, "kcal");
      console.log("  protein:", d.protein, "g");
      if (d.amount > 0) {
        const energyPer100g = (d.energy / d.amount * 100).toFixed(1);
        console.log("  => energy/100g:", energyPer100g, "kcal/100g");
      }
    });
    process.exit(0);
  })
  .catch(e => {
    console.error("Eroare:", e);
    process.exit(1);
  });
