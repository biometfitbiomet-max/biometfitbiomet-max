/**
 * Translate exercises collection: adds EN fields only — never modifies existing.
 *
 *   OPENAI_API_KEY=sk-... node translate-exercises.js --dry-run   # preview only
 *   OPENAI_API_KEY=sk-... node translate-exercises.js             # write to Firestore
 *
 * Adds: descriptionEn, instructionsEn, musclesEn, musclesSecondaryEn
 */
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('Set OPENAI_API_KEY env var');
  process.exit(1);
}
const DRY_RUN = process.argv.includes('--dry-run');

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore();

async function translateBatch(items) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You translate gym/fitness exercise content from Romanian to English. ' +
            'Return ONLY valid JSON, same structure, same order, same array lengths. ' +
            'Keep anatomical terms accurate (e.g. "Deltoid anterior" -> "Anterior deltoid", ' +
            '"Ischiogambieri" -> "Hamstrings", "Dorsal" -> "Lats").',
        },
        {
          role: 'user',
          content:
            'Translate this JSON array of exercises. For each item translate ' +
            '"description"->"descriptionEn", "instructions"->"instructionsEn", ' +
            '"muscles"->"musclesEn", "musclesSecondary"->"musclesSecondaryEn". ' +
            'Return a JSON array of objects with ONLY the new EN fields.\n\n' +
            JSON.stringify(items),
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data).slice(0, 300));
  const text = data.choices[0].message.content;
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : parsed.exercises || Object.values(parsed)[0];
}

async function main() {
  const snap = await db.collection('exercises').orderBy('id').get();
  console.log(`Loaded ${snap.size} exercises`);

  const docs = snap.docs.map((d) => ({ ref: d.ref, data: d.data() }));

  // Skip docs that already have descriptionEn
  const todo = docs.filter((x) => !x.data.descriptionEn);
  console.log(`${todo.length} need translation, ${docs.length - todo.length} already done`);

  if (todo.length === 0) return;

  const items = todo.map((x) => ({
    description: x.data.description || '',
    instructions: x.data.instructions || [],
    muscles: x.data.muscles || [],
    musclesSecondary: x.data.musclesSecondary || [],
  }));

  const out = await translateBatch(items);
  if (!Array.isArray(out) || out.length !== items.length) {
    throw new Error(`Expected ${items.length} results, got ${out?.length}`);
  }

  for (let i = 0; i < todo.length; i++) {
    const en = out[i];
    const upd = {
      descriptionEn: en.descriptionEn || '',
      instructionsEn: Array.isArray(en.instructionsEn) ? en.instructionsEn : [],
      musclesEn: Array.isArray(en.musclesEn) ? en.musclesEn : [],
      musclesSecondaryEn: Array.isArray(en.musclesSecondaryEn) ? en.musclesSecondaryEn : [],
    };

    const ro = todo[i].data;
    console.log(`\n[${ro.id}] ${ro.nameRo} / ${ro.nameEn}`);
    console.log(`  desc: ${upd.descriptionEn.slice(0, 90)}...`);
    console.log(`  instr: ${upd.instructionsEn.length} steps | muscles: ${upd.musclesEn.join(', ')}`);

    // Sanity checks — never write empty/broken data
    if (!upd.descriptionEn) throw new Error(`[${ro.id}] empty descriptionEn`);
    if (ro.instructions?.length && upd.instructionsEn.length !== ro.instructions.length) {
      throw new Error(`[${ro.id}] instructions count mismatch ${upd.instructionsEn.length} != ${ro.instructions.length}`);
    }
    if (ro.muscles?.length && upd.musclesEn.length !== ro.muscles.length) {
      throw new Error(`[${ro.id}] muscles count mismatch`);
    }

    if (!DRY_RUN) {
      await todo[i].ref.update(upd);
    }
  }

  console.log(DRY_RUN ? '\nDRY RUN — nothing written' : '\nDONE — EN fields written');
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
