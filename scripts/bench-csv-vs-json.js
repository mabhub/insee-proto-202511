/**
 * Benchmark CSV (endpoint /to-csv) vs JSON pour l'API Melodi.
 *
 * Compare, pour chaque indicateur de src/config/indicators.json croisé avec
 * plusieurs niveaux géographiques :
 *   - la taille téléchargée (brute + gzip)
 *   - le temps de parsing + normalisation côté JS
 *
 * Objectif : décider si basculer le data-fetching de l'app sur le CSV (plus
 * léger) vaut le coût d'un parseur CSV maison, à confronter au parsing JSON
 * natif (cf. note projet « CSV pour des téléchargements plus légers ? À
 * confronter aux temps de parsing »).
 *
 * Usage (via vite-node, pour partager le helper d'URL de l'app dont les imports
 * sont sans extension) :
 *   npm run bench:csv
 *   npm run bench:csv -- --levels COM,DEP --runs 30
 *
 * Dépendances : fetch natif Node 18+, gzip via node:zlib, et buildDataUrl
 * partagé avec le service de données de l'app (src/helpers/melodiParams).
 */
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { buildDataUrl } from '../src/helpers/melodiParams';
import { parseJson, parseCsv } from '../src/helpers/benchMelodi';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- Arguments CLI -------------------------------------------------------

const argv = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};
// COM est plafonné par défaut à 10k : on lève le cap comme le fait l'app.
const LEVELS = getArg('levels', 'COM,EPCI,DEP').split(',').map((s) => s.trim());
const RUNS = Number(getArg('runs', '20'));
const COM_MAX_RESULT = 100000;

// ---- Outils de mesure ----------------------------------------------------

const ms = (ns) => Number(ns) / 1e6;
const fmtBytes = (b) =>
  b >= 1_000_000 ? `${(b / 1_000_000).toFixed(2)} Mo` : `${(b / 1000).toFixed(1)} Ko`;

// Parsing/normalisation : parseJson/parseCsv sont partagés avec la page React
// (src/helpers/benchMelodi). La mesure réseau ci-dessous reste spécifique au
// CLI (node:zlib + Buffer + process.hrtime).

// ---- Mesure d'un format pour une requête ---------------------------------

/**
 * Télécharge une requête (JSON ou CSV), mesure taille brute + gzip et le
 * temps moyen de parsing+normalisation sur RUNS itérations.
 * @param {string} datasetId
 * @param {Object} params
 * @param {boolean} csv
 * @returns {Promise<{ok: boolean, status: number, bytes: number, gzip: number,
 *   parseMs: number, count: number, error?: string}>}
 */
const measure = async (datasetId, params, csv) => {
  const url = buildDataUrl(datasetId, params, { csv });
  try {
    const res = await fetch(url, csv ? {} : { headers: { Accept: 'application/json' } });
    const text = await res.text();
    if (!res.ok) return { ok: false, status: res.status, bytes: text.length, gzip: 0, parseMs: 0, count: 0, error: text.slice(0, 120) };
    const bytes = Buffer.byteLength(text, 'utf8');
    const gzip = gzipSync(text).length;
    const parse = csv ? parseCsv : parseJson;
    parse(text); // warmup
    let total = 0n;
    let count = 0;
    for (let i = 0; i < RUNS; i++) {
      const start = process.hrtime.bigint();
      const rows = parse(text);
      total += process.hrtime.bigint() - start;
      count = rows.length;
    }
    return { ok: true, status: res.status, bytes, gzip, parseMs: ms(total) / RUNS, count };
  } catch (err) {
    return { ok: false, status: 0, bytes: 0, gzip: 0, parseMs: 0, count: 0, error: err.message };
  }
};

// ---- Boucle principale ---------------------------------------------------

const main = async () => {
  const indicatorsPath = resolve(__dirname, '../src/config/indicators.json');
  const indicators = JSON.parse(await readFile(indicatorsPath, 'utf8'));

  console.log(`Benchmark CSV vs JSON — ${indicators.length} indicateurs × [${LEVELS.join(', ')}], ${RUNS} runs de parsing\n`);

  const rows = [];
  for (const ind of indicators) {
    for (const level of LEVELS) {
      const params = { ...ind.filter, GEO: level };
      if (level === 'COM') params.maxResult = COM_MAX_RESULT;

      const [json, csv] = await Promise.all([
        measure(ind.datasetId, params, false),
        measure(ind.datasetId, params, true),
      ]);

      const label = `${ind.id.slice(0, 28).padEnd(28)} ${level.padEnd(4)}`;
      if (!json.ok || !csv.ok) {
        console.log(`✗ ${label}  JSON=${json.status} CSV=${csv.status}  ${json.error || csv.error || ''}`);
        rows.push({ label, ...{ json, csv } });
        continue;
      }
      const sizeRatio = (json.bytes / csv.bytes).toFixed(1);
      const gzipRatio = (json.gzip / csv.gzip).toFixed(2);
      const parseRatio = (json.parseMs / csv.parseMs).toFixed(2);
      console.log(
        `✓ ${label}  ` +
        `obs=${String(json.count).padStart(6)}  ` +
        `brut J=${fmtBytes(json.bytes).padStart(8)} C=${fmtBytes(csv.bytes).padStart(8)} (×${sizeRatio})  ` +
        `gzip J=${fmtBytes(json.gzip).padStart(7)} C=${fmtBytes(csv.gzip).padStart(7)} (×${gzipRatio})  ` +
        `parse J=${json.parseMs.toFixed(1)}ms C=${csv.parseMs.toFixed(1)}ms (×${parseRatio})`,
      );
      rows.push({ label, json, csv });
    }
  }

  // Synthèse globale (sommes sur les requêtes réussies)
  const ok = rows.filter((r) => r.json?.ok && r.csv?.ok);
  if (ok.length) {
    const sum = (sel) => ok.reduce((a, r) => a + sel(r), 0);
    const jBrut = sum((r) => r.json.bytes), cBrut = sum((r) => r.csv.bytes);
    const jGz = sum((r) => r.json.gzip), cGz = sum((r) => r.csv.gzip);
    const jP = sum((r) => r.json.parseMs), cP = sum((r) => r.csv.parseMs);
    console.log('\n── Synthèse (cumul sur les requêtes OK) ──');
    console.log(`Brut   : JSON ${fmtBytes(jBrut)}  vs  CSV ${fmtBytes(cBrut)}   → CSV ×${(jBrut / cBrut).toFixed(1)} plus léger`);
    console.log(`Gzip   : JSON ${fmtBytes(jGz)}  vs  CSV ${fmtBytes(cGz)}   → CSV ×${(jGz / cGz).toFixed(2)} plus léger`);
    console.log(`Parse  : JSON ${jP.toFixed(0)}ms  vs  CSV ${cP.toFixed(0)}ms   → CSV ×${(jP / cP).toFixed(2)} plus rapide`);
    console.log('\nNote : en prod le transfert réseau est gzippé (Content-Encoding), donc');
    console.log('le ratio gzip reflète le gain de bande passante réel ; le ratio brut');
    console.log('reflète la mémoire et le coût de décompression côté client.');
  }
};

main().catch((err) => {
  console.error('Échec du benchmark :', err);
  process.exit(1);
});
