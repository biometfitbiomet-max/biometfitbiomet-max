/**
 * Translate /ingredients name (RO) → nameEn (EN) via OpenAI gpt-4o-mini.
 * Adds nameEn + nameSearchEn to each document.
 * Skips documents that already have nameEn.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node translate-ingredients.js
 *   OPENAI_API_KEY=sk-... node translate-ingredients.js --dry-run    # no writes
 *   OPENAI_API_KEY=sk-... node translate-ingredients.js --limit=500  # only first 500
 */
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('❌ Set OPENAI_API_KEY env var');
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

const db = admin.firestore();

const BATCH_SIZE = 100;
const CONCURRENCY = 3; // parallel OpenAI requests
const MODEL = 'gpt-4o-mini';
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = parseInt((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || '0');

function normaliseEn(text) {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/\s+/g, ' ');
}

async function translateBatch(names) {
  const system = [
    'You are a food translator. Translate Romanian food names to English.',
    'Rules:',
    '- Keep brand names unchanged (Lidl, Coca-Cola, Nutella, Doncafe, etc.)',
    '- Use natural English food terminology (e.g. "pui fiert" → "Boiled chicken")',
    '- For Romanian-specific items, use descriptive English (e.g. "mici" → "Romanian skinless sausages", "saramură" → "Brine-cured fish")',
    '- Keep it concise — just the food name, no explanations',
    '- If already English or a brand, keep as-is',
    '- Return ONLY a JSON array of strings, same length and order as input',
  ].join('\n');

  const user = JSON.stringify(names);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
      max_tokens: 8000,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI ${res.status}: ${txt}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim() || '';

  // Strip markdown code fences if present
  const cleaned = content.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected array, got ${typeof parsed}`);
  }

  // If count matches, return as-is
  if (parsed.length === names.length) {
    return parsed.map((s) => String(s).trim());
  }

  // If count is wrong, try splitting the batch in half and translating each half
  if (names.length > 10) {
    const mid = Math.floor(names.length / 2);
    const left = await translateBatch(names.slice(0, mid));
    const right = await translateBatch(names.slice(mid));
    return [...left, ...right];
  }

  // For very small batches with wrong count, pad with originals
  console.warn(`  ⚠️ Small batch mismatch: expected ${names.length}, got ${parsed.length} — padding with originals`);
  const result = [...parsed.map((s) => String(s).trim())];
  while (result.length < names.length) {
    result.push(names[result.length]);
  }
  return result.slice(0, names.length);
}

async function fetchPending() {
  console.log('🔍 Fetching all ingredients...');
  const snapshot = await db.collection('ingredients').get();
  console.log(`📦 Total: ${snapshot.size}`);

  const pending = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    const name = data.name;
    const nameEn = data.nameEn;
    if (!name || typeof name !== 'string' || name.trim() === '') return;
    if (nameEn && typeof nameEn === 'string' && nameEn.trim() !== '') return; // already translated
    pending.push({ id: doc.id, name });
  });

  console.log(`✅ Already translated: ${snapshot.size - pending.length}`);
  console.log(`⏳ Pending translation: ${pending.length}`);

  if (LIMIT > 0) {
    console.log(`🔒 Limit: ${LIMIT} (dry-run mode for testing)`);
    return pending.slice(0, LIMIT);
  }

  return pending;
}

async function processBatch(batch, batchIdx, totalBatches) {
  const names = batch.map((b) => b.name);

  let translations;
  let attempt = 0;
  while (attempt < 3) {
    try {
      translations = await translateBatch(names);
      break;
    } catch (err) {
      attempt++;
      console.error(`  ⚠️ Batch ${batchIdx} attempt ${attempt} failed: ${err.message}`);
      if (attempt >= 3) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }

  if (DRY_RUN) {
    // Log first 5 for inspection
    batch.slice(0, 5).forEach((b, i) => {
      console.log(`  ${b.name} → ${translations[i]}`);
    });
    return;
  }

  // Write back to Firestore
  const batchWrite = db.batch();
  batch.forEach((item, i) => {
    const nameEn = translations[i];
    const nameSearchEn = normaliseEn(nameEn);
    const ref = db.collection('ingredients').doc(item.id);
    batchWrite.update(ref, { nameEn, nameSearchEn });
  });
  await batchWrite.commit();
}

async function main() {
  console.log(`🚀 Translation script — model: ${MODEL}, dry-run: ${DRY_RUN}, batch: ${BATCH_SIZE}`);
  console.log('---');

  const pending = await fetchPending();
  if (pending.length === 0) {
    console.log('✅ Nothing to translate — all done.');
    process.exit(0);
  }

  const totalBatches = Math.ceil(pending.length / BATCH_SIZE);
  console.log(`📦 Batches: ${totalBatches}`);
  console.log('---');

  const startTime = Date.now();
  let processed = 0;

  for (let i = 0; i < pending.length; i += BATCH_SIZE * CONCURRENCY) {
    // Process CONCURRENCY batches in parallel
    const chunkPromises = [];
    for (let c = 0; c < CONCURRENCY; c++) {
      const startIdx = i + c * BATCH_SIZE;
      if (startIdx >= pending.length) break;
      const batch = pending.slice(startIdx, startIdx + BATCH_SIZE);
      const batchIdx = Math.floor(startIdx / BATCH_SIZE) + 1;
      chunkPromises.push(
        processBatch(batch, batchIdx, totalBatches).then(() => {
          processed += batch.length;
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(
            `✓ Batch ${batchIdx}/${totalBatches} — ${processed}/${pending.length} (${elapsed}s)`
          );
        })
      );
    }
    await Promise.all(chunkPromises);
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('---');
  console.log(`✅ Done — ${pending.length} ingredients in ${totalElapsed}s`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
