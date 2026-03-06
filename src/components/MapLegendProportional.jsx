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
    sx={{ position: 'absolute', bottom: 40, right: 16, p: 2, minWidth: 160, zIndex: 1 }}
  >
    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
      Population 2022
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 1 }}>
      <svg width="80" height="60" style={{ overflow: 'visible' }}>
        <circle cx="50" cy="45" r="4" fill="#268DFF" opacity={0.7} stroke="#fff" strokeWidth={1} />
        <circle cx="50" cy="30" r="20" fill="#268DFF" opacity={0.7} stroke="#fff" strokeWidth={1} />
        <text x="0" y="60" fontSize="10" fill="currentColor">
          Min. : {minValue?.toLocaleString('fr-FR')} - Max. : {maxValue?.toLocaleString('fr-FR')}
        </text>
      </svg>
    </Box>
    <Typography variant="caption" color="text.secondary">
      
    </Typography>
    {territoryCount > 0 && (
      <Typography variant="caption" display="block" color="text.secondary">
        {territoryCount} départements
      </Typography>
    )}
  </Paper>
);

export default MapLegendProportional;
