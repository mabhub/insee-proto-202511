/**
 * Helper functions for dataset data manipulation
 */

/**
 * Get indicator title
 * @param {Object} dataset - Dataset object
 * @returns {string} Dataset title
 */
export const getIndicatorTitle = (indicator) => {
  if (!indicator) return '';
  return indicator.title || indicator.identifier || 'Sans titre';
};
