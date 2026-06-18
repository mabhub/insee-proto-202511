import {
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
import DemoLink from './DemoLink';

/**
 * Liste des démonstrations affichées sur l'accueil. Une entrée = un bouton +
 * sa légende. Modifier/ajouter une démo se fait ici, sans toucher au rendu.
 *
 * @type {Array<{to: string, label: string, description: string,
 *   icon?: React.ReactElement, variant?: 'outlined'|'contained',
 *   color?: 'primary'|'secondary'}>}
 */
const DEMOS = [
  {
    to: '/dataset-selector',
    label: 'Sélecteur de jeux de données',
    description: 'Testez différents modes de sélection',
    icon: <DatasetIcon />,
  },
  {
    to: '/api-demo',
    label: 'Démonstrations API',
    description: 'Patterns de requêtes, calculs et cache',
    icon: <ApiIcon />,
  },
  {
    to: '/map-demo',
    label: 'Cartographie',
    description: 'Visualisation géographique des données',
    icon: <MapIcon />,
  },
  {
    to: '/map-demo-static',
    label: 'Carte statique',
    description: 'Démo simple avec données fictives',
    icon: <LayersIcon />,
  },
  {
    to: '/map-demo-ign-cartefacile',
    label: 'Carte IGN (carte facile)',
    description: 'Démo utilisation composant carte facile',
    icon: <LayersIcon />,
  },
  {
    to: '/map-demo-proportional',
    label: 'Ronds proportionnels',
    description: 'Population par département (cercles)',
  },
  {
    to: '/map-demo-choropleth',
    label: 'Choroplèthe ratio 80+',
    description: 'Part des 80 ans et plus par département',
  },
  {
    to: '/map-demo-configurable',
    label: 'Choroplèthe configurable',
    description: 'Indicateur, niveau géographique et échelle au choix',
  },
  {
    to: '/melodi-benchmark',
    label: 'Benchmark CSV vs JSON',
    description: 'Poids et temps de parsing comparés',
    color: 'secondary',
  },
];

/**
 * Home page component listing the available demonstrations.
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
          {DEMOS.map((demo) => (
            <DemoLink key={demo.to} sx={{ mt: 3 }} {...demo} />
          ))}
        </Stack>
      </Box>
    </Paper>
  </Layout>
);

export default Home;
