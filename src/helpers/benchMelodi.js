/**
 * Logique de benchmark CSV vs JSON pour l'API Melodi, partagée entre la page
 * React (src/components/MelodiBenchmark.jsx) et le script CLI
 * (scripts/bench-csv-vs-json.js).
 *
 * Les fonctions de parsing (parseJson/parseCsv) sont communes ; la mesure
 * réseau diffère : le script CLI utilise node:zlib/Buffer, la page utilise les
 * API web (stream + CompressionStream). measureFormat ci-dessous est la version
 * navigateur.
 */
import { buildDataUrl } from './melodiParams';

/**
 * Parse + normalise une réponse JSON Melodi vers une liste d'observations
 * plates (même cible que normalizeResponse de dataHelpers).
 * @param {string} text - Corps JSON brut
 * @returns {Array<Object>} Observations normalisées
 */
export const parseJson = (text) => {
  const json = JSON.parse(text);
  return (json.observations ?? []).map((obs) => {
    const geoFull = obs.dimensions?.GEO ?? '';
    const parts = geoFull.split('-');
    let geo, geoObject;
    if (parts.length === 3) [, geoObject, geo] = parts;
    else if (parts.length === 2) [geoObject, geo] = parts;
    else { geoObject = ''; geo = geoFull; }
    return {
      ...obs.dimensions,
      GEO_OBJECT: geoObject,
      GEO: geo,
      GEO_FULL: geoFull,
      OBS_VALUE: obs.measures?.OBS_VALUE_NIVEAU?.value ?? null,
    };
  });
};

/**
 * Parse + normalise une réponse CSV Melodi (séparateur ;, valeurs chaîne entre
 * guillemets) vers la même forme plate que parseJson. Parseur minimal : les
 * valeurs Melodi ne contiennent ni ; ni " échappé.
 * @param {string} text - Corps CSV brut
 * @returns {Array<Object>} Observations normalisées
 */
export const parseCsv = (text) => {
  const lines = text.split('\n');
  const header = lines[0].replace(/^﻿/, '').split(';').map((h) => h.replace(/^"|"$/g, ''));
  const unquote = (s) => (s.charCodeAt(0) === 34 ? s.slice(1, -1) : s);
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cells = line.split(';');
    const row = {};
    for (let c = 0; c < header.length; c++) row[header[c]] = unquote(cells[c] ?? '');
    row.OBS_VALUE = row.OBS_VALUE === '' ? null : Number(row.OBS_VALUE);
    out.push(row);
  }
  return out;
};

/**
 * Estime la taille gzip d'un texte via l'API CompressionStream du navigateur.
 * À comparer avec prudence au gzip serveur (niveau de compression différent).
 * @param {string} text - Texte à compresser
 * @returns {Promise<number>} Taille gzip estimée en octets
 */
const estimateGzipBytes = async (text) => {
  if (typeof CompressionStream === 'undefined') return 0;
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  const buffer = await new Response(stream).arrayBuffer();
  return buffer.byteLength;
};

/**
 * Télécharge une requête (JSON ou CSV) et mesure : temps de réponse réseau
 * (fetch + lecture du corps), taille brute (octets reçus), gzip estimé, et
 * temps moyen de parsing+normalisation sur `runs` itérations.
 * Ne lève jamais : toute erreur est rapportée dans le résultat.
 *
 * @param {string} datasetId - Identifiant du jeu de données
 * @param {Object} params - Filtres et paramètres de requête
 * @param {Object} [options]
 * @param {boolean} [options.csv=false] - Cible l'endpoint /to-csv
 * @param {number} [options.runs=10] - Nombre d'itérations de parsing mesurées
 * @param {number} [options.timeoutMs=20000] - Timeout par requête
 * @param {AbortSignal} [options.signal] - Signal d'annulation externe (démontage)
 * @returns {Promise<{ok: boolean, httpStatus: number, networkMs: number,
 *   bytes: number, gzipBytes: number, parseMs: number, count: number,
 *   error: string}>}
 */
export const measureFormat = async (
  datasetId,
  params,
  { csv = false, runs = 10, timeoutMs = 20000, signal } = {},
) => {
  const url = buildDataUrl(datasetId, params, { csv });
  const empty = { networkMs: 0, bytes: 0, gzipBytes: 0, parseMs: 0, count: 0 };
  // Combine l'annulation externe (démontage de la page) et le timeout requête.
  const timeout = AbortSignal.timeout(timeoutMs);
  const reqSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    // Temps réseau = envoi requête + réception complète du corps (un seul run :
    // soumis au cache HTTP et à la variance réseau, c'est un ordre de grandeur).
    const networkStart = performance.now();
    const res = await fetch(url, {
      headers: csv ? {} : { Accept: 'application/json' },
      signal: reqSignal,
    });
    const text = await res.text();
    const networkMs = performance.now() - networkStart;
    if (!res.ok) {
      return { ok: false, httpStatus: res.status, ...empty, error: text.slice(0, 160) };
    }
    const bytes = new TextEncoder().encode(text).length;
    const gzipBytes = await estimateGzipBytes(text);
    const parse = csv ? parseCsv : parseJson;
    parse(text); // warmup (JIT)
    let total = 0;
    let count = 0;
    for (let i = 0; i < runs; i++) {
      const start = performance.now();
      count = parse(text).length;
      total += performance.now() - start;
    }
    return {
      ok: true,
      httpStatus: res.status,
      networkMs,
      bytes,
      gzipBytes,
      parseMs: total / runs,
      count,
      error: '',
    };
  } catch (err) {
    const error =
      err.name === 'TimeoutError'
        ? 'Délai dépassé'
        : err.name === 'AbortError'
          ? 'Annulé'
          : err.message;
    return { ok: false, httpStatus: 0, ...empty, error };
  }
};
