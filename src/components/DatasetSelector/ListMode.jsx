import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Stack,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { getDatasetTitle, getDatasetDescription } from '../../helpers/datasetHelpers';

/**
 * Mode 2: Filterable List
 * @param {Object} props - Component props
 * @param {Array} props.datasets - List of datasets
 * @param {Function} props.onSelect - Callback when a dataset is selected
 * @returns {React.ReactElement} List mode component
 */
const ListMode = ({ datasets, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const filteredDatasets = useMemo(() => {
    if (!searchTerm) return datasets;

    const term = searchTerm.toLowerCase();
    return datasets.filter((dataset) => {
      const title = getDatasetTitle(dataset);
      const description = getDatasetDescription(dataset);
      return (
        dataset.identifier.toLowerCase().includes(term) ||
        title.toLowerCase().includes(term) ||
        description.toLowerCase().includes(term)
      );
    });
  }, [datasets, searchTerm]);

  const handleSelect = (dataset) => {
    setSelectedId(dataset.identifier);
    onSelect(dataset);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Liste avec filtre
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Filtrez et sélectionnez dans la liste complète
      </Typography>

      <TextField
        fullWidth
        label="Filtrer la liste"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
        }}
      />

      <Paper variant="outlined" sx={{ maxHeight: 500, overflow: 'auto' }}>
        <List>
          {filteredDatasets.map((dataset) => (
            <ListItem key={dataset.identifier} disablePadding>
              <ListItemButton
                selected={selectedId === dataset.identifier}
                onClick={() => handleSelect(dataset)}
              >
                <ListItemText
                  primary={getDatasetTitle(dataset)}
                  secondary={
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                      <Chip label={dataset.identifier} size="small" />
                    </Stack>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>

      {filteredDatasets.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucun jeu de données ne correspond à votre recherche
        </Alert>
      )}
    </Box>
  );
};

export default ListMode;
