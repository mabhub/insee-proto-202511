import { Link as RouterLink } from 'react-router';
import {
  Button,
  Typography,
  Box,
  Paper,
  Stack,
} from '@mui/material';
import DatasetIcon from '@mui/icons-material/Dataset';
import ApiIcon from '@mui/icons-material/Api';
import MapIcon from '@mui/icons-material/Map';
import LayersIcon from '@mui/icons-material/Layers';

import Layout from './Layout';

/**
 * Home page component with a simple counter example
 *
 * @returns {React.ReactElement} Home page content
 */
const Home = () => (
  <Layout>
    <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
      <Box sx={{ mt: 4, pt: 4, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Démonstrations
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }} flexWrap="wrap">
          <Box textAlign="center">
            <Button
              component={RouterLink}
              to="/dataset-selector"
              variant="outlined"
              color="primary"
              size="large"
              startIcon={<DatasetIcon />}
            >
              Sélecteur de jeux de données
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
              Testez différents modes de sélection
            </Typography>
          </Box>
          <Box textAlign="center">
            <Button
              component={RouterLink}
              to="/api-demo"
              variant="outlined"
              color="primary"
              size="large"
              startIcon={<ApiIcon />}
            >
              Démonstrations API
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
              Patterns de requêtes, calculs et cache
            </Typography>
          </Box>
          <Box textAlign="center">
            <Button
              component={RouterLink}
              to="/map-demo"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<MapIcon />}
            >
              Cartographie
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
              Visualisation géographique des données
            </Typography>
          </Box>
          <Box textAlign="center">
            <Button
              component={RouterLink}
              to="/map-demo-static"
              variant="outlined"
              color="secondary"
              size="large"
              startIcon={<LayersIcon />}
            >
              Carte statique
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
              Démo simple avec données fictives
            </Typography>
          </Box>
          <Box textAlign="center">
            <Button
              component={RouterLink}
              to="/map-demo-ign-cartefacile"
              variant="outlined"
              color="secondary"
              size="large"
              startIcon={<LayersIcon />}
            >
              Carte IGN (carte facile)
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
              Démo utilisation composant carte facile
            </Typography>
          </Box>
          <Box textAlign="center">
            <Button
              component={RouterLink}
              to="/map-demo-proportional"
              variant="outlined"
              color="primary"
              size="large"
            >
              Ronds proportionnels
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
              Population par département (cercles)
            </Typography>
          </Box>
          <Box textAlign="center">
            <Button
              component={RouterLink}
              to="/map-demo-choropleth"
              variant="outlined"
              color="primary"
              size="large"
            >
              Choroplèthe ratio 80+
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
              Part des 80 ans et plus par département
            </Typography>
          </Box>
          <Box textAlign="center">
            <Button
              component={RouterLink}
              to="/map-demo-configurable"
              variant="contained"
              color="primary"
              size="large"
            >
              Choroplèthe configurable
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
              Indicateur, niveau géographique et échelle au choix
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Paper>
  </Layout>
);

export default Home;
