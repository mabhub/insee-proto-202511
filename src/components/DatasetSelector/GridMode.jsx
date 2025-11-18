import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Alert,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { getDatasetTitle, getDatasetDescription } from '../../helpers/datasetHelpers';

/**
 * Mode 3: Grid View with Cards
 * @param {Object} props - Component props
 * @param {Array} props.datasets - List of datasets
 * @param {Function} props.onSelect - Callback when a dataset is selected
 * @returns {React.ReactElement} Grid mode component
 */
const GridMode = ({ datasets, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const filteredDatasets = useMemo(() => {
    if (!searchTerm) return datasets.slice(0, 20); // Limiter l'affichage initial

    const term = searchTerm.toLowerCase();
    return datasets.filter((dataset) => {
      const title = getDatasetTitle(dataset);
      return (
        dataset.identifier.toLowerCase().includes(term) ||
        title.toLowerCase().includes(term)
      );
    }).slice(0, 20);
  }, [datasets, searchTerm]);

  const handleSelect = (dataset) => {
    setSelectedId(dataset.identifier);
    onSelect(dataset);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Vue en grille
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Parcourez visuellement les jeux de données
      </Typography>

      <TextField
        fullWidth
        label="Filtrer les jeux de données"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
        }}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 2,
        }}
      >
        {filteredDatasets.map((dataset) => (
          <Card
            key={dataset.identifier}
            sx={{
              cursor: 'pointer',
              border: selectedId === dataset.identifier ? 2 : 0,
              borderColor: 'primary.main',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)',
              },
            }}
            onClick={() => handleSelect(dataset)}
          >
            <CardContent>
              <Typography variant="h6" fontSize="1rem" gutterBottom noWrap>
                {getDatasetTitle(dataset)}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: 60,
                }}
              >
                {getDatasetDescription(dataset) || 'Pas de description'}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip label={dataset.identifier} size="small" color="primary" />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {filteredDatasets.length === 0 && (
        <Alert severity="info">
          Aucun jeu de données ne correspond à votre recherche
        </Alert>
      )}
    </Box>
  );
};

export default GridMode;
