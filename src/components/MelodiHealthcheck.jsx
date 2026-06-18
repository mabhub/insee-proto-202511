// src/components/MelodiHealthcheck.jsx
// Page de debug NON RÉFÉRENCÉE (absente du menu d'accueil).
// Valide que l'API Melodi *accepte* toutes les requêtes décrites par la
// configuration des indicateurs, croisées avec les niveaux géographiques de
// l'app. Chaque requête est lancée avec un nombre de résultats très limité
// (maxResult bas) : on ne valide pas la donnée, seulement que la requête
// passe (statut HTTP, présence d'au moins une observation, temps de réponse).
//
// Route : /melodi-healthcheck  (non listée sur la page d'accueil)
import { useState, useCallback } from 'react';
import { Link as RouterLink } from 'react-router';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Link,
  Stack,
  Tooltip,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

import indicators from '../config/indicators.json';
import { buildDataUrl, normalizeFilter } from '../helpers/melodiParams';
import { useAbortOnUnmount } from '../hooks/useAbortOnUnmount';

// Niveaux géographiques exploités par l'app (REG absent du PMTiles courant).
const GEO_LEVELS = ['COM', 'EPCI', 'DEP'];

// Nombre de résultats demandés : très bas, on valide l'acceptation de la
// requête, pas le volume. On garde une marge (>1) pour vérifier qu'un filtre
// multi-valeurs ne renvoie pas qu'une seule modalité.
const PROBE_MAX_RESULT = 5;

// Délai au-delà duquel une requête est considérée en échec. COM peut renvoyer
// un 504 après un long blocage : on coupe court pour ne pas figer la validation.
const PROBE_TIMEOUT_MS = 15000;

/**
 * Construit la liste de toutes les requêtes à valider : produit cartésien
 * indicateurs × niveaux géographiques.
 * @returns {Array<{key: string, title: string, datasetId: string,
 *   geoLevel: string, url: string}>}
 */
const buildProbes = () =>
  indicators.flatMap((ind) =>
    GEO_LEVELS.map((geoLevel) => ({
      key: `${ind.id}__${geoLevel}`,
      title: ind.title,
      datasetId: ind.datasetId,
      geoLevel,
      url: buildDataUrl(ind.datasetId, {
        ...normalizeFilter(ind.filter),
        GEO: geoLevel,
        maxResult: PROBE_MAX_RESULT,
      }),
    })),
  );

/**
 * Extrait un message d'erreur lisible d'un corps de réponse. L'API renvoie du
 * JSON {"message": "...", "http_status_code": ...} sur les erreurs ; on retombe
 * sur le texte brut tronqué sinon.
 * @param {string} body - Corps de réponse brut
 * @param {string} fallback - Message par défaut (ex. statusText)
 * @returns {string} Message lisible
 */
const extractErrorMessage = (body, fallback) => {
  try {
    const parsed = JSON.parse(body);
    if (parsed?.message) return parsed.message;
  } catch {
    // Corps non-JSON (ex. page HTML d'erreur passerelle) : texte brut tronqué.
  }
  return body.slice(0, 200) || fallback;
};

/**
 * Exécute une requête de validation et renvoie son verdict.
 * Ne lève jamais : toute erreur (réseau, timeout, annulation) est capturée et
 * rapportée dans le résultat.
 *
 * `fetch` direct volontaire (et non via les hooks/services de l'app) : la page
 * veut un contrôle séquentiel des requêtes et pas de mise en cache TanStack
 * Query — c'est une validation à la demande, pas un affichage de données.
 *
 * @param {{datasetId: string, geoLevel: string, url: string}} probe
 * @param {AbortSignal} [signal] - Signal d'annulation (démontage de la page)
 * @returns {Promise<{status: 'ok'|'error', httpStatus: number,
 *   observations: number, durationMs: number, message: string}>}
 */
const runProbe = async (probe, signal) => {
  const start = performance.now();
  // Combine l'annulation externe (signal) et le timeout par requête.
  const timeout = AbortSignal.timeout(PROBE_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const elapsed = () => Math.round(performance.now() - start);
  try {
    const res = await fetch(probe.url, {
      headers: { Accept: 'application/json' },
      signal: combined,
    });
    if (!res.ok) {
      const body = await res.text();
      return {
        status: 'error',
        httpStatus: res.status,
        observations: 0,
        durationMs: elapsed(),
        message: extractErrorMessage(body, res.statusText),
      };
    }
    const json = await res.json();
    const observations = json.observations?.length ?? 0;
    return {
      status: observations > 0 ? 'ok' : 'error',
      httpStatus: res.status,
      observations,
      durationMs: elapsed(),
      message: observations > 0 ? '' : 'Réponse 200 mais aucune observation',
    };
  } catch (err) {
    // Le timeout l'emporte sur l'annulation pour le message : si la page est
    // démontée (signal), le résultat ne sera de toute façon plus affiché.
    const message =
      err.name === 'TimeoutError'
        ? `Délai dépassé (> ${PROBE_TIMEOUT_MS / 1000} s)`
        : err.name === 'AbortError'
          ? 'Annulé'
          : err.message;
    return { status: 'error', httpStatus: 0, observations: 0, durationMs: elapsed(), message };
  }
};

/**
 * Rendu de la cellule de statut (puce colorée + icône).
 * @param {{result?: {status: string, httpStatus: number, message: string},
 *   running: boolean}} props
 * @returns {React.ReactElement}
 */
const StatusCell = ({ result, running }) => {
  if (running) return <Chip size="small" label="…" />;
  if (!result) return <Chip size="small" variant="outlined" label="en attente" />;
  if (result.status === 'ok') {
    return (
      <Chip
        size="small"
        color="success"
        icon={<CheckCircleIcon />}
        label={`OK (${result.httpStatus})`}
      />
    );
  }
  return (
    <Tooltip title={result.message || ''}>
      <Chip
        size="small"
        color="error"
        icon={<ErrorIcon />}
        label={result.httpStatus ? `HTTP ${result.httpStatus}` : 'échec'}
      />
    </Tooltip>
  );
};

/**
 * Page de healthcheck Melodi : lance toutes les requêtes de la configuration
 * et affiche leur statut. Permet de vérifier d'un coup d'œil que l'API accepte
 * l'ensemble des couples (indicateur × niveau géographique) utilisés par l'app.
 *
 * @returns {React.ReactElement} Page content
 */
const MelodiHealthcheck = () => {
  const [probes] = useState(buildProbes);
  const [results, setResults] = useState({}); // key -> verdict
  const [runningKey, setRunningKey] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [done, setDone] = useState(0);

  // Annule les requêtes en vol si la page est démontée pendant une validation,
  // pour ne pas appeler setState sur un composant démonté.
  const getSignal = useAbortOnUnmount();

  const runAll = useCallback(async () => {
    const signal = getSignal();
    setIsRunning(true);
    setResults({});
    setDone(0);
    // Séquentiel : l'API Melodi est lente et on évite de la marteler en
    // parallèle. L'ordre suit la liste (indicateur × niveau).
    for (const probe of probes) {
      if (signal.aborted) break;
      setRunningKey(probe.key);
      const result = await runProbe(probe, signal);
      if (signal.aborted) break;
      setResults((prev) => ({ ...prev, [probe.key]: result }));
      setDone((n) => n + 1);
    }
    setRunningKey(null);
    setIsRunning(false);
  }, [probes, getSignal]);

  const verdicts = Object.values(results);
  const okCount = verdicts.filter((r) => r.status === 'ok').length;
  const errCount = verdicts.filter((r) => r.status === 'error').length;
  const progress = probes.length ? (done / probes.length) * 100 : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button component={RouterLink} to="/" startIcon={<HomeIcon />} variant="outlined">
          Accueil
        </Button>
        <Button
          onClick={runAll}
          disabled={isRunning}
          startIcon={<PlayArrowIcon />}
          variant="contained"
        >
          {isRunning ? 'Validation en cours…' : 'Lancer la validation'}
        </Button>
        {verdicts.length > 0 && (
          <Stack direction="row" spacing={1}>
            <Chip color="success" size="small" label={`${okCount} OK`} />
            {errCount > 0 && <Chip color="error" size="small" label={`${errCount} en échec`} />}
          </Stack>
        )}
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        Healthcheck Melodi
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Valide que l’API Melodi accepte toutes les requêtes décrites par{' '}
        <code>src/config/indicators.json</code>, croisées avec les niveaux{' '}
        {GEO_LEVELS.join(', ')}. Chaque requête est plafonnée à{' '}
        <code>maxResult={PROBE_MAX_RESULT}</code> — on valide l’acceptation, pas le volume.
        Page de debug non référencée.
      </Typography>

      {isRunning && <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Indicateur</TableCell>
              <TableCell>Jeu de données</TableCell>
              <TableCell>Niveau</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="right">Obs.</TableCell>
              <TableCell align="right">Temps</TableCell>
              <TableCell>Requête</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {probes.map((probe) => {
              const result = results[probe.key];
              return (
                <TableRow key={probe.key} hover>
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography variant="body2" noWrap title={probe.title}>
                      {probe.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <code>{probe.datasetId}</code>
                  </TableCell>
                  <TableCell>{probe.geoLevel}</TableCell>
                  <TableCell>
                    <StatusCell result={result} running={runningKey === probe.key} />
                  </TableCell>
                  <TableCell align="right">{result ? result.observations : '—'}</TableCell>
                  <TableCell align="right">{result ? `${result.durationMs} ms` : '—'}</TableCell>
                  <TableCell>
                    <Tooltip title={probe.url}>
                      <Link
                        href={probe.url}
                        target="_blank"
                        rel="noreferrer"
                        sx={{ fontSize: 12 }}
                      >
                        voir
                      </Link>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default MelodiHealthcheck;
