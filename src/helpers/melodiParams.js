/**
 * Helpers de construction de requêtes Melodi.
 */
import { API_CONFIG } from '../config/api';

/**
 * Ajoute des paramètres de requête à une URL Melodi en dépliant les filtres
 * multi-valeurs : une valeur tableau est ajoutée plusieurs fois sous la même
 * clé (ex. AGE=[_T, Y_LT20] -> AGE=_T&AGE=Y_LT20), comme l'attend l'API.
 * Mute l'URL passée et la renvoie pour permettre le chaînage.
 * @param {URL} url - URL à compléter (mutée)
 * @param {Object} params - Paramètres (valeurs scalaires ou tableaux)
 * @returns {URL} La même URL, paramètres ajoutés
 */
export const appendMelodiParams = (url, params = {}) => {
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, v));
    else url.searchParams.append(key, value);
  });
  return url;
};

/**
 * Construit l'URL complète d'une requête data Melodi pour un jeu de données et
 * un ensemble de filtres (multi-valeurs dépliés via appendMelodiParams).
 * @param {string} datasetId - Identifiant du jeu de données
 * @param {Object} params - Filtres et paramètres de requête
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
