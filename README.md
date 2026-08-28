# Proto INSEE - cartographie API Melodi

Prototype de cartographie interactive branché sur [l'API Melodi](https://portail-api.insee.fr/catalog/api/a890b735-159c-4c91-90b7-35159c7c9126/doc)
(données statistiques locales de l'Insee).

Une série de démos techniques, pas une application finie : chaque page isole une
question (modes de sélection, patterns de requêtage, rendu cartographique,
performance) pour évaluer la faisabilité d'une refonte React/Vite.

## Démarrage

```bash
nvm use          # Node 24, voir .nvmrc
npm install
npm run dev      # http://localhost:3000
```

Aucune clé d'API n'est nécessaire → l'API Melodi est en accès libre, plafonnée à
30 requêtes/minute.

## Démonstrations

Toutes accessibles depuis la page d'accueil.

| Route                        | Objet                                                        |
|------------------------------|--------------------------------------------------------------|
| `/dataset-selector`          | Trois modes de sélection d'un jeu de données (autocomplete, liste filtrée, grille) |
| `/api-demo`                  | Patterns de requêtes Melodi, calculs dérivés, comportement du cache |
| `/map-demo`                  | Visualisation géographique des données d'un dataset          |
| `/map-demo-static`           | Carte minimale sur données fictives, sans appel réseau       |
| `/map-demo-ign-cartefacile`  | Fond IGN via le composant `carte-facile`                     |
| `/map-demo-proportional`     | Ronds proportionnels → population par département            |
| `/map-demo-choropleth`       | Choroplèthe → part des 80 ans et plus par département        |
| `/map-demo-configurable`     | Choroplèthe avec indicateur, niveau géographique et échelle au choix |
| `/melodi-benchmark`          | Comparaison CSV vs JSON (poids et temps de parsing)          |
| `/bench-choropleth`          | Comparaison des stratégies de coloration `match` vs `setFeatureState` sur les communes |
| `/melodi-healthcheck`        | Valide que les requêtes de la configuration répondent        |

## Stack

- **React 19** + **Vite 7**, **MUI v7** pour l'UI
- **TanStack Query v5** pour le fetching et le cache
- **MapLibre GL** via **react-map-gl**, tuiles vectorielles au format **PMTiles**
- **carte-facile** pour les fonds IGN (isolé dans son propre chunk Rollup)
- **Vitest** + React Testing Library, **Oxlint**

## Organisation du code

```
src/
├── components/   # Une démo = un composant de page (+ ses sous-composants)
├── hooks/        # Wrappers TanStack Query, logique de fetching conditionnel
├── services/     # Appels à l'API Melodi (catalog, data, range)
├── helpers/      # Transformations de données, couleurs, paramètres Melodi
└── config/       # Config API, query keys, définition des indicateurs
```

Les composants ne parlent jamais directement aux services → toujours via un hook
de `src/hooks/`.

Les fonds cartographiques (`public/*.pmtiles`) sont versionnés dans le dépôt, d'où
son poids.

## Scripts

```bash
npm run build          # Build de production
npm run preview        # Servir le build
npm test               # Tests en mode watch
npm run test:coverage  # Rapport de couverture
npm run lint           # Oxlint
npm run bench:csv      # Benchmark CSV vs JSON en ligne de commande
```

HTTPS en développement : placer `key.pem` et `cert.pem` dans `~/https/`, puis
`VITE_HTTPS=true` dans `.env.local` (voir `.env.example`).
