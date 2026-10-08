import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getDb, getStorage } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

function toMillis(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && 'toMillis' in (v as object)) {
    return (v as { toMillis: () => number }).toMillis();
  }
  return null;
}

/** Extrage path-ul Storage dintr-un URL salvat în doc (download URL sau path brut). */
function extractStoragePath(url: string, bucketName: string): string | null {
  if (!url) return null;
  if (url.startsWith('gs://')) {
    return url.replace(`gs://${bucketName}/`, '');
  }
  // https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?...
  const m = url.match(/\/o\/([^?]+)/);
  if (m) return decodeURIComponent(m[1]);
  // https://storage.googleapis.com/{bucket}/{path}
  const m2 = url.match(new RegExp(`storage\\.googleapis\\.com/${bucketName}/(.+)$`));
  if (m2) return m2[1].split('?')[0];
  return null;
}

async function signedUrls(urls: (string | null)[]): Promise<(string | null)[]> {
  const bucket = getStorage().bucket();
  return Promise.all(
    urls.map(async (u) => {
      if (!u) return null;
      const path = extractStoragePath(u, bucket.name);
      if (!path) return u; // deja URL public sau necunoscut — returnăm așa
      try {
        const [signed] = await bucket.file(path).getSignedUrl({
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000, // 1h
        });
        return signed;
      } catch {
        return null;
      }
    })
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const auth = getAuth();
    const db = getDb();

    const userRef = db.collection('users').doc(uid);

    const [
      userRecord,
      profileSnap,
      plansSnap,
      diarySnap,
      weightSnap,
      measurementsSnap,
      sessionsSnap,
      routinesSnap,
      photosSnap,
      analysesSnap,
      trackingSnap,
      calorieTargetsSnap,
      coachLinksSnap,
      friendsSnap,
      ingredientsSnap,
      recipesSnap,
    ] = await Promise.all([
      auth.getUser(uid).catch(() => null),
      userRef.collection('settings').doc('profile').get(),
      userRef.collection('nutrition_plans').orderBy('creationDate', 'desc').get(),
      userRef.collection('nutrition_diary').orderBy('datetime', 'desc').limit(300).get(),
      userRef.collection('body_weight').orderBy('date', 'desc').get(),
      userRef.collection('body_measurements').orderBy('date', 'desc').get(),
      userRef.collection('workout_sessions').orderBy('date', 'desc').limit(100).get(),
      userRef.collection('routines').get(),
      userRef.collection('progress_photos').orderBy('date', 'desc').get(),
      userRef.collection('medical_analyses').orderBy('createdAt', 'desc').get(),
      userRef.collection('daily_tracking').orderBy('timestamp', 'desc').limit(30).get(),
      userRef.collection('calorie_targets').orderBy('date', 'desc').get(),
      userRef.collection('coach_links').get(),
      userRef.collection('friends').get(),
      db.collection('user_ingredients').where('createdBy', '==', uid).get(),
      db.collection('user_recipes').where('createdBy', '==', uid).get(),
    ]);

    // Planuri + mesele fiecărui plan
    const plans = await Promise.all(
      plansSnap.docs.map(async (d) => {
        const data = d.data();
        const mealsSnap = await d.ref.collection('meals').orderBy('order').get();
        return {
          id: d.id,
          description: data.description ?? '',
          creationDate: toMillis(data.creationDate),
          startDate: data.startDate ?? null,
          endDate: data.endDate ?? null,
          goalEnergy: data.goalEnergy ?? null,
          goalProtein: data.goalProtein ?? null,
          goalCarbohydrates: data.goalCarbohydrates ?? null,
          goalFat: data.goalFat ?? null,
          goalFiber: data.goalFiber ?? null,
          onlyLogging: data.onlyLogging ?? false,
          meals: mealsSnap.docs.map((m) => ({
            id: m.id,
            name: m.data().name ?? '',
            mealType: m.data().mealType ?? '',
            time: m.data().time ?? '',
          })),
        };
      })
    );

    // Rutine + zile + exerciții
    const routines = await Promise.all(
      routinesSnap.docs.map(async (d) => {
        const data = d.data();
        const daysSnap = await d.ref.collection('days').orderBy('order').get();
        const days = await Promise.all(
          daysSnap.docs.map(async (dayDoc) => {
            const exSnap = await dayDoc.ref.collection('exercises').orderBy('order').get();
            return {
              id: dayDoc.id,
              name: dayDoc.data().name ?? '',
              exercises: exSnap.docs.map((e) => {
                const ed = e.data();
                return {
                  id: e.id,
                  nameRo: ed.nameRo ?? '',
                  nameEn: ed.nameEn ?? '',
                  sets: ed.sets ?? '',
                  reps: ed.reps ?? '',
                };
              }),
            };
          })
        );
        return {
          id: d.id,
          name: data.name ?? '',
          description: data.description ?? '',
          startDate: toMillis(data.startDate),
          endDate: toMillis(data.endDate),
          frequency: data.frequency ?? '',
          goal: data.goal ?? '',
          days,
        };
      })
    );

    // Signed URLs pentru imagini (Storage e privat — auth-only)
    const photoUrls = await signedUrls(photosSnap.docs.map((d) => d.data().storageUrl ?? null));
    const analysisUrls = await signedUrls(analysesSnap.docs.map((d) => d.data().imageUrl ?? null));
    const diaryPhotoUrls = await signedUrls(diarySnap.docs.map((d) => d.data().photoUrl ?? null));

    const profileData = profileSnap.exists ? profileSnap.data() : null;

    return NextResponse.json({
      user: userRecord
        ? {
            uid: userRecord.uid,
            email: userRecord.email ?? '',
            displayName: userRecord.displayName ?? null,
            photoURL: userRecord.photoURL ?? null,
            emailVerified: userRecord.emailVerified,
            disabled: userRecord.disabled,
            createdAt: userRecord.metadata.creationTime ?? null,
            lastSignIn: userRecord.metadata.lastSignInTime ?? null,
            providers: userRecord.providerData.map((p) => p.providerId),
          }
        : null,
      profile: profileData
        ? {
            goal: profileData?.goal ?? null,
            gender: profileData?.gender ?? null,
            age: profileData?.age ?? null,
            heightCm: profileData?.heightCm ?? null,
            currentWeightKg: profileData?.currentWeightKg ?? null,
            targetWeightKg: profileData?.targetWeightKg ?? null,
            activityLevel: profileData?.activityLevel ?? null,
            waterGoalMl: profileData?.waterGoalMl ?? null,
            isOnboardingCompleted: profileData?.isOnboardingCompleted ?? false,
            avatarUrl: profileData?.avatarUrl ?? null,
          }
        : null,
      plans,
      routines,
      diary: diarySnap.docs.map((d, i) => {
        const data = d.data();
        return {
          id: d.id,
          date: data.date ?? '',
          datetime: toMillis(data.datetime),
          mealType: data.mealType ?? null,
          ingredientName: data.ingredientName ?? '',
          recipeName: data.recipeName ?? null,
          amount: data.amount ?? 0,
          energy: data.energy ?? 0,
          protein: data.protein ?? 0,
          carbohydrates: data.carbohydrates ?? 0,
          fat: data.fat ?? 0,
          photoUrl: diaryPhotoUrls[i] ?? null,
        };
      }),
      weightEntries: weightSnap.docs.map((d) => {
        const data = d.data();
        return { id: d.id, weight: data.weight ?? 0, date: toMillis(data.date), dateKey: data.dateKey ?? '' };
      }),
      measurements: measurementsSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          date: toMillis(data.date),
          weight: data.weight ?? null,
          bodyFatPercentage: data.bodyFatPercentage ?? null,
          chest: data.chest ?? null,
          waist: data.waist ?? null,
          hip: data.hip ?? null,
          arm: data.arm ?? null,
          thigh: data.thigh ?? null,
        };
      }),
      workoutSessions: sessionsSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          routineId: data.routineId ?? '',
          dayId: data.dayId ?? '',
          date: toMillis(data.date),
          completedAt: toMillis(data.completedAt),
          exercises: Array.isArray(data.exercises) ? data.exercises.length : 0,
          caloriesBurned: data.caloriesBurned ?? null,
          durationSeconds: data.durationSeconds ?? null,
        };
      }),
      progressPhotos: photosSnap.docs.map((d, i) => {
        const data = d.data();
        return {
          id: d.id,
          date: toMillis(data.date),
          url: photoUrls[i],
          note: data.note ?? null,
          photoType: data.photoType ?? 0,
        };
      }),
      medicalAnalyses: analysesSnap.docs.map((d, i) => {
        const data = d.data();
        return {
          id: d.id,
          createdAt: toMillis(data.createdAt),
          url: analysisUrls[i],
          resultRaw: data.resultRaw ?? '',
        };
      }),
      dailyTracking: trackingSnap.docs.map((d) => {
        const data = d.data();
        return {
          dateKey: d.id,
          waterCups: data.water_cups ?? null,
          supplements: data.supplements ?? null,
          consumedSupplements: Array.isArray(data.consumed_supplements) ? data.consumed_supplements : null,
          timestamp: toMillis(data.timestamp),
        };
      }),
      calorieTargets: calorieTargetsSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          date: toMillis(data.date),
          validUntil: toMillis(data.validUntil),
          calorieAmount: data.calorieAmount ?? 0,
          proteinAmount: data.proteinAmount ?? 0,
          carbohydrateAmount: data.carbohydrateAmount ?? 0,
          fatAmount: data.fatAmount ?? 0,
        };
      }),
      coachLinks: coachLinksSnap.docs.map((d) => ({
        coachUid: d.data().coachUid ?? d.id,
        coachEmail: d.data().coachEmail ?? '',
        coachDisplayName: d.data().coachDisplayName ?? null,
        status: d.data().status ?? '',
        linkedAt: toMillis(d.data().linkedAt),
      })),
      friends: friendsSnap.docs.map((d) => {
        const data = d.data();
        return {
          friendUid: data.friendUid ?? d.id,
          friendEmail: data.friendEmail ?? data.email ?? '',
          friendDisplayName: data.friendDisplayName ?? data.displayName ?? null,
        };
      }),
      userIngredients: ingredientsSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name ?? '',
          status: data.status ?? '',
          createdAt: toMillis(data.createdAt),
        };
      }),
      userRecipes: recipesSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name ?? '',
          status: data.status ?? '',
          createdAt: toMillis(data.createdAt),
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching user overview:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}
