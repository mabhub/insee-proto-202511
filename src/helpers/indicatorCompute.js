// Generic indicator computation from Melodi observations.
//
// Given a list of normalized observations and an indicator formula, produces
// the lookup Map and stops (min/max) consumed by the choropleth layer/legend.

/**
 * Check whether an observation matches every dimension constraint of a clause.
 * @param {Object} obs - Normalized observation (flat dimension keys + OBS_VALUE)
 * @param {Object} clause - Dimension → value map (single value per dim for now)
 * @returns {boolean} True if the observation matches all dimension values
 */
const matchesClause = (obs, clause) =>
  Object.entries(clause).every(([dim, value]) => obs[dim] === value);

/**
 * Compute a ratio indicator (numerator / denominator * 100) grouped by GEO.
 * Returns one entry per GEO that has both a numerator and a non-zero denominator.
 * @param {Array<Object>} observations - Normalized observations
 * @param {{numerator: Object, denominator: Object}} formula - Ratio clauses
 * @returns {Map<string, {value: number, label: string}>} GEO → value (%)
 */
const computeRatio = (observations, formula) => {
  const numerators = new Map();
  const denominators = new Map();

  for (const obs of observations) {
    if (obs.OBS_VALUE == null) continue;
    if (matchesClause(obs, formula.numerator)) {
      numerators.set(obs.GEO, { value: obs.OBS_VALUE, label: obs.GEO_LIB });
    }
    if (matchesClause(obs, formula.denominator)) {
      denominators.set(obs.GEO, { value: obs.OBS_VALUE, label: obs.GEO_LIB });
    }
  }

  const lookup = new Map();
  for (const [geo, { value: denom, label }] of denominators) {
    const num = numerators.get(geo);
    if (num && denom > 0) {
      lookup.set(geo, {
        value: +((num.value / denom) * 100).toFixed(2),
        label,
      });
    }
  }
  return lookup;
};

const FORMULA_HANDLERS = {
  ratio: computeRatio,
};

/**
 * Compute an indicator from observations and a formula descriptor.
 * @param {Array<Object>} observations - Normalized observations (with GEO, GEO_LIB, OBS_VALUE)
 * @param {{type: string} & Object} formula - Formula descriptor (e.g. {type: 'ratio', ...})
 * @returns {{lookup: Map<string, {value: number, label: string}>, stops: {min: number, max: number} | null}}
 */
export const computeIndicator = (observations, formula) => {
  if (!observations?.length || !formula) {
    return { lookup: new Map(), stops: null };
  }
  const handler = FORMULA_HANDLERS[formula.type];
  if (!handler) {
    return { lookup: new Map(), stops: null };
  }
  const lookup = handler(observations, formula);
  if (!lookup.size) return { lookup, stops: null };

  const values = [...lookup.values()].map((d) => d.value);
  return {
    lookup,
    stops: { min: Math.min(...values), max: Math.max(...values) },
  };
};
