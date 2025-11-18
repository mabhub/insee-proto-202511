import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ListIcon from '@mui/icons-material/List';
import GridViewIcon from '@mui/icons-material/GridView';
import HomeIcon from '@mui/icons-material/Home';

import { useCatalogAll } from '../hooks/useCatalog';
import { getDatasetTitle } from '../helpers/datasetHelpers';
import TabPanel from './DatasetSelector/TabPanel';
import SearchMode from './DatasetSelector/SearchMode';
import ListMode from './DatasetSelector/ListMode';
import GridMode from './DatasetSelector/GridMode';

/**
 * Main DatasetSelector component
 * Displays different selection modes for datasets from Melodi catalog
 * @returns {React.ReactElement} Dataset selector component
 */
const DatasetSelector = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedDataset, setSelectedDataset] = useState(null);

  const { data: datasets = [], isLoading, error } = useCatalogAll();

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setSelectedDataset(null);
  };

  const handleDatasetSelect = (dataset) => {
    setSelectedDataset(dataset);
    // eslint-disable-next-line no-console
    console.log('Dataset selected:', dataset);
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Erreur lors du chargement du catalogue : {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          component={RouterLink}
          to="/"
          startIcon={<HomeIcon />}
          variant="outlined"
          size="small"
        >
          Retour à l'accueil
        </Button>
      </Box>

      <Typography variant="h3" component="h1" gutterBottom>
        Sélection de jeu de données
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Explorez {datasets.length} jeux de données disponibles dans le catalogue Melodi
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="dataset selection modes">
          <Tab icon={<SearchIcon />} label="Autocomplete" iconPosition="start" />
          <Tab icon={<ListIcon />} label="Liste filtrée" iconPosition="start" />
          <Tab icon={<GridViewIcon />} label="Vue grille" iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <SearchMode datasets={datasets} onSelect={handleDatasetSelect} />
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <ListMode datasets={datasets} onSelect={handleDatasetSelect} />
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <GridMode datasets={datasets} onSelect={handleDatasetSelect} />
      </TabPanel>

      {selectedDataset && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            p: 2,
            maxWidth: 400,
            bgcolor: 'success.light',
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            Sélection actuelle :
          </Typography>
          <Typography variant="body2">
            {getDatasetTitle(selectedDataset)}
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default DatasetSelector;
