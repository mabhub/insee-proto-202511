import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  useAllTerritoriesWithLabels,
  useSpecificTerritory,
  useNestedTerritories,
} from '../../hooks/useData';

/**
 * Demo component for API query patterns
 * Demonstrates the 3 Melodi API query patterns
 * @param {Object} props - Component props
 * @param {string} props.sharedGeoLevel - Shared geographic level from parent
 * @param {Function} props.onGeoLevelChange - Callback when geo level changes
 * @returns {React.ReactElement} Query patterns demo component
 */
const QueryPatterns = ({ sharedGeoLevel, onGeoLevelChange }) => {
  const [pattern, setPattern] = useState(1);

  // Pattern 1: All territories of a level
  const query1 = useAllTerritoriesWithLabels(
    'DS_RP_POPULATION_PRINC',
    sharedGeoLevel,
    { TIME_PERIOD: '2022', SEX: '_T', AGE: '_T' }
  );  // Pattern 2: Specific territory
  const [geoLevel2, setGeoLevel2] = useState('COM');
  const [geoCode2, setGeoCode2] = useState('44109'); // Nantes
  const query2 = useSpecificTerritory(
    'DS_RP_POPULATION_PRINC',
    geoLevel2,
    geoCode2,
    { TIME_PERIOD: '2022', SEX: '_T', AGE: '_T' }
  );

  // Pattern 3: Nested territories
  const [parentLevel, setParentLevel] = useState('EPCI');
  const [parentCode, setParentCode] = useState('244400404'); // Nantes Métropole
  const [childLevel, setChildLevel] = useState('COM');
  const query3 = useNestedTerritories(
    'DS_RP_POPULATION_PRINC',
    parentLevel,
    parentCode,
    childLevel,
    { TIME_PERIOD: '2022', SEX: '_T', AGE: '_T' }
  );

  const getCurrentQuery = () => {
    if (pattern === 1) return query1;
    if (pattern === 2) return query2;
    return query3;
  };

  const currentQuery = getCurrentQuery();

  const renderQueryInfo = () => {
    if (pattern === 1) {
      return (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Pattern : <code>GEO=&lt;niveau&gt;</code>
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Récupère tous les territoires d'un niveau géographique donné.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Niveau géographique</InputLabel>
            <Select
              value={sharedGeoLevel}
              onChange={(e) => onGeoLevelChange(e.target.value)}
              label="Niveau géographique"
            >
              <MenuItem value="REG">Régions</MenuItem>
              <MenuItem value="DEP">Départements</MenuItem>
              <MenuItem value="EPCI">EPCI</MenuItem>
            </Select>
          </FormControl>
          <Chip
            label={`GEO=${sharedGeoLevel}`}
            color="primary"
            sx={{ fontFamily: 'monospace' }}
          />
        </Box>
      );
    }

    if (pattern === 2) {
      return (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Pattern : <code>GEO=&lt;niveau&gt;-&lt;code&gt;</code>
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Récupère un territoire spécifique.
          </Typography>
          <Stack spacing={2} sx={{ mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Niveau géographique</InputLabel>
              <Select
                value={geoLevel2}
                onChange={(e) => setGeoLevel2(e.target.value)}
                label="Niveau géographique"
              >
                <MenuItem value="REG">Région</MenuItem>
                <MenuItem value="DEP">Département</MenuItem>
                <MenuItem value="EPCI">EPCI</MenuItem>
                <MenuItem value="COM">Commune</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Code territoire"
              value={geoCode2}
              onChange={(e) => setGeoCode2(e.target.value)}
              placeholder="Ex: 44109 pour Nantes"
            />
          </Stack>
          <Chip
            label={`GEO=${geoLevel2}-${geoCode2}`}
            color="primary"
            sx={{ fontFamily: 'monospace' }}
          />
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Pattern : <code>GEO=&lt;parent&gt;*&lt;enfant&gt;</code>
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Récupère tous les territoires enfants d'un parent donné.
        </Typography>
        <Stack spacing={2} sx={{ mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Niveau parent</InputLabel>
            <Select
              value={parentLevel}
              onChange={(e) => setParentLevel(e.target.value)}
              label="Niveau parent"
            >
              <MenuItem value="REG">Région</MenuItem>
              <MenuItem value="DEP">Département</MenuItem>
              <MenuItem value="EPCI">EPCI</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Code parent"
            value={parentCode}
            onChange={(e) => setParentCode(e.target.value)}
            placeholder="Ex: 244400404 pour Nantes Métropole"
          />
          <FormControl fullWidth>
            <InputLabel>Niveau enfant</InputLabel>
            <Select
              value={childLevel}
              onChange={(e) => setChildLevel(e.target.value)}
              label="Niveau enfant"
            >
              <MenuItem value="DEP">Départements</MenuItem>
              <MenuItem value="EPCI">EPCI</MenuItem>
              <MenuItem value="COM">Communes</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <Chip
          label={`GEO=${parentLevel}-${parentCode}*${childLevel}`}
          color="primary"
          sx={{ fontFamily: 'monospace' }}
        />
      </Box>
    );
  };

  const renderResults = () => {
    if (currentQuery.isLoading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (currentQuery.error) {
      return (
        <Alert severity="error">
          Erreur : {currentQuery.error.message}
        </Alert>
      );
    }

    if (!currentQuery.data) {
      return null;
    }

    const observations = currentQuery.data.observations || [];
    const displayData = observations.slice(0, 10);

    return (
      <Box>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Chip
            label={`${observations.length} résultats`}
            color="success"
          />
          <Chip
            label={`Temps: ${currentQuery.dataUpdatedAt ? new Date(currentQuery.dataUpdatedAt).toLocaleTimeString('fr-FR') : '-'}`}
            variant="outlined"
          />
        </Stack>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Territoire</TableCell>
                <TableCell>Code</TableCell>
                <TableCell align="right">Valeur</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayData.map((obs, index) => (
                <TableRow key={index}>
                  <TableCell>{obs.GEO_LIB || '-'}</TableCell>
                  <TableCell>
                    <code>{obs.GEO_OBJECT}-{obs.GEO}</code>
                  </TableCell>
                  <TableCell align="right">
                    {obs.OBS_VALUE ? Number(obs.OBS_VALUE).toLocaleString('fr-FR') : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {observations.length > 10 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Affichage des 10 premiers résultats sur {observations.length}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          1. Patterns de requêtage Melodi
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Démonstration des 3 syntaxes de filtrage géographique de l'API Melodi
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <Chip
            label="Pattern 1: Tous les territoires"
            onClick={() => setPattern(1)}
            color={pattern === 1 ? 'primary' : 'default'}
            variant={pattern === 1 ? 'filled' : 'outlined'}
          />
          <Chip
            label="Pattern 2: Territoire spécifique"
            onClick={() => setPattern(2)}
            color={pattern === 2 ? 'primary' : 'default'}
            variant={pattern === 2 ? 'filled' : 'outlined'}
          />
          <Chip
            label="Pattern 3: Territoires imbriqués"
            onClick={() => setPattern(3)}
            color={pattern === 3 ? 'primary' : 'default'}
            variant={pattern === 3 ? 'filled' : 'outlined'}
          />
        </Stack>

        <Box sx={{ mb: 3 }}>
          {renderQueryInfo()}
        </Box>

        {renderResults()}
      </CardContent>
    </Card>
  );
};

export default QueryPatterns;
