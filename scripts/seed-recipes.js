require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const db = admin.firestore();

function normalize(s) {
  return s.toLowerCase().trim()
    .replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i')
    .replace(/ș/g, 's').replace(/ț/g, 't')
    .replace(/Ă/g, 'A').replace(/Â/g, 'A').replace(/Î/g, 'I')
    .replace(/Ș/g, 'S').replace(/Ț/g, 'T');
}

function calcNutrition(ingredients, servings) {
  let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
  for (const ing of ingredients) {
    totalCalories += (ing.calories * ing.amount) / 100;
    totalProtein += (ing.protein * ing.amount) / 100;
    totalCarbs += (ing.carbs * ing.amount) / 100;
    totalFat += (ing.fat * ing.amount) / 100;
  }
  const s = servings > 0 ? servings : 1;
  return {
    totalCalories: Math.round(totalCalories * 10) / 10,
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalCarbs: Math.round(totalCarbs * 10) / 10,
    totalFat: Math.round(totalFat * 10) / 10,
    caloriesPerServing: Math.round((totalCalories / s) * 10) / 10,
    proteinPerServing: Math.round((totalProtein / s) * 10) / 10,
    carbsPerServing: Math.round((totalCarbs / s) * 10) / 10,
    fatPerServing: Math.round((totalFat / s) * 10) / 10,
  };
}

const recipes = [
  {
    name: 'Mămăligă cu brânză și smântână', servings: 4, prepTime: 5, cookTime: 20, totalWeight: 1100,
    ingredients: [
      { ingredientName: 'Mălai', amount: 200, unit: 'grame', calories: 340, protein: 8, carbs: 72, fat: 1.5 },
      { ingredientName: 'Apă', amount: 800, unit: 'ml', calories: 0, protein: 0, carbs: 0, fat: 0 },
      { ingredientName: 'Brânză de vaci', amount: 200, unit: 'grame', calories: 98, protein: 11, carbs: 4, fat: 5 },
      { ingredientName: 'Smântână', amount: 100, unit: 'grame', calories: 193, protein: 2.5, carbs: 3, fat: 19 },
    ],
  },
  {
    name: 'Sarmale cu mămăligă', servings: 6, prepTime: 60, cookTime: 180, totalWeight: 2000,
    ingredients: [
      { ingredientName: 'Varză murată', amount: 500, unit: 'grame', calories: 17, protein: 1.5, carbs: 3, fat: 0.3 },
      { ingredientName: 'Carne de porc', amount: 400, unit: 'grame', calories: 242, protein: 27, carbs: 0, fat: 14 },
      { ingredientName: 'Orez', amount: 100, unit: 'grame', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Bulion', amount: 50, unit: 'grame', calories: 60, protein: 2, carbs: 12, fat: 0.5 },
      { ingredientName: 'Costiță afumată', amount: 200, unit: 'grame', calories: 350, protein: 20, carbs: 0, fat: 30 },
      { ingredientName: 'Mălai', amount: 150, unit: 'grame', calories: 340, protein: 8, carbs: 72, fat: 1.5 },
    ],
  },
  {
    name: 'Ciorbă de burtă', servings: 6, prepTime: 30, cookTime: 180, totalWeight: 1800,
    ingredients: [
      { ingredientName: 'Burtă de vită', amount: 500, unit: 'grame', calories: 85, protein: 15, carbs: 0, fat: 2.5 },
      { ingredientName: 'Os cu măduvă', amount: 300, unit: 'grame', calories: 150, protein: 10, carbs: 0, fat: 12 },
      { ingredientName: 'Morcov', amount: 100, unit: 'grame', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Usturoi', amount: 30, unit: 'grame', calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
      { ingredientName: 'Smântână', amount: 200, unit: 'grame', calories: 193, protein: 2.5, carbs: 3, fat: 19 },
      { ingredientName: 'Oțet', amount: 30, unit: 'ml', calories: 18, protein: 0, carbs: 0.5, fat: 0 },
    ],
  },
  {
    name: 'Ciorbă de perișoare', servings: 6, prepTime: 30, cookTime: 60, totalWeight: 2000,
    ingredients: [
      { ingredientName: 'Carne de vită tocată', amount: 400, unit: 'grame', calories: 217, protein: 26, carbs: 0, fat: 12 },
      { ingredientName: 'Orez', amount: 50, unit: 'grame', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      { ingredientName: 'Ceapă', amount: 150, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Morcov', amount: 100, unit: 'grame', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { ingredientName: 'Pătrunjel', amount: 20, unit: 'grame', calories: 36, protein: 3, carbs: 6, fat: 0.8 },
      { ingredientName: 'Roșii', amount: 200, unit: 'grame', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
      { ingredientName: 'Apă', amount: 1500, unit: 'ml', calories: 0, protein: 0, carbs: 0, fat: 0 },
    ],
  },
  {
    name: 'Ciorbă de legume', servings: 4, prepTime: 15, cookTime: 40, totalWeight: 1500,
    ingredients: [
      { ingredientName: 'Cartofi', amount: 300, unit: 'grame', calories: 77, protein: 2, carbs: 17, fat: 0.1 },
      { ingredientName: 'Morcov', amount: 150, unit: 'grame', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Ardei gras', amount: 100, unit: 'grame', calories: 31, protein: 1, carbs: 6, fat: 0.3 },
      { ingredientName: 'Roșii', amount: 200, unit: 'grame', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
      { ingredientName: 'Mazăre', amount: 100, unit: 'grame', calories: 81, protein: 5.4, carbs: 14, fat: 0.4 },
      { ingredientName: 'Apă', amount: 1000, unit: 'ml', calories: 0, protein: 0, carbs: 0, fat: 0 },
    ],
  },
  {
    name: 'Ciorbă de fasole cu afumătură', servings: 6, prepTime: 20, cookTime: 120, totalWeight: 1800,
    ingredients: [
      { ingredientName: 'Fasole boabă', amount: 400, unit: 'grame', calories: 127, protein: 9, carbs: 23, fat: 0.5 },
      { ingredientName: 'Costiță afumată', amount: 200, unit: 'grame', calories: 350, protein: 20, carbs: 0, fat: 30 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Morcov', amount: 100, unit: 'grame', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { ingredientName: 'Bulion', amount: 50, unit: 'grame', calories: 60, protein: 2, carbs: 12, fat: 0.5 },
      { ingredientName: 'Apă', amount: 1200, unit: 'ml', calories: 0, protein: 0, carbs: 0, fat: 0 },
    ],
  },
  {
    name: 'Ciorbă de pui', servings: 6, prepTime: 15, cookTime: 60, totalWeight: 1800,
    ingredients: [
      { ingredientName: 'Pui', amount: 500, unit: 'grame', calories: 239, protein: 27, carbs: 0, fat: 14 },
      { ingredientName: 'Morcov', amount: 150, unit: 'grame', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Ardei gras', amount: 100, unit: 'grame', calories: 31, protein: 1, carbs: 6, fat: 0.3 },
      { ingredientName: 'Roșii', amount: 150, unit: 'grame', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
      { ingredientName: 'Tăiței', amount: 100, unit: 'grame', calories: 380, protein: 10, carbs: 75, fat: 2 },
      { ingredientName: 'Apă', amount: 1200, unit: 'ml', calories: 0, protein: 0, carbs: 0, fat: 0 },
    ],
  },
  {
    name: 'Ciorbă țărănească de vită', servings: 6, prepTime: 30, cookTime: 150, totalWeight: 2000,
    ingredients: [
      { ingredientName: 'Vită', amount: 400, unit: 'grame', calories: 217, protein: 26, carbs: 0, fat: 12 },
      { ingredientName: 'Ceapă', amount: 150, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Morcov', amount: 150, unit: 'grame', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { ingredientName: 'Cartofi', amount: 300, unit: 'grame', calories: 77, protein: 2, carbs: 17, fat: 0.1 },
      { ingredientName: 'Varză albă', amount: 200, unit: 'grame', calories: 25, protein: 1.3, carbs: 6, fat: 0.1 },
      { ingredientName: 'Borș', amount: 200, unit: 'ml', calories: 20, protein: 0.5, carbs: 4, fat: 0 },
      { ingredientName: 'Apă', amount: 1200, unit: 'ml', calories: 0, protein: 0, carbs: 0, fat: 0 },
    ],
  },
  {
    name: 'Ciorbă de pește', servings: 4, prepTime: 20, cookTime: 45, totalWeight: 1500,
    ingredients: [
      { ingredientName: 'Pește (crap)', amount: 500, unit: 'grame', calories: 127, protein: 18, carbs: 0, fat: 5 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Morcov', amount: 100, unit: 'grame', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { ingredientName: 'Roșii', amount: 200, unit: 'grame', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
      { ingredientName: 'Orez', amount: 50, unit: 'grame', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      { ingredientName: 'Apă', amount: 1000, unit: 'ml', calories: 0, protein: 0, carbs: 0, fat: 0 },
    ],
  },
  {
    name: 'Tochitură românească', servings: 4, prepTime: 15, cookTime: 45, totalWeight: 800,
    ingredients: [
      { ingredientName: 'Carne de porc', amount: 400, unit: 'grame', calories: 242, protein: 27, carbs: 0, fat: 14 },
      { ingredientName: 'Ceapă', amount: 150, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Bulion', amount: 50, unit: 'grame', calories: 60, protein: 2, carbs: 12, fat: 0.5 },
      { ingredientName: 'Slănină afumată', amount: 100, unit: 'grame', calories: 617, protein: 9, carbs: 0, fat: 63 },
      { ingredientName: 'Usturoi', amount: 20, unit: 'grame', calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
      { ingredientName: 'Mămăligă', amount: 300, unit: 'grame', calories: 90, protein: 2, carbs: 19, fat: 0.4 },
    ],
  },
  {
    name: 'Tocăniță de ciuperci', servings: 4, prepTime: 15, cookTime: 30, totalWeight: 800,
    ingredients: [
      { ingredientName: 'Ciuperci', amount: 500, unit: 'grame', calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Smântână', amount: 150, unit: 'grame', calories: 193, protein: 2.5, carbs: 3, fat: 19 },
      { ingredientName: 'Făină', amount: 20, unit: 'grame', calories: 340, protein: 10, carbs: 73, fat: 1 },
      { ingredientName: 'Ulei', amount: 30, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Tocăniță de vită', servings: 4, prepTime: 20, cookTime: 120, totalWeight: 1000,
    ingredients: [
      { ingredientName: 'Vită', amount: 500, unit: 'grame', calories: 217, protein: 26, carbs: 0, fat: 12 },
      { ingredientName: 'Ceapă', amount: 150, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Morcov', amount: 100, unit: 'grame', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { ingredientName: 'Bulion', amount: 50, unit: 'grame', calories: 60, protein: 2, carbs: 12, fat: 0.5 },
      { ingredientName: 'Cartofi', amount: 300, unit: 'grame', calories: 77, protein: 2, carbs: 17, fat: 0.1 },
      { ingredientName: 'Ulei', amount: 30, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Iahnie de fasole', servings: 4, prepTime: 20, cookTime: 90, totalWeight: 900,
    ingredients: [
      { ingredientName: 'Fasole boabă', amount: 400, unit: 'grame', calories: 127, protein: 9, carbs: 23, fat: 0.5 },
      { ingredientName: 'Ceapă', amount: 150, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Bulion', amount: 50, unit: 'grame', calories: 60, protein: 2, carbs: 12, fat: 0.5 },
      { ingredientName: 'Usturoi', amount: 20, unit: 'grame', calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
      { ingredientName: 'Ulei', amount: 30, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
      { ingredientName: 'Frunză de dafin', amount: 2, unit: 'grame', calories: 313, protein: 7.6, carbs: 75, fat: 8 },
    ],
  },
  {
    name: 'Mititei (mici)', servings: 4, prepTime: 30, cookTime: 20, totalWeight: 600,
    ingredients: [
      { ingredientName: 'Carne de vită tocată', amount: 300, unit: 'grame', calories: 217, protein: 26, carbs: 0, fat: 12 },
      { ingredientName: 'Carne de porc tocată', amount: 200, unit: 'grame', calories: 242, protein: 27, carbs: 0, fat: 14 },
      { ingredientName: 'Usturoi', amount: 15, unit: 'grame', calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
      { ingredientName: 'Chimion', amount: 5, unit: 'grame', calories: 375, protein: 18, carbs: 44, fat: 15 },
      { ingredientName: 'Sodă bicarbonică', amount: 2, unit: 'grame', calories: 0, protein: 0, carbs: 0, fat: 0 },
    ],
  },
  {
    name: 'Frigărui de porc', servings: 4, prepTime: 30, cookTime: 25, totalWeight: 700,
    ingredients: [
      { ingredientName: 'Carne de porc', amount: 500, unit: 'grame', calories: 242, protein: 27, carbs: 0, fat: 14 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Ardei gras', amount: 100, unit: 'grame', calories: 31, protein: 1, carbs: 6, fat: 0.3 },
      { ingredientName: 'Roșii cherry', amount: 100, unit: 'grame', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
      { ingredientName: 'Ulei', amount: 30, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Frigărui de pui', servings: 4, prepTime: 30, cookTime: 20, totalWeight: 700,
    ingredients: [
      { ingredientName: 'Piept de pui', amount: 500, unit: 'grame', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Ardei gras', amount: 100, unit: 'grame', calories: 31, protein: 1, carbs: 6, fat: 0.3 },
      { ingredientName: 'Roșii cherry', amount: 100, unit: 'grame', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
      { ingredientName: 'Ulei', amount: 20, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Șnițel de porc', servings: 2, prepTime: 15, cookTime: 15, totalWeight: 400,
    ingredients: [
      { ingredientName: 'Carne de porc', amount: 300, unit: 'grame', calories: 242, protein: 27, carbs: 0, fat: 14 },
      { ingredientName: 'Ou', amount: 100, unit: 'grame', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
      { ingredientName: 'Făină', amount: 50, unit: 'grame', calories: 340, protein: 10, carbs: 73, fat: 1 },
      { ingredientName: 'Pesmet', amount: 50, unit: 'grame', calories: 380, protein: 10, carbs: 76, fat: 3 },
      { ingredientName: 'Ulei', amount: 50, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Șnițel de pui', servings: 2, prepTime: 15, cookTime: 15, totalWeight: 400,
    ingredients: [
      { ingredientName: 'Piept de pui', amount: 300, unit: 'grame', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      { ingredientName: 'Ou', amount: 100, unit: 'grame', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
      { ingredientName: 'Făină', amount: 50, unit: 'grame', calories: 340, protein: 10, carbs: 73, fat: 1 },
      { ingredientName: 'Pesmet', amount: 50, unit: 'grame', calories: 380, protein: 10, carbs: 76, fat: 3 },
      { ingredientName: 'Ulei', amount: 50, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Șnițel de vită', servings: 2, prepTime: 15, cookTime: 15, totalWeight: 400,
    ingredients: [
      { ingredientName: 'Vită', amount: 300, unit: 'grame', calories: 217, protein: 26, carbs: 0, fat: 12 },
      { ingredientName: 'Ou', amount: 100, unit: 'grame', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
      { ingredientName: 'Făină', amount: 50, unit: 'grame', calories: 340, protein: 10, carbs: 73, fat: 1 },
      { ingredientName: 'Pesmet', amount: 50, unit: 'grame', calories: 380, protein: 10, carbs: 76, fat: 3 },
      { ingredientName: 'Ulei', amount: 50, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Papanași cu smântână și dulceață', servings: 4, prepTime: 30, cookTime: 20, totalWeight: 600,
    ingredients: [
      { ingredientName: 'Brânză de vaci', amount: 300, unit: 'grame', calories: 98, protein: 11, carbs: 4, fat: 5 },
      { ingredientName: 'Făină', amount: 100, unit: 'grame', calories: 340, protein: 10, carbs: 73, fat: 1 },
      { ingredientName: 'Ou', amount: 100, unit: 'grame', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
      { ingredientName: 'Smântână', amount: 100, unit: 'grame', calories: 193, protein: 2.5, carbs: 3, fat: 19 },
      { ingredientName: 'Dulceață', amount: 80, unit: 'grame', calories: 250, protein: 0.5, carbs: 60, fat: 0 },
      { ingredientName: 'Ulei', amount: 100, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Salată de boeuf', servings: 6, prepTime: 60, cookTime: 40, totalWeight: 1200,
    ingredients: [
      { ingredientName: 'Piept de pui', amount: 300, unit: 'grame', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      { ingredientName: 'Cartofi', amount: 300, unit: 'grame', calories: 77, protein: 2, carbs: 17, fat: 0.1 },
      { ingredientName: 'Morcov', amount: 150, unit: 'grame', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { ingredientName: 'Mazăre', amount: 100, unit: 'grame', calories: 81, protein: 5.4, carbs: 14, fat: 0.4 },
      { ingredientName: 'Maioneză', amount: 150, unit: 'grame', calories: 680, protein: 1, carbs: 0.6, fat: 75 },
      { ingredientName: 'Murături', amount: 100, unit: 'grame', calories: 15, protein: 0.5, carbs: 3, fat: 0.1 },
    ],
  },
  {
    name: 'Salată de vinete', servings: 4, prepTime: 30, cookTime: 30, totalWeight: 400,
    ingredients: [
      { ingredientName: 'Vinete', amount: 500, unit: 'grame', calories: 25, protein: 1, carbs: 6, fat: 0.2 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Ulei', amount: 80, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
      { ingredientName: 'Sare', amount: 5, unit: 'grame', calories: 0, protein: 0, carbs: 0, fat: 0 },
    ],
  },
  {
    name: 'Salată de varză albă', servings: 4, prepTime: 15, cookTime: 0, totalWeight: 500,
    ingredients: [
      { ingredientName: 'Varză albă', amount: 400, unit: 'grame', calories: 25, protein: 1.3, carbs: 6, fat: 0.1 },
      { ingredientName: 'Morcov', amount: 50, unit: 'grame', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { ingredientName: 'Ulei', amount: 30, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
      { ingredientName: 'Oțet', amount: 20, unit: 'ml', calories: 18, protein: 0, carbs: 0.5, fat: 0 },
    ],
  },
  {
    name: 'Salată de roșii și castraveți', servings: 4, prepTime: 10, cookTime: 0, totalWeight: 600,
    ingredients: [
      { ingredientName: 'Roșii', amount: 300, unit: 'grame', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
      { ingredientName: 'Castraveți', amount: 200, unit: 'grame', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
      { ingredientName: 'Ceapă', amount: 50, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Ulei', amount: 30, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Salată țărănească', servings: 4, prepTime: 15, cookTime: 0, totalWeight: 700,
    ingredients: [
      { ingredientName: 'Roșii', amount: 300, unit: 'grame', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
      { ingredientName: 'Castraveți', amount: 200, unit: 'grame', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Ardei gras', amount: 100, unit: 'grame', calories: 31, protein: 1, carbs: 6, fat: 0.3 },
      { ingredientName: 'Brânză telemea', amount: 100, unit: 'grame', calories: 260, protein: 18, carbs: 2, fat: 20 },
      { ingredientName: 'Ulei', amount: 30, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Zacuscă', servings: 10, prepTime: 60, cookTime: 180, totalWeight: 2000,
    ingredients: [
      { ingredientName: 'Vinete', amount: 1000, unit: 'grame', calories: 25, protein: 1, carbs: 6, fat: 0.2 },
      { ingredientName: 'Gogoșari', amount: 500, unit: 'grame', calories: 31, protein: 1, carbs: 6, fat: 0.3 },
      { ingredientName: 'Roșii', amount: 500, unit: 'grame', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
      { ingredientName: 'Ceapă', amount: 200, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Ulei', amount: 200, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Plăcintă cu brânză', servings: 8, prepTime: 30, cookTime: 40, totalWeight: 1200,
    ingredients: [
      { ingredientName: 'Făină', amount: 400, unit: 'grame', calories: 340, protein: 10, carbs: 73, fat: 1 },
      { ingredientName: 'Brânză de vaci', amount: 500, unit: 'grame', calories: 98, protein: 11, carbs: 4, fat: 5 },
      { ingredientName: 'Ou', amount: 100, unit: 'grame', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
      { ingredientName: 'Unt', amount: 100, unit: 'grame', calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
      { ingredientName: 'Smântână', amount: 100, unit: 'grame', calories: 193, protein: 2.5, carbs: 3, fat: 19 },
    ],
  },
  {
    name: 'Plăcintă cu mere', servings: 8, prepTime: 30, cookTime: 45, totalWeight: 1200,
    ingredients: [
      { ingredientName: 'Făină', amount: 400, unit: 'grame', calories: 340, protein: 10, carbs: 73, fat: 1 },
      { ingredientName: 'Mere', amount: 600, unit: 'grame', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
      { ingredientName: 'Zahăr', amount: 100, unit: 'grame', calories: 387, protein: 0, carbs: 100, fat: 0 },
      { ingredientName: 'Unt', amount: 100, unit: 'grame', calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
      { ingredientName: 'Ou', amount: 50, unit: 'grame', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
    ],
  },
  {
    name: 'Plăcintă cu carne', servings: 8, prepTime: 30, cookTime: 45, totalWeight: 1200,
    ingredients: [
      { ingredientName: 'Făină', amount: 400, unit: 'grame', calories: 340, protein: 10, carbs: 73, fat: 1 },
      { ingredientName: 'Carne de porc tocată', amount: 400, unit: 'grame', calories: 242, protein: 27, carbs: 0, fat: 14 },
      { ingredientName: 'Ceapă', amount: 150, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Unt', amount: 100, unit: 'grame', calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
      { ingredientName: 'Ou', amount: 50, unit: 'grame', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
    ],
  },
  {
    name: 'Cozonac', servings: 10, prepTime: 120, cookTime: 60, totalWeight: 1500,
    ingredients: [
      { ingredientName: 'Făină', amount: 500, unit: 'grame', calories: 340, protein: 10, carbs: 73, fat: 1 },
      { ingredientName: 'Lapte', amount: 200, unit: 'ml', calories: 42, protein: 3.4, carbs: 5, fat: 1 },
      { ingredientName: 'Ou', amount: 150, unit: 'grame', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
      { ingredientName: 'Zahăr', amount: 150, unit: 'grame', calories: 387, protein: 0, carbs: 100, fat: 0 },
      { ingredientName: 'Unt', amount: 100, unit: 'grame', calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
      { ingredientName: 'Cacao', amount: 50, unit: 'grame', calories: 228, protein: 8, carbs: 58, fat: 14 },
      { ingredientName: 'Drojdie', amount: 25, unit: 'grame', calories: 105, protein: 10, carbs: 22, fat: 1 },
    ],
  },
  {
    name: 'Colivă', servings: 10, prepTime: 30, cookTime: 60, totalWeight: 800,
    ingredients: [
      { ingredientName: 'Grâu', amount: 400, unit: 'grame', calories: 340, protein: 12, carbs: 72, fat: 1.5 },
      { ingredientName: 'Zahăr', amount: 200, unit: 'grame', calories: 387, protein: 0, carbs: 100, fat: 0 },
      { ingredientName: 'Nucă', amount: 100, unit: 'grame', calories: 654, protein: 15, carbs: 14, fat: 65 },
      { ingredientName: 'Apă', amount: 800, unit: 'ml', calories: 0, protein: 0, carbs: 0, fat: 0 },
    ],
  },
  {
    name: 'Drob de miel', servings: 6, prepTime: 45, cookTime: 60, totalWeight: 1000,
    ingredients: [
      { ingredientName: 'Măruntaie de miel', amount: 500, unit: 'grame', calories: 135, protein: 20, carbs: 0, fat: 5 },
      { ingredientName: 'Ceapă verde', amount: 100, unit: 'grame', calories: 32, protein: 1.5, carbs: 7, fat: 0.2 },
      { ingredientName: 'Ou', amount: 200, unit: 'grame', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
      { ingredientName: 'Verdețuri', amount: 50, unit: 'grame', calories: 30, protein: 2, carbs: 5, fat: 0.5 },
      { ingredientName: 'Pâine', amount: 100, unit: 'grame', calories: 265, protein: 9, carbs: 49, fat: 3.2 },
    ],
  },
  {
    name: 'Rulou de carne', servings: 4, prepTime: 30, cookTime: 60, totalWeight: 800,
    ingredients: [
      { ingredientName: 'Carne de porc tocată', amount: 500, unit: 'grame', calories: 242, protein: 27, carbs: 0, fat: 14 },
      { ingredientName: 'Ou', amount: 150, unit: 'grame', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Morcov', amount: 50, unit: 'grame', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { ingredientName: 'Făină', amount: 50, unit: 'grame', calories: 340, protein: 10, carbs: 73, fat: 1 },
    ],
  },
  {
    name: 'Cârnați de casă cu mămăligă', servings: 4, prepTime: 60, cookTime: 30, totalWeight: 800,
    ingredients: [
      { ingredientName: 'Carne de porc', amount: 500, unit: 'grame', calories: 242, protein: 27, carbs: 0, fat: 14 },
      { ingredientName: 'Usturoi', amount: 15, unit: 'grame', calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
      { ingredientName: 'Mălai', amount: 150, unit: 'grame', calories: 340, protein: 8, carbs: 72, fat: 1.5 },
      { ingredientName: 'Apă', amount: 600, unit: 'ml', calories: 0, protein: 0, carbs: 0, fat: 0 },
    ],
  },
  {
    name: 'Pui cu smântână și ciuperci', servings: 4, prepTime: 15, cookTime: 30, totalWeight: 900,
    ingredients: [
      { ingredientName: 'Piept de pui', amount: 500, unit: 'grame', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      { ingredientName: 'Ciuperci', amount: 300, unit: 'grame', calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
      { ingredientName: 'Smântână', amount: 200, unit: 'grame', calories: 193, protein: 2.5, carbs: 3, fat: 19 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Ulei', amount: 20, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Pui cu usturoi', servings: 4, prepTime: 15, cookTime: 45, totalWeight: 800,
    ingredients: [
      { ingredientName: 'Pui întreg', amount: 600, unit: 'grame', calories: 239, protein: 27, carbs: 0, fat: 14 },
      { ingredientName: 'Usturoi', amount: 50, unit: 'grame', calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
      { ingredientName: 'Ulei', amount: 30, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
      { ingredientName: 'Lămâie', amount: 50, unit: 'grame', calories: 29, protein: 1.1, carbs: 9, fat: 0.3 },
    ],
  },
  {
    name: 'Vită cu ceapă', servings: 4, prepTime: 15, cookTime: 90, totalWeight: 900,
    ingredients: [
      { ingredientName: 'Vită', amount: 500, unit: 'grame', calories: 217, protein: 26, carbs: 0, fat: 12 },
      { ingredientName: 'Ceapă', amount: 300, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Bulion', amount: 50, unit: 'grame', calories: 60, protein: 2, carbs: 12, fat: 0.5 },
      { ingredientName: 'Ulei', amount: 30, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Porc cu cartofi la cuptor', servings: 4, prepTime: 20, cookTime: 60, totalWeight: 1000,
    ingredients: [
      { ingredientName: 'Carne de porc', amount: 500, unit: 'grame', calories: 242, protein: 27, carbs: 0, fat: 14 },
      { ingredientName: 'Cartofi', amount: 500, unit: 'grame', calories: 77, protein: 2, carbs: 17, fat: 0.1 },
      { ingredientName: 'Usturoi', amount: 20, unit: 'grame', calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
      { ingredientName: 'Ulei', amount: 40, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
      { ingredientName: 'Rosemarin', amount: 5, unit: 'grame', calories: 131, protein: 3.3, carbs: 21, fat: 5.9 },
    ],
  },
  {
    name: 'Pește la grătar cu lămâie', servings: 2, prepTime: 10, cookTime: 20, totalWeight: 500,
    ingredients: [
      { ingredientName: 'Somon', amount: 400, unit: 'grame', calories: 208, protein: 20, carbs: 0, fat: 13 },
      { ingredientName: 'Lămâie', amount: 50, unit: 'grame', calories: 29, protein: 1.1, carbs: 9, fat: 0.3 },
      { ingredientName: 'Usturoi', amount: 10, unit: 'grame', calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
      { ingredientName: 'Ulei de măsline', amount: 20, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Cartofi țărănești', servings: 4, prepTime: 15, cookTime: 35, totalWeight: 700,
    ingredients: [
      { ingredientName: 'Cartofi', amount: 600, unit: 'grame', calories: 77, protein: 2, carbs: 17, fat: 0.1 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Usturoi', amount: 15, unit: 'grame', calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
      { ingredientName: 'Unt', amount: 50, unit: 'grame', calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
      { ingredientName: 'Pătrunjel', amount: 20, unit: 'grame', calories: 36, protein: 3, carbs: 6, fat: 0.8 },
    ],
  },
  {
    name: 'Cartofi piure', servings: 4, prepTime: 10, cookTime: 25, totalWeight: 800,
    ingredients: [
      { ingredientName: 'Cartofi', amount: 600, unit: 'grame', calories: 77, protein: 2, carbs: 17, fat: 0.1 },
      { ingredientName: 'Lapte', amount: 150, unit: 'ml', calories: 42, protein: 3.4, carbs: 5, fat: 1 },
      { ingredientName: 'Unt', amount: 50, unit: 'grame', calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
      { ingredientName: 'Sare', amount: 5, unit: 'grame', calories: 0, protein: 0, carbs: 0, fat: 0 },
    ],
  },
  {
    name: 'Orez cu legume', servings: 4, prepTime: 10, cookTime: 25, totalWeight: 700,
    ingredients: [
      { ingredientName: 'Orez', amount: 200, unit: 'grame', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      { ingredientName: 'Morcov', amount: 100, unit: 'grame', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { ingredientName: 'Mazăre', amount: 100, unit: 'grame', calories: 81, protein: 5.4, carbs: 14, fat: 0.4 },
      { ingredientName: 'Porumb', amount: 100, unit: 'grame', calories: 86, protein: 3.2, carbs: 19, fat: 1.2 },
      { ingredientName: 'Ulei', amount: 30, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Orez cu pui', servings: 4, prepTime: 15, cookTime: 30, totalWeight: 800,
    ingredients: [
      { ingredientName: 'Piept de pui', amount: 300, unit: 'grame', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      { ingredientName: 'Orez', amount: 200, unit: 'grame', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Morcov', amount: 100, unit: 'grame', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { ingredientName: 'Ulei', amount: 30, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Fasole bătută', servings: 4, prepTime: 15, cookTime: 90, totalWeight: 600,
    ingredients: [
      { ingredientName: 'Fasole boabă', amount: 400, unit: 'grame', calories: 127, protein: 9, carbs: 23, fat: 0.5 },
      { ingredientName: 'Usturoi', amount: 20, unit: 'grame', calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
      { ingredientName: 'Ulei', amount: 50, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
      { ingredientName: 'Ceapă', amount: 50, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
    ],
  },
  {
    name: 'Mâncare de mazăre', servings: 4, prepTime: 10, cookTime: 30, totalWeight: 700,
    ingredients: [
      { ingredientName: 'Mazăre', amount: 400, unit: 'grame', calories: 81, protein: 5.4, carbs: 14, fat: 0.4 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Morcov', amount: 100, unit: 'grame', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { ingredientName: 'Bulion', amount: 50, unit: 'grame', calories: 60, protein: 2, carbs: 12, fat: 0.5 },
      { ingredientName: 'Ulei', amount: 30, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Mâncare de dovlecei', servings: 4, prepTime: 10, cookTime: 25, totalWeight: 700,
    ingredients: [
      { ingredientName: 'Dovlecei', amount: 500, unit: 'grame', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Roșii', amount: 200, unit: 'grame', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
      { ingredientName: 'Usturoi', amount: 10, unit: 'grame', calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
      { ingredientName: 'Ulei', amount: 30, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Mâncare de vinete', servings: 4, prepTime: 15, cookTime: 40, totalWeight: 700,
    ingredients: [
      { ingredientName: 'Vinete', amount: 500, unit: 'grame', calories: 25, protein: 1, carbs: 6, fat: 0.2 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Roșii', amount: 200, unit: 'grame', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
      { ingredientName: 'Usturoi', amount: 10, unit: 'grame', calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
      { ingredientName: 'Ulei', amount: 40, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
  {
    name: 'Supă de pui cu gălușe', servings: 6, prepTime: 20, cookTime: 50, totalWeight: 1800,
    ingredients: [
      { ingredientName: 'Pui', amount: 400, unit: 'grame', calories: 239, protein: 27, carbs: 0, fat: 14 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Morcov', amount: 150, unit: 'grame', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { ingredientName: 'Făină', amount: 100, unit: 'grame', calories: 340, protein: 10, carbs: 73, fat: 1 },
      { ingredientName: 'Ou', amount: 100, unit: 'grame', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
      { ingredientName: 'Apă', amount: 1200, unit: 'ml', calories: 0, protein: 0, carbs: 0, fat: 0 },
    ],
  },
  {
    name: 'Supă cremă de roșii', servings: 4, prepTime: 15, cookTime: 30, totalWeight: 1000,
    ingredients: [
      { ingredientName: 'Roșii', amount: 600, unit: 'grame', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
      { ingredientName: 'Ceapă', amount: 100, unit: 'grame', calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
      { ingredientName: 'Usturoi', amount: 15, unit: 'grame', calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
      { ingredientName: 'Smântână', amount: 100, unit: 'grame', calories: 193, protein: 2.5, carbs: 3, fat: 19 },
      { ingredientName: 'Unt', amount: 30, unit: 'grame', calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
    ],
  },
  {
    name: 'Gogoși cu zahăr', servings: 10, prepTime: 30, cookTime: 20, totalWeight: 800,
    ingredients: [
      { ingredientName: 'Făină', amount: 400, unit: 'grame', calories: 340, protein: 10, carbs: 73, fat: 1 },
      { ingredientName: 'Lapte', amount: 200, unit: 'ml', calories: 42, protein: 3.4, carbs: 5, fat: 1 },
      { ingredientName: 'Ou', amount: 100, unit: 'grame', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
      { ingredientName: 'Zahăr', amount: 50, unit: 'grame', calories: 387, protein: 0, carbs: 100, fat: 0 },
      { ingredientName: 'Drojdie', amount: 20, unit: 'grame', calories: 105, protein: 10, carbs: 22, fat: 1 },
      { ingredientName: 'Ulei', amount: 200, unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
    ],
  },
];

async function seed() {
  console.log(`Seeding ${recipes.length} recipes...`);
  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();

  for (const recipe of recipes) {
    const nutrition = calcNutrition(recipe.ingredients, recipe.servings);
    const docRef = db.collection('user_recipes').doc();

    batch.set(docRef, {
      userId: 'seed_script',
      name: recipe.name,
      nameSearch: normalize(recipe.name),
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      totalWeight: recipe.totalWeight,
      ingredients: recipe.ingredients.map((ing) => ({
        ingredientId: 'seed',
        ingredientName: ing.ingredientName,
        amount: ing.amount,
        unit: ing.unit,
        calories: ing.calories,
        protein: ing.protein,
        carbs: ing.carbs,
        fat: ing.fat,
      })),
      ...nutrition,
      status: 'approved',
      isPublic: true,
      approvedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`  + ${recipe.name} (${nutrition.caloriesPerServing} kcal/porție)`);
  }

  await batch.commit();
  console.log(`\nDone! Inserted ${recipes.length} recipes.`);
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
