// src/components/BenchBars.jsx
// Barres comparatives JSON vs CSV pour une mesure de benchmark Melodi.
import { Box, Typography, Stack } from '@mui/material';

/**
 * Formate un nombre d'octets en Ko/Mo (locale fr).
 * @param {number} bytes
 * @returns {string}
 */
const formatBytes = (bytes) => {
  if (bytes >= 1_000_000) {
    return `${(bytes / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} Mo`;
  }
  return `${(bytes / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Ko`;
};

/**
 * Formate une durée en ms (locale fr).
 * @param {number} ms
 * @returns {string}
 */
const formatMs = (ms) => `${ms.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ms`;

// Couleurs sémantiques : JSON = format actuel (neutre), CSV = alternative (succès).
const JSON_COLOR = 'text.secondary';
const CSV_COLOR = 'success.main';

/**
 * Une barre horizontale proportionnelle, valeur chiffrée en bout.
 * @param {Object} props
 * @param {number} props.value - Valeur représentée
 * @param {number} props.max - Valeur maximale (échelle de la barre)
 * @param {string} props.color - Couleur de la barre (clé de palette MUI)
 * @param {(v: number) => string} props.format - Formateur de la valeur
 * @returns {React.ReactElement}
 */
const Bar = ({ value, max, color, format }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Box
      sx={{
        height: 18,
        width: `${(value / max) * 100}%`,
        minWidth: 2,
        bgcolor: color,
        borderRadius: 0.5,
        transition: 'width 0.3s',
      }}
    />
    <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
      {format(value)}
    </Typography>
  </Box>
);

/**
 * Une paire de barres horizontales (JSON puis CSV) pour une métrique, chaque
 * barre proportionnelle à la plus grande des deux valeurs.
 * @param {Object} props
 * @param {string} props.label - Nom de la métrique
 * @param {number} props.jsonValue - Valeur JSON
 * @param {number} props.csvValue - Valeur CSV
 * @param {(v: number) => string} props.format - Formateur de valeur
 * @returns {React.ReactElement}
 */
const MetricBars = ({ label, jsonValue, csvValue, format }) => {
  const max = Math.max(jsonValue, csvValue, 1);
  const ratio = csvValue > 0 ? jsonValue / csvValue : null;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        {ratio && ratio >= 1.05 && (
          <Typography variant="caption" color="success.main">
            CSV ×{ratio.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} moindre
          </Typography>
        )}
      </Box>
      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ width: 36, color: JSON_COLOR }}>JSON</Typography>
          <Box sx={{ flex: 1 }}><Bar value={jsonValue} max={max} color={JSON_COLOR} format={format} /></Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ width: 36, color: CSV_COLOR }}>CSV</Typography>
          <Box sx={{ flex: 1 }}><Bar value={csvValue} max={max} color={CSV_COLOR} format={format} /></Box>
        </Box>
      </Stack>
    </Box>
  );
};

/**
 * Bloc de barres comparatives pour une mesure complète (4 métriques).
 * @param {Object} props
 * @param {{networkMs: number, bytes: number, gzipBytes: number, parseMs: number, count: number}} props.json
 * @param {{networkMs: number, bytes: number, gzipBytes: number, parseMs: number, count: number}} props.csv
 * @returns {React.ReactElement}
 */
const BenchBars = ({ json, csv }) => (
  <Box>
    <MetricBars label="Temps de réponse" jsonValue={json.networkMs} csvValue={csv.networkMs} format={formatMs} />
    <MetricBars label="Taille brute" jsonValue={json.bytes} csvValue={csv.bytes} format={formatBytes} />
    <MetricBars label="Gzip (estimé)" jsonValue={json.gzipBytes} csvValue={csv.gzipBytes} format={formatBytes} />
    <MetricBars label="Parsing JS" jsonValue={json.parseMs} csvValue={csv.parseMs} format={formatMs} />
    <Typography variant="caption" color="text.secondary">
      {json.count.toLocaleString('fr-FR')} observations · temps de réponse sur 1 run (variable) ·
      gzip estimé via CompressionStream (peut différer du serveur)
    </Typography>
  </Box>
);

export default BenchBars;
export { formatBytes, formatMs };
