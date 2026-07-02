// src/components/BenchChoropleth.jsx
// Page de benchmark : compare le coût de recoloration des ~35 000 communes entre
// l'ancien mécanisme (expression `match` massive + setPaintProperty) et le nouveau
// (feature-state). Monte une vraie carte pour disposer des features PMTiles réelles,
// sans dépendre de l'API Melodi. Route : /bench-choropleth
import { useRef, useState, useCallback } from 'react';
import { Link as RouterLink } from 'react-router';
import { Map as MapGL, Source, Layer } from 'react-map-gl/maplibre';
import {
  Container, Typography, Box, Button, Paper, Alert, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapStyles } from 'carte-facile';
import 'carte-facile/carte-facile.css';

import { usePMTilesProtocol } from '../hooks/usePMTilesProtocol';
import { FEATURE_STATE_COLOR_EXPRESSION } from '../helpers/colorHelpers';
import {
  buildSyntheticClassIndex,
  benchMatchRecolor,
  benchFeatureStateRecolor,
} from '../helpers/benchChoropleth';

const SOURCE_ID = 'geo-2025-source';
const SOURCE_LAYER = 'com_contour';
const LAYER_ID = 'com-fill-data';
const RUNS = 5;

const fmtMs = (ms) => `${ms.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ms`;

/**
 * Page de benchmark de la recoloration choroplèthe.
 * @returns {React.ReactElement}
 */
const BenchChoropleth = () => {
  const mapRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null); // { communes, runs, match, featureState }
  const [notice, setNotice] = useState(null);

  usePMTilesProtocol();

  const run = useCallback(async () => {
    const map = mapRef.current?.getMap?.();
    if (!map || !map.getSource(SOURCE_ID)) {
      setNotice('Carte en cours de chargement, réessayez dans un instant.');
      return;
    }
    const feats = map.querySourceFeatures(SOURCE_ID, { sourceLayer: SOURCE_LAYER });
    const ids = [...new Set(feats.map((f) => f.id).filter((x) => x != null))];
    if (ids.length < 1000) {
      setNotice(`Trop peu de communes chargées (${ids.length}). Dézoomez / patientez puis réessayez.`);
      return;
    }
    setNotice(null);
    setRunning(true);
    setResult(null);
    // Laisse React peindre l'état "running" avant de bloquer le thread.
    await new Promise((res) => requestAnimationFrame(res));

    // Jeu de valeurs synthétique partagé par les deux mécanismes (comparaison honnête).
    const classIndex = buildSyntheticClassIndex(ids);
    const params = { sourceId: SOURCE_ID, sourceLayer: SOURCE_LAYER, layerId: LAYER_ID, ids, classIndex, runs: RUNS };
    const match = await benchMatchRecolor(map, params);
    const featureState = await benchFeatureStateRecolor(map, params);

    setResult({ communes: ids.length, runs: RUNS, match, featureState });
    setRunning(false);
  }, []);

  const gainPct = result
    ? (1 - result.featureState.totalMs / result.match.totalMs) * 100
    : null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button component={RouterLink} to="/" startIcon={<HomeIcon />} variant="outlined">
          Accueil
        </Button>
      </Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Benchmark coloration : match vs feature-state
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Compare le coût de recoloration des communes entre l&apos;ancien mécanisme (expression
        MapLibre <code>match</code> massive + <code>setPaintProperty</code>, qui retessele)
        et le levier 4 (<code>setFeatureState</code>, qui ne retessele pas). Mesuré sur les
        communes PMTiles réellement chargées, valeurs synthétiques, moyenne sur {RUNS} runs.
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap">
          <Button
            onClick={run}
            disabled={running}
            variant="contained"
            startIcon={running ? <CircularProgress size={16} /> : <PlayArrowIcon />}
          >
            Lancer le benchmark
          </Button>
        </Stack>
        {notice && <Alert severity="info" sx={{ mb: 2 }}>{notice}</Alert>}
        {result && (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Mécanisme</TableCell>
                    <TableCell align="right">Construction</TableCell>
                    <TableCell align="right">Recoloration totale</TableCell>
                    <TableCell align="right">Gain</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <TableCell><code>match</code> + <code>setPaintProperty</code></TableCell>
                    <TableCell align="right">{fmtMs(result.match.buildExprMs)}</TableCell>
                    <TableCell align="right">{fmtMs(result.match.totalMs)}</TableCell>
                    <TableCell align="right">—</TableCell>
                  </TableRow>
                  <TableRow hover>
                    <TableCell><code>feature-state</code> (levier 4)</TableCell>
                    <TableCell align="right">{fmtMs(result.featureState.setStateMs)}</TableCell>
                    <TableCell align="right">{fmtMs(result.featureState.totalMs)}</TableCell>
                    <TableCell align="right"><strong>−{gainPct.toFixed(0)} %</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              {result.communes.toLocaleString('fr-FR')} communes mesurées, moyenne sur {result.runs} runs.
              Les temps absolus dépendent du GPU (réduits sur GPU matériel) ; le rapport
              entre les deux mécanismes reste représentatif.
            </Typography>
          </>
        )}
      </Paper>

      <Paper elevation={2} sx={{ position: 'relative', overflow: 'hidden', height: 420 }}>
        <MapGL
          ref={mapRef}
          initialViewState={{ longitude: 2.3522, latitude: 46.603354, zoom: 4.5 }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={mapStyles.desaturated}
          interactiveLayerIds={[]}
        >
          <Source id={SOURCE_ID} type="vector" url="pmtiles:///geo_2025.pmtiles" promoteId="GEO" attribution="Insee">
            <Layer
              id={LAYER_ID}
              source-layer={SOURCE_LAYER}
              type="fill"
              paint={{ 'fill-color': FEATURE_STATE_COLOR_EXPRESSION, 'fill-opacity': 0.75 }}
            />
          </Source>
        </MapGL>
      </Paper>
    </Container>
  );
};

export default BenchChoropleth;
