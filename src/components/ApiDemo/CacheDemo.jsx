import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAllTerritories } from '../../hooks/useData';
import { QUERY_KEYS } from '../../config/api';

/**
 * Demo component for React Query cache management
 * Demonstrates caching, invalidation, and performance benefits
 * @returns {React.ReactElement} Cache demo component
 */
const CacheDemo = () => {
  const [requestCount, setRequestCount] = useState(0);
  const [timings, setTimings] = useState([]);
  const queryClient = useQueryClient();

  // Query with caching enabled
  const {
    data,
    isLoading,
    isFetching,
    error,
    dataUpdatedAt,
    refetch,
  } = useAllTerritories(
    'DS_RP_POPULATION_PRINC',
    'DEP',
    { TIME_PERIOD: '2022', SEX: '_T', AGE: '_T' }
  );

  const handleRefetch = async () => {
    const startTime = performance.now();
    await refetch();
    const endTime = performance.now();
    const duration = endTime - startTime;

    setRequestCount(prev => prev + 1);
    setTimings(prev => [...prev, {
      time: new Date().toLocaleTimeString('fr-FR'),
      duration: duration.toFixed(0),
      fromCache: duration < 100,
    }]);
  };

  const handleInvalidate = () => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.data.byId('DS_RP_POPULATION_PRINC', { 
        GEO: 'DEP', 
        TIME_PERIOD: '2022',
        SEX: '_T',
        AGE: '_T',
      }),
    });
    setRequestCount(0);
    setTimings([]);
  };  const handleClearCache = () => {
    queryClient.clear();
    setRequestCount(0);
    setTimings([]);
  };

  const getCacheStatus = () => {
    const queries = queryClient.getQueriesData({ 
      queryKey: QUERY_KEYS.data.byId('DS_RP_POPULATION_PRINC', { 
        GEO: 'DEP', 
        TIME_PERIOD: '2022',
        SEX: '_T',
        AGE: '_T',
      }),
    });
    
    if (queries.length === 0) return 'empty';
    
    const queryState = queryClient.getQueryState(
      QUERY_KEYS.data.byId('DS_RP_POPULATION_PRINC', { 
        GEO: 'DEP', 
        TIME_PERIOD: '2022',
        SEX: '_T',
        AGE: '_T',
      })
    );    if (!queryState) return 'empty';
    if (isFetching) return 'fetching';
    if (queryState.isInvalidated) return 'stale';
    return 'fresh';
  };

  const cacheStatus = getCacheStatus();

  const statusColors = {
    fresh: 'success',
    stale: 'warning',
    fetching: 'info',
    empty: 'error',
  };

  const statusLabels = {
    fresh: 'Cache actif (fresh)',
    stale: 'Cache périmé (stale)',
    fetching: 'Récupération en cours...',
    empty: 'Cache vide',
  };

  const getStatusColor = () => statusColors[cacheStatus] || 'default';
  const getStatusLabel = () => statusLabels[cacheStatus] || 'Inconnu';

  if (isLoading && requestCount === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            3. Gestion du cache React Query
          </Typography>
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            3. Gestion du cache React Query
          </Typography>
          <Alert severity="error">
            Erreur : {error.message}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          3. Gestion du cache React Query
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Démonstration du cache automatique et de ses avantages en termes de performance
        </Typography>

        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Chip
              label={getStatusLabel()}
              color={getStatusColor()}
              size="small"
            />
            {dataUpdatedAt && (
              <Chip
                label={`Dernière mise à jour: ${new Date(dataUpdatedAt).toLocaleTimeString('fr-FR')}`}
                variant="outlined"
                size="small"
              />
            )}
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={isFetching ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={handleRefetch}
              disabled={isFetching}
            >
              Recharger les données
            </Button>
            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={handleInvalidate}
              disabled={isFetching}
            >
              Invalider le cache
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleClearCache}
              disabled={isFetching}
            >
              Vider tout le cache
            </Button>
          </Stack>
        </Paper>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Observation : Configuration du cache
          </Typography>
          <Typography variant="body2" component="div">
            • <strong>staleTime</strong> : 5 minutes (données considérées fraîches)<br />
            • <strong>retry</strong> : 1 tentative en cas d'échec<br />
            • <strong>refetchOnWindowFocus</strong> : désactivé
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Cliquez plusieurs fois sur "Recharger" : les requêtes suivantes sont quasi instantanées grâce au cache.
          </Typography>
        </Alert>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Statistiques
            </Typography>
            <Stack spacing={1}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Nombre de rechargements
                </Typography>
                <Typography variant="h4">{requestCount}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Résultats en cache
                </Typography>
                <Typography variant="h4">
                  {data?.observations?.length || 0}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Historique des temps de réponse
            </Typography>
            {timings.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aucune requête effectuée
              </Typography>
            ) : (
              <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                {timings.map((timing, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={`${timing.duration} ms`}
                            size="small"
                            color={timing.fromCache ? 'success' : 'default'}
                          />
                          {timing.fromCache && (
                            <Chip label="Cache" size="small" variant="outlined" color="success" />
                          )}
                        </Stack>
                      }
                      secondary={timing.time}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Comparaison : Avec cache vs Sans cache
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
          <Stack spacing={1}>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                ✅ Avec React Query (cache activé)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 1ère requête : ~200-500 ms (appel API réel)<br />
                • Requêtes suivantes : &lt;10 ms (données en cache)<br />
                • Limite de 30 req/min respectée facilement
              </Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="body2" fontWeight="medium">
                ❌ Sans cache (appels directs)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Toutes les requêtes : ~200-500 ms (appel API à chaque fois)<br />
                • Latence constante pour l'utilisateur<br />
                • Risque de dépassement de la limite de 30 req/min
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </CardContent>
    </Card>
  );
};

export default CacheDemo;
