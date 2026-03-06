// src/components/MapLegendChoropleth.jsx
// Légende superposée pour la carte choroplèthe (5 classes)
import { Paper, Typography, Box } from '@mui/material';
import { CHOROPLETH_COLORS } from '../helpers/colorHelpers';

/**
 * Légende positionnée en bas à droite de la carte.
 * Affiche les 5 classes de couleur avec leurs seuils en %.
 *
 * Les seuils sont recalculés ici de la même façon que dans buildStepExpression,
 * pour que la légende soit cohérente avec les couleurs affichées sur la carte.
 *
 * @param {number} minValue - Ratio minimal observé (en %)
 * @param {number} maxValue - Ratio maximal observé (en %)
 */
const MapLegendChoropleth = ({ minValue, maxValue }) => {
  if (minValue == null || maxValue == null) return null;

  // 5 classes d'égale amplitude — même logique que buildStepExpression
  const step = (maxValue - minValue) / 5;
  const breaks = Array.from({ length: 5 }, (_, i) => minValue + step * i);

  return (
    <Paper elevation={3} sx={{ position: 'absolute', top: 10, left: 10, p: 2, minWidth: 180, zIndex: 1 }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Part des 80 ans et plus (2022)
      </Typography>
      {CHOROPLETH_COLORS.map((color, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: color, flexShrink: 0, border: '1px solid #ccc' }} />
          <Typography variant="caption">
            {breaks[i].toFixed(1)} %{i < 4 ? ` – ${(breaks[i] + step).toFixed(1)} %` : '+'}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
};

export default MapLegendChoropleth;
