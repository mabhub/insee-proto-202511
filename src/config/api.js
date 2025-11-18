/**
 * Configuration de l'API Melodi
 */
export const API_CONFIG = {
  baseUrl: 'https://api.insee.fr/melodi',
  endpoints: {
    catalog: {
      all: '/catalog/all',
      byId: (id) => `/catalog/${id}`,
      ids: '/catalog/ids',
      dcat: '/catalog/dcat',
    },
    data: {
      byId: (id) => `/data/${id}`,
      toCsv: (id) => `/data/${id}/to-csv`,
      series: (idbanks) => `/data/series/${idbanks}`,
    },
    range: {
      byId: (id) => `/range/${id}`,
    },
  },
};
export const QUERY_KEYS = {
  catalog: {
    all: ['catalog', 'all'],
    byId: (id) => ['catalog', 'byId', id],
    ids: ['catalog', 'ids'],
  },
  data: {
    byId: (id, params) => ['data', 'byId', id, params],
    series: (idbanks) => ['data', 'series', idbanks],
  },
  range: {
    byId: (id) => ['range', 'byId', id],
  },
};
