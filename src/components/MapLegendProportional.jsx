// src/components/MapLegendProportional.jsx
// Légende superposée pour la carte à ronds proportionnels
import { Paper, Typography, Box } from '@mui/material';

/**
 * Légende positionnée en bas à droite de la carte.
 * Affiche deux cercles SVG (min et max) avec les valeurs correspondantes.
 *
 * @param {number} minValue - Population minimale (dép. le moins peuplé)
 * @param {number} maxValue - Population maximale (dép. le plus peuplé)
 * @param {number} territoryCount - Nombre de départements chargés
 */
const MapLegendProportional = ({ minValue, maxValue, territoryCount }) => (
  <Paper
    elevation={3}
    sx={{ position: 'absolute', bottom: 32, right: 16, p: 2, minWidth: 160, zIndex: 1 }}
  >
    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>  
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 1 }}>
      <svg width="80" height="60" style={{ overflow: 'visible' }}>
        <circle cx="12" cy="50" r="4" fill="#3B89E0" opacity={0.75} stroke="#fff" strokeWidth={1} />
        <circle cx="50" cy="30" r="20" fill="#3B89E0" opacity={0.75} stroke="#fff" strokeWidth={1} />
        <text x="12" y="58" textAnchor="middle" fontSize="8" fill="currentColor">min</text>
        <text x="50" y="58" textAnchor="middle" fontSize="8" fill="currentColor">max</text>
      </svg>
    </Box>
    <Typography variant="caption" color="text.secondary">
      {minValue?.toLocaleString('fr-FR')} — {maxValue?.toLocaleString('fr-FR')} hab.
    </Typography>
    {territoryCount > 0 && (
      <Typography variant="caption" display="block" color="text.secondary">
        {territoryCount} départements
      </Typography>
    )}
  </Paper>
);

export default MapLegendProportional;
