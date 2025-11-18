import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import {
  Container,
  Typography,
  Box,
  Button,
  Stack,
  Paper,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import QueryPatterns from './ApiDemo/QueryPatterns';
import CalculationsDemo from './ApiDemo/CalculationsDemo';
import CacheDemo from './ApiDemo/CacheDemo';

/**
 * API demonstrations page
 * Shows query patterns, calculations, and cache management
 * @returns {React.ReactElement} API demo page
 */
const ApiDemo = () => {
  const [sharedGeoLevel, setSharedGeoLevel] = useState('DEP');

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

      <Paper elevation={1} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Démonstrations API Melodi
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Explorez les fonctionnalités de base pour interroger l'API Melodi avec React Query
        </Typography>
      </Paper>

      <Stack spacing={4}>
        <QueryPatterns 
          sharedGeoLevel={sharedGeoLevel}
          onGeoLevelChange={setSharedGeoLevel}
        />
        <CalculationsDemo geoLevel={sharedGeoLevel} />
        <CacheDemo />
      </Stack>
    </Container>
  );
};

export default ApiDemo;
