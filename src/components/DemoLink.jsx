// src/components/DemoLink.jsx
// Lien de démonstration de l'accueil : bouton + légende. Structure commune à
// toutes les entrées listées dans Home.
import { Link as RouterLink } from 'react-router';
import { Box, Button, Typography } from '@mui/material';

/**
 * Un lien de démonstration : bouton vers une route + légende dessous.
 *
 * Toute prop additionnelle (sx, className, data-*, etc.) est transmise au
 * <Box> racine, ce qui permet d'ajuster l'espacement ou le style depuis le
 * parent sans modifier ce composant.
 *
 * @param {Object} props
 * @param {string} props.to - Route cible
 * @param {string} props.label - Libellé du bouton
 * @param {string} props.description - Légende sous le bouton
 * @param {React.ReactElement} [props.icon] - Icône optionnelle de début
 * @param {'outlined'|'contained'} [props.variant='outlined'] - Variante du bouton
 * @param {'primary'|'secondary'} [props.color='primary'] - Couleur du bouton
 * @returns {React.ReactElement}
 */
const DemoLink = ({ to, label, description, icon, variant = 'outlined', color = 'primary', ...rest }) => (
  <Box textAlign="center" {...rest}>
    <Button
      component={RouterLink}
      to={to}
      variant={variant}
      color={color}
      size="large"
      startIcon={icon}
    >
      {label}
    </Button>
    <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
      {description}
    </Typography>
  </Box>
);

export default DemoLink;
