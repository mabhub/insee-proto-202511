// src/components/MapLegendChoropleth.jsx
// Légende superposée pour la carte choroplèthe (5 classes)
import { Paper, Typography, Box } from '@mui/material';
import { CHOROPLETH_COLORS, computeClassBreaks } from '../helpers/colorHelpers';

/**
 * Légende positionnée en bas à droite de la carte.
 * Affiche les 5 classes de couleur avec leurs seuils.
 *
 * Les seuils sont recalculés ici de la même façon que dans buildStepExpression,
 * pour que la légende soit cohérente avec les couleurs affichées sur la carte.
 *
 * @param {Object} props
 * @param {number} props.minValue - Valeur minimale observée
 * @param {number} props.maxValue - Valeur maximale observée
 * @param {string} [props.title='Part des 80 ans et plus (2022)'] - Titre affiché
 * @param {string} [props.unit='%'] - Unité affichée à côté de chaque seuil
 * @param {'linear'|'log'} [props.scale='linear'] - Échelle des classes
 */
const MapLegendChoropleth = ({
  minValue,
  maxValue,
  title = 'Part des 80 ans et plus (2022)',
  unit = '%',
  scale = 'linear',
}) => {
  if (minValue == null || maxValue == null) return null;

  // 6 bornes (5 classes) — même logique que buildStepExpression
  const breaks = computeClassBreaks({ min: minValue, max: maxValue }, scale);

  return (
    <Paper elevation={3} sx={{ position: 'absolute', top: 4, left: 4, p: 2, minWidth: 180, zIndex: 1 }}>
      <Typography variant="subtitle3" fontWeight="bold" gutterBottom>
      </Typography>
      {CHOROPLETH_COLORS.map((color, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: color, flexShrink: 0, border: '1px solid #ccc' }} />
          <Typography variant="caption">
            {breaks[i].toFixed(1)} {unit}{i < 4 ? ` – ${breaks[i + 1].toFixed(1)} ${unit}` : '+'}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
};

export default MapLegendChoropleth;
