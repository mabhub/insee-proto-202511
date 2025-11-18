# Sélecteur de jeux de données - API Melodi

## 📋 Vue d'ensemble

Cette fonctionnalité permet de charger et explorer les jeux de données du catalogue Melodi (INSEE) via l'API REST. Elle propose **trois modes de sélection différents** pour démontrer diverses approches UX.

## 🚀 Accès

- **Page d'accueil** : `http://localhost:3001/`
- **Sélecteur de datasets** : `http://localhost:3001/dataset-selector`

## 🎯 Fonctionnalités implémentées

### 1. **Mode Autocomplete (Recherche)**

- Champ de recherche avec suggestions automatiques
- Filtrage par ID ou titre du dataset
- Affichage des détails du dataset sélectionné
- Chips pour visualiser les métadonnées (ID, thème)

### 2. **Mode Liste filtrée**

- Liste complète de tous les datasets
- Filtre en temps réel sur ID, titre et description
- Sélection par clic dans la liste
- Design compact pour parcourir rapidement

### 3. **Mode Grille (Cards)**

- Affichage en cartes visuelles (grid responsive)
- Limitation intelligente à 20 résultats pour la performance
- Effet hover et sélection visuelle
- Description tronquée avec ellipsis

## 🛠️ Architecture technique

### Structure des fichiers

```
src/
├── config/
│   └── api.js                 # Configuration API et query keys
├── services/
│   └── catalogService.js      # Service d'accès à l'API Melodi
├── hooks/
│   └── useCatalog.js          # Hooks React Query personnalisés
└── components/
    └── DatasetSelector.jsx    # Composant principal avec 3 modes
```

### Stack technique

- **React Query (TanStack Query)** : Gestion des requêtes API et cache
- **Material-UI v7** : Composants UI (Autocomplete, List, Grid, Tabs)
- **React Router v7** : Navigation entre pages
- **API Melodi** : `https://api.insee.fr/melodi`

### Hooks React Query créés

```javascript
// Charger tous les datasets
const { data: datasets, isLoading, error } = useCatalogAll();

// Charger un dataset par ID
const { data: dataset } = useCatalogById(id);

// Charger tous les IDs
const { data: ids } = useCatalogIds();

// Charger le range (dimensions) d'un dataset
const { data: range } = useDatasetRange(id);
```

### Configuration du cache

```javascript
// main.jsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                      // 1 tentative en cas d'échec
      refetchOnWindowFocus: false,   // Pas de refetch au focus
      staleTime: 5 * 60 * 1000,      // Données fraîches 5 minutes
    },
  },
});
```

## 🎨 Design patterns utilisés

### 1. **Composition de composants**

Chaque mode de sélection est un composant isolé :

- `SearchMode` : Autocomplete
- `ListMode` : Liste filtrée  
- `GridMode` : Grille de cartes

### 2. **State management local**

- État de sélection géré localement avec `useState`
- Filtres locaux avec `useMemo` pour la performance
- Callback `onSelect` pour remonter la sélection

### 3. **Progressive disclosure**

- Affichage limité initial (20 items en mode grille)
- Chargement lazy des détails
- Feedback visuel sur la sélection

## 📊 Performance

### Optimisations implémentées

1. **Mise en cache intelligente** (React Query)
   - Données en cache pendant 5 minutes
   - Pas de refetch inutile au focus

2. **Filtrage optimisé** (`useMemo`)
   - Recalcul uniquement si term ou datasets changent
   - Évite les re-renders inutiles

3. **Limitation d'affichage**
   - Mode grille : 20 cartes max
   - Évite le surcharge du DOM

4. **Virtualisation possible**
   - Architecture prête pour `react-window` si besoin
   - Liste peut gérer des milliers d'items

## 🔧 API Melodi utilisée

### Endpoint principal

```
GET https://api.insee.fr/melodi/catalog/all
```

### Structure des données

```typescript
interface Dataset {
  id: string;
  title?: { fr?: string; en?: string };
  abstract?: { fr?: string; en?: string };
  theme?: {
    code: string;
    libelle?: { fr?: string; en?: string };
  };
  // ... autres propriétés
}
```

## 🚧 Prochaines étapes suggérées

### Court terme

1. ✅ Ajouter un bouton "Retour" vers la page d'accueil
2. ✅ Implémenter le chargement des détails complets d'un dataset
3. ✅ Ajouter un export CSV/JSON des datasets filtrés

### Moyen terme

4. Intégrer l'API `/range/{id}` pour afficher les dimensions
5. Créer un formulaire de filtrage avancé (par thème, date, etc.)
6. Implémenter la visualisation des données avec `@mui/x-charts`

### Long terme

7. Ajouter la gestion des favoris (localStorage)
8. Implémenter un système de comparaison de datasets
9. Créer un builder de requêtes API avec filtres

## 📝 Notes techniques

### Gestion des erreurs du linter (oxlint)

Le linter préfère les default exports, mais les named exports sont utilisés ici car :

- **Convention moderne** en React
- **Tree-shaking** plus efficace
- **Refactoring** plus sûr (pas de renommage silencieux)
- **Autocomplete IDE** meilleur

Les warnings de lint n'empêchent pas l'exécution et sont considérés comme des recommandations de style.

### CORS et authentification

L'API Melodi est publique et ne nécessite pas d'authentification pour les endpoints du catalogue. En production, il faudrait potentiellement :

- Gérer les tokens d'accès
- Implémenter un proxy backend
- Ajouter des headers d'authentification

## 🧪 Tests à effectuer

- [ ] Chargement du catalogue complet
- [ ] Recherche et sélection dans chaque mode
- [ ] Comportement en cas d'erreur réseau
- [ ] Responsive design (mobile, tablette, desktop)
- [ ] Accessibilité clavier (Tab, Enter, Escape)
- [ ] Performance avec > 100 datasets

## 📚 Ressources

- [Documentation API Melodi](https://api.insee.fr/catalogue/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Material-UI Autocomplete](https://mui.com/material-ui/react-autocomplete/)
- [React Router v7](https://reactrouter.com/)
