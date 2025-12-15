# Démonstration Cartographique

## Vue d'ensemble

Page de démonstration interactive permettant de visualiser les données géographiques de l'API Melodi sur une carte interactive.

## Fonctionnalités implémentées

### 1. Carte interactive

- **MapLibre-GL** via `react-map-gl` pour le rendu cartographique
- Fond de carte : CartoDB Positron (style clair et épuré)
- Navigation : zoom, déplacement, rotation
- Centrage initial : France métropolitaine

### 2. Sélection de datasets

- **Autocomplete** Material-UI pour rechercher parmi les datasets
- Filtrage automatique des datasets locaux (préfixe `DS_`)
- ~82 datasets disponibles avec données géographiques potentielles
- Affichage du titre et de l'identifiant

### 3. Affichage des données

- Récupération automatique des données lors de la sélection
- Niveau géographique : **EPCI** (1 250 territoires)
- Filtres appliqués : `TIME_PERIOD=2022`, `SEX=_T`, `AGE=_T`
- Conversion en GeoJSON pour affichage sur la carte
- Représentation en points (cercles bleus)

### 4. Informations contextuelles

- Compteur de territoires affichés
- Nom du dataset sélectionné
- Gestion des états de chargement
- Affichage des erreurs éventuelles

## Architecture technique

### Composants utilisés

```jsx
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import { useCatalogAll } from '../hooks/useCatalog';
import { useAllTerritories } from '../hooks/useData';
```

### Flux de données

1. **Chargement du catalogue** → `useCatalogAll()`
2. **Filtrage des datasets** → Uniquement `DS_*`
3. **Sélection utilisateur** → Autocomplete
4. **Récupération des données** → `useAllTerritories()` avec React Query
5. **Transformation en GeoJSON** → `useMemo()`
6. **Affichage sur la carte** → Source + Layer

### Structure GeoJSON

```javascript
{
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        geo: '244400404',
        geoObject: 'EPCI',
        geoLib: 'Nantes Métropole',
        value: 656275,
      },
      geometry: {
        type: 'Point',
        coordinates: [0, 0], // À compléter avec vraies coordonnées
      },
    },
    // ...
  ],
}
```

## Limitations actuelles

### ⚠️ Géométries manquantes

**Problème** : Les coordonnées sont des placeholders `[0, 0]`

**Solutions possibles** :
1. **Fichier PMTiles** : Charger `epci.pmtiles` avec vraies géométries
2. **API externe** : Géocodage via API Geo
3. **Données statiques** : Fichier JSON de correspondance code → coordonnées

### 🔧 Niveau géographique fixe

Actuellement limité aux **EPCI**. Pour supporter d'autres niveaux :

```jsx
const [geoLevel, setGeoLevel] = useState('EPCI');

// Sélecteur de niveau
<Select value={geoLevel} onChange={e => setGeoLevel(e.target.value)}>
  <MenuItem value="COM">Communes (34 852)</MenuItem>
  <MenuItem value="EPCI">EPCI (1 250)</MenuItem>
  <MenuItem value="DEP">Départements (100)</MenuItem>
  <MenuItem value="REG">Régions (17)</MenuItem>
</Select>
```

### 📊 Représentation simplifiée

Actuellement : points bleus uniformes

**Améliorations possibles** :
- **Choroplèthe** : Colorier selon valeur (nécessite polygones)
- **Ronds proportionnels** : Taille selon valeur
- **Clustering** : Regroupement pour nombreux points
- **Popup** : Détails au clic/survol

## Améliorations futures

### Phase 1 : Géométries réelles

```jsx
// Charger PMTiles
import { Protocol } from 'pmtiles';
import maplibregl from 'maplibre-gl';

const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

// Dans Map component
<Source
  id="epci-contours"
  type="vector"
  url="pmtiles://./epci.pmtiles"
>
  <Layer
    id="epci-fill"
    source-layer="contour"
    type="fill"
    paint={{
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'value'],
        0, '#fee5d9',
        100000, '#a50f15'
      ],
      'fill-opacity': 0.7,
    }}
  />
</Source>
```

### Phase 2 : Visualisations avancées

- **Sélecteur de représentation** : Choroplèthe / Ronds proportionnels
- **Palette de couleurs** : Personnalisable
- **Classes de valeurs** : Ajustables (Jenks, quantiles, etc.)
- **Légende dynamique**

### Phase 3 : Interactivité

- **Tooltip** au survol
- **Panneau latéral** avec détails territoire
- **Filtres temporels** (années)
- **Filtres thématiques** (dimensions du dataset)
- **Export** : PNG, SVG, données

### Phase 4 : Multi-datasets

- **Comparaison** : 2 datasets côte à côte
- **Évolution temporelle** : Animation
- **Croisement** : Corrélations entre datasets

## Datasets recommandés pour test

### Population
- `DS_RP_POPULATION_PRINC` - Population par territoire
- `DS_ESTIMATION_POPULATION` - Estimations de population

### Économie
- `DS_FLORES_A17` - Établissements et effectifs salariés
- `DS_BPE` - Équipements (commerce, sport, santé)

### Social
- `DS_FILOSOFI_CC` - Niveau de vie et pauvreté
- `DS_RP_DIPLOMES_PRINC` - Diplômes et formation

### Tourisme
- `DS_TOUR_FREQ` - Fréquentation touristique
- `DS_TOUR_CAP` - Capacités d'hébergement

## Exemples de requêtes API utilisées

```http
# Dataset population par EPCI
https://api.insee.fr/melodi/data/DS_RP_POPULATION_PRINC?GEO=EPCI&TIME_PERIOD=2022&SEX=_T&AGE=_T

# Avec labels (range)
https://api.insee.fr/melodi/data/DS_RP_POPULATION_PRINC?GEO=EPCI&TIME_PERIOD=2022&SEX=_T&AGE=_T&range=true

# Metadata du dataset
https://api.insee.fr/melodi/range/DS_RP_POPULATION_PRINC
```

## Utilisation

1. **Accéder à la page** : Bouton "Cartographie" depuis l'accueil
2. **Sélectionner un dataset** : Autocomplete en haut de page
3. **Visualiser** : Les données s'affichent automatiquement
4. **Explorer** : Zoomer, déplacer la carte

## Dépendances

```json
{
  "maplibre-gl": "^5.x",
  "react-map-gl": "^7.x"
}
```

## Resources

- [MapLibre GL JS](https://maplibre.org/)
- [react-map-gl](https://visgl.github.io/react-map-gl/)
- [PMTiles](https://github.com/protomaps/PMTiles)
- [API Melodi](https://api.insee.fr/melodi)
