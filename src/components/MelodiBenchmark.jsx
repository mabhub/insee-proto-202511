// src/components/MelodiBenchmark.jsx
// Page de démonstration : compare le poids et le temps de parsing des réponses
// JSON et CSV (/to-csv) de l'API Melodi. Deux vues : mesure détaillée d'un
// couple indicateur × niveau (barres comparatives), et tableau récapitulatif
// de tous les couples.
//
// Route : /melodi-benchmark
import { useState, useCallback } from 'react';
import { Link as RouterLink } from 'react-router';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import indicators from '../config/indicators.json';
import { measureFormat } from '../helpers/benchMelodi';
import { normalizeFilter } from '../helpers/melodiParams';
import { useAbortOnUnmount } from '../hooks/useAbortOnUnmount';
import BenchBars, { formatBytes, formatMs } from './BenchBars';

const GEO_LEVELS = ['COM', 'EPCI', 'DEP'];

// Cap appliqué à COM dans la mesure détaillée (comme MapDemoConfigurable).
const COM_MAX_RESULT_FULL = 100000;
// Cap réduit pour le « tout mesurer », pour garder des temps raisonnables.
const COM_MAX_RESULT_CAPPED = 10000;
// Timeout par requête : COM JSON peut dépasser plusieurs secondes / 504.
const PROBE_TIMEOUT_MS = 20000;
// Nombre d'itérations de parsing mesurées (moyennées).
const RUNS = 8;

/**
 * Construit les paramètres de requête pour un indicateur à un niveau géo donné.
 * @param {Object} indicator - Entrée de indicators.json
 * @param {string} geoLevel - COM | EPCI | DEP
 * @param {number} comMaxResult - Cap maxResult appliqué au niveau COM
 * @returns {Object} Paramètres de requête
 */
const buildParams = (indicator, geoLevel, comMaxResult) => {
  const params = { ...normalizeFilter(indicator.filter), GEO: geoLevel };
  if (geoLevel === 'COM') params.maxResult = comMaxResult;
  return params;
};

/**
 * Mesure JSON et CSV (séquentiellement) pour un couple indicateur × niveau.
 * @param {Object} indicator
 * @param {string} geoLevel
 * @param {number} comMaxResult
 * @param {AbortSignal} [signal]
 * @returns {Promise<{json: Object, csv: Object}>}
 */
const measurePair = async (indicator, geoLevel, comMaxResult, signal) => {
  const params = buildParams(indicator, geoLevel, comMaxResult);
  const opts = { runs: RUNS, timeoutMs: PROBE_TIMEOUT_MS, signal };
  const json = await measureFormat(indicator.datasetId, params, { ...opts, csv: false });
  const csv = await measureFormat(indicator.datasetId, params, { ...opts, csv: true });
  return { json, csv };
};

/**
 * Vue « mesure détaillée » : sélecteurs + bouton, résultat en barres.
 * @returns {React.ReactElement}
 */
const DetailView = () => {
  const getSignal = useAbortOnUnmount();
  const [indicatorId, setIndicatorId] = useState(indicators[0]?.id);
  const [geoLevel, setGeoLevel] = useState('DEP');
  const [pair, setPair] = useState(null);
  const [loading, setLoading] = useState(false);

  const indicator = indicators.find((ind) => ind.id === indicatorId) ?? indicators[0];

  const measure = useCallback(async () => {
    setLoading(true);
    setPair(null);
    const result = await measurePair(indicator, geoLevel, COM_MAX_RESULT_FULL, getSignal());
    setPair(result);
    setLoading(false);
  }, [indicator, geoLevel, getSignal]);

  const error = pair && (!pair.json.ok || !pair.csv.ok)
    ? (pair.json.error || pair.csv.error)
    : null;

  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>Mesure détaillée</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems="flex-start">
        <FormControl size="small" sx={{ minWidth: 260, flex: 1 }}>
          <InputLabel id="bench-indicator-label">Indicateur</InputLabel>
          <Select
            labelId="bench-indicator-label"
            label="Indicateur"
            value={indicator.id}
            onChange={(e) => setIndicatorId(e.target.value)}
          >
            {indicators.map((ind) => (
              <MenuItem key={ind.id} value={ind.id}>{ind.title}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="bench-geo-label">Niveau</InputLabel>
          <Select
            labelId="bench-geo-label"
            label="Niveau"
            value={geoLevel}
            onChange={(e) => setGeoLevel(e.target.value)}
          >
            {GEO_LEVELS.map((level) => (
              <MenuItem key={level} value={level}>{level}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          onClick={measure}
          disabled={loading}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <PlayArrowIcon />}
        >
          Mesurer
        </Button>
      </Stack>
      {geoLevel === 'COM' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Niveau communal : la réponse JSON peut peser plusieurs Mo et prendre
          quelques secondes.
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {pair && !error && <BenchBars json={pair.json} csv={pair.csv} />}
    </Paper>
  );
};

/**
 * Vue « tableau récapitulatif » : mesure tous les couples séquentiellement.
 * @returns {React.ReactElement}
 */
const SummaryView = () => {
  const getSignal = useAbortOnUnmount();
  const [rows, setRows] = useState([]); // { key, title, datasetId, geoLevel, json, csv }
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [comFull, setComFull] = useState(false);

  const couples = indicators.flatMap((ind) =>
    GEO_LEVELS.map((geoLevel) => ({ indicator: ind, geoLevel })),
  );

  const runAll = useCallback(async () => {
    const signal = getSignal();
    setRunning(true);
    setRows([]);
    setDone(0);
    const comMax = comFull ? COM_MAX_RESULT_FULL : COM_MAX_RESULT_CAPPED;
    for (const { indicator, geoLevel } of couples) {
      if (signal.aborted) break;
      const { json, csv } = await measurePair(indicator, geoLevel, comMax, signal);
      if (signal.aborted) break;
      setRows((prev) => [
        ...prev,
        {
          key: `${indicator.id}__${geoLevel}`,
          title: indicator.title,
          datasetId: indicator.datasetId,
          geoLevel,
          json,
          csv,
        },
      ]);
      setDone((n) => n + 1);
    }
    setRunning(false);
    // couples est dérivé de indicators (constant) : stable entre rendus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comFull, getSignal]);

  const ratio = (a, b) => (b > 0 ? `×${(a / b).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}` : '—');
  const progress = couples.length ? (done / couples.length) * 100 : 0;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Tableau récapitulatif</Typography>
      <Alert severity="warning" sx={{ mb: 2 }}>
        Mesure tous les indicateurs × {GEO_LEVELS.join(', ')} séquentiellement.
        Au niveau communal, le JSON est volumineux — COM est plafonné à{' '}
        {COM_MAX_RESULT_CAPPED.toLocaleString('fr-FR')} résultats par défaut.
      </Alert>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap">
        <Button
          onClick={runAll}
          disabled={running}
          variant="contained"
          startIcon={running ? <CircularProgress size={16} /> : <PlayArrowIcon />}
        >
          Tout mesurer
        </Button>
        <FormControlLabel
          control={<Checkbox checked={comFull} onChange={(e) => setComFull(e.target.checked)} disabled={running} />}
          label="COM complet (lourd)"
        />
      </Stack>
      {running && <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Indicateur</TableCell>
              <TableCell>Jeu de données</TableCell>
              <TableCell>Niveau</TableCell>
              <TableCell align="right">Brut JSON</TableCell>
              <TableCell align="right">Brut CSV</TableCell>
              <TableCell align="right">Gain brut</TableCell>
              <TableCell align="right">Parse JSON</TableCell>
              <TableCell align="right">Parse CSV</TableCell>
              <TableCell align="right">Gain parse</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const failed = !row.json.ok || !row.csv.ok;
              return (
                <TableRow key={row.key} hover>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography variant="body2" noWrap title={row.title}>{row.title}</Typography>
                  </TableCell>
                  <TableCell><code>{row.datasetId}</code></TableCell>
                  <TableCell>{row.geoLevel}</TableCell>
                  {failed ? (
                    <TableCell colSpan={6} sx={{ color: 'error.main' }}>
                      {row.json.error || row.csv.error}
                    </TableCell>
                  ) : (
                    <>
                      <TableCell align="right">{formatBytes(row.json.bytes)}</TableCell>
                      <TableCell align="right">{formatBytes(row.csv.bytes)}</TableCell>
                      <TableCell align="right">{ratio(row.json.bytes, row.csv.bytes)}</TableCell>
                      <TableCell align="right">{formatMs(row.json.parseMs)}</TableCell>
                      <TableCell align="right">{formatMs(row.csv.parseMs)}</TableCell>
                      <TableCell align="right">{ratio(row.json.parseMs, row.csv.parseMs)}</TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

/**
 * Page de benchmark CSV vs JSON.
 * @returns {React.ReactElement}
 */
const MelodiBenchmark = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Box sx={{ mb: 3 }}>
      <Button component={RouterLink} to="/" startIcon={<HomeIcon />} variant="outlined">
        Accueil
      </Button>
    </Box>
    <Typography variant="h4" component="h1" gutterBottom>
      Benchmark CSV vs JSON
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Compare le temps de réponse, le poids (brut et gzip estimé) et le temps de
      parsing des réponses JSON et CSV (endpoint <code>/to-csv</code>) de l’API
      Melodi, pour les indicateurs de l’app.
    </Typography>
    <DetailView />
    <SummaryView />
  </Container>
);

export default MelodiBenchmark;
