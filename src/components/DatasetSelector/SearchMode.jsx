import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Autocomplete,
  Chip,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { getDatasetTitle, getDatasetDescription, getDatasetSubtitle } from '../../helpers/datasetHelpers';

/**
 * Mode 1: Search with Autocomplete
 * @param {Object} props - Component props
 * @param {Array} props.datasets - List of datasets
 * @param {Function} props.onSelect - Callback when a dataset is selected
 * @returns {React.ReactElement} Search mode component
 */
const SearchMode = ({ datasets, onSelect }) => {
  const [selectedDataset, setSelectedDataset] = useState(null);

  const handleChange = (event, newValue) => {
    setSelectedDataset(newValue);
    if (newValue) {
      onSelect(newValue);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Recherche par autocomplete
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Tapez le nom ou l'identifiant d'un jeu de données
      </Typography>

      <Autocomplete
        options={datasets}
        getOptionLabel={(option) => {
          const title = getDatasetTitle(option);
          return `${title} - ${option.identifier}`;
        }}
        value={selectedDataset}
        onChange={handleChange}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Rechercher un jeu de données"
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} key={option.identifier}>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {getDatasetTitle(option)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.identifier}
              </Typography>
            </Box>
          </li>
        )}
      />

      {selectedDataset && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {getDatasetTitle(selectedDataset)}
            </Typography>
            {getDatasetSubtitle(selectedDataset) && (
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {getDatasetSubtitle(selectedDataset)}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" paragraph>
              {getDatasetDescription(selectedDataset)}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={selectedDataset.identifier} size="small" color="primary" />
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SearchMode;
