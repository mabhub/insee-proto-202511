/**
 * Helpers de construction de requêtes Melodi.
 */
import { API_CONFIG } from '../config/api';

/**
 * Normalise un filtre d'indicateur en objet de paramètres (valeurs scalaires ou
 * tableaux), quel que soit son format en configuration :
 *   - objet : `{ SEX: '_T', AGE: ['_T', 'Y_LT20'] }` → renvoyé tel quel ;
 *   - chaîne query param : `'SEX=_T&AGE=_T&AGE=Y_LT20'` → parsée, les clés
 *     répétées étant regroupées en tableau (`{ SEX: '_T', AGE: ['_T', 'Y_LT20'] }`).
 * Permet de déclarer les filtres dans indicators.json sous l'une ou l'autre
 * forme sans changer le code consommateur.
 * @param {Object|string} filter - Filtre objet ou chaîne query param
 * @returns {Object} Paramètres normalisés (valeurs scalaires ou tableaux)
 */
export const normalizeFilter = (filter = {}) => {
  if (typeof filter !== 'string') return filter;
  const params = {};
  // Un '?' ou '&' de tête éventuel est ignoré par URLSearchParams.
  for (const [key, value] of new URLSearchParams(filter)) {
    if (key in params) params[key] = [].concat(params[key], value);
    else params[key] = value;
  }
  return params;
};

/**
 * Ajoute des paramètres de requête à une URL Melodi en dépliant les filtres
 * multi-valeurs : une valeur tableau est ajoutée plusieurs fois sous la même
 * clé (ex. AGE=[_T, Y_LT20] -> AGE=_T&AGE=Y_LT20), comme l'attend l'API.
 * Accepte aussi une chaîne query param (normalisée via normalizeFilter).
 * Mute l'URL passée et la renvoie pour permettre le chaînage.
 * @param {URL} url - URL à compléter (mutée)
 * @param {Object|string} params - Paramètres (objet ou chaîne query param)
 * @returns {URL} La même URL, paramètres ajoutés
 */
export const appendMelodiParams = (url, params = {}) => {
  Object.entries(normalizeFilter(params)).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, v));
    else url.searchParams.append(key, value);
  });
  return url;
};

/**
 * Construit l'URL complète d'une requête data Melodi pour un jeu de données et
 * un ensemble de filtres (multi-valeurs dépliés via appendMelodiParams).
 * @param {string} datasetId - Identifiant du jeu de données
 * @param {Object|string} params - Filtres et paramètres (objet ou chaîne query param)
 * @param {Object} [options]
 * @param {boolean} [options.csv=false] - Cible l'endpoint /to-csv au lieu du JSON
 * @returns {string} URL complète
 */
export const buildDataUrl = (datasetId, params = {}, { csv = false } = {}) => {
  const path = csv
    ? API_CONFIG.endpoints.data.toCsv(datasetId)
    : API_CONFIG.endpoints.data.byId(datasetId);
  return appendMelodiParams(new URL(`${API_CONFIG.baseUrl}${path}`), params).toString();
};
