# Prototype cartographie API Melodi

## 📋 Résumé exécutif

**Objectif** : Développer un prototype de cartographie interactive connecté à l'API Melodi pour démontrer la faisabilité technique et l'intérêt de migrer vers une solution moderne React/Vite.

**Périmètre initial** : Quelques indicateurs au niveau EPCI uniquement, extensible ultérieurement à d'autres niveaux géographiques et centaines d'indicateurs.

**Stack technique** : Vite + React + API Melodi

---

## 🎯 Objectifs du projet

### 1. Démonstration de faisabilité

Prouver qu'il est possible de se connecter à l'API Melodi pour créer des cartes interactives exploitant les données locales de l'Insee disponibles dans [le catalogue Melodi](https://catalogue-donnees.insee.fr).

### 2. Évaluation de la modernisation technique

Montrer l'intérêt de passer d'une application vanilla JS (comme [cartofine](https://github.com/cbobinec/carto-fine-front-bpe)) vers des frameworks modernes, en s'appuyant sur [l'expérimentation d'octobre 2024](https://github.com/makinacorpus/insee-proto-bpe).

### 3. Base pour évolution future

Créer un prototype extensible vers :

- D'autres niveaux géographiques (commune, département, région, zone d'emploi)
- Des centaines d'indicateurs issus de dizaines de jeux de données
- Un système comparable à [Statistiques locales](https://statistiques-locales.insee.fr/#view=map1&c=indicator)

---

## 🔧 Spécifications techniques

### API Melodi - Points clés

#### Ressources et documentation

- **[Catalogue de données](https://catalogue-donnees.insee.fr)** : ~40 jeux de données locaux exploitables
- **[Explorateur de données](https://catalogue-donnees.insee.fr/fr/explorateur/DS_RP_POPULATION_PRINC)** : Construction de requêtes filtrées (voir en bas de tableau)
- **[Documentation API](https://portail-api.insee.fr/catalog/api/a890b735-159c-4c91-90b7-35159c7c9126/doc)**

#### Caractéristiques de l'API

- **Format des données** : Cubes (croisements dimensions + mesure), principalement des volumes
- **Accès** :
  - Libre : 30 req/min (suffisant pour les tests)
  - Avec token : quotas plus élevés (disponible ultérieurement)
- **Format de retour** : XML par défaut, **JSON recommandé**
- **Calculs post-requête** : Simples (sommes, ratios pour évolutions/pourcentages)

#### ⚠️ Limitations et contraintes

- **Limite de résultats** : 10 000 lignes max par requête
  - Non bloquant pour EPCI (~1 250 territoires)
  - Problématique pour communes (~35 000 territoires) → nécessitera pagination ou hausse du seuil (à l'étude)

---

### Convention de nommage géographique

#### Variables Melodi standard

| Variable                         | Description                 | Exemple                                       |
|----------------------------------|-----------------------------|-----------------------------------------------|
| `GEO_OBJECT`                     | Code du niveau géographique | `"COM"`, `"EPCI"`, `"DEP"`, `"REG"`           |
| `GEO`                            | Identifiant du territoire   | `"44"` (Loire-Atlantique), `"44109"` (Nantes) |
| `GEO_LIB`                        | Libellé du territoire       | `"Loire-Atlantique"`, `"Nantes"`              |
| `OBS_VALUE` / `OBS_VALUE_NIVEAU` | Valeur de la mesure         | Valeur numérique                              |

#### Identifiant unique

Combinaison `GEO_OBJECT` + `GEO` :

- Exemple : `COM-44109` (commune de Nantes)
- Avec millésime (optionnel) : `2025-COM-44109` ≡ `COM-44109`

---

### Syntaxe des requêtes filtrées

#### Patterns de requêtage

| Type de requête                  | Syntaxe                 | Exemple                                                                                                          |
|----------------------------------|-------------------------|------------------------------------------------------------------------------------------------------------------|
| Tous les territoires d'un niveau | `GEO=<niveau>`          | [Populations par département](https://api.insee.fr/melodi/data/DS_POPULATIONS_REFERENCE?GEO=DEP)                 |
| Un territoire spécifique         | `GEO=<niveau>-<code>`   | [Population de Nantes](https://api.insee.fr/melodi/data/DS_POPULATIONS_REFERENCE?GEO=COM-44109)                  |
| Territoires englobés             | `GEO=<parent>*<enfant>` | [Communes de Nantes Métropole](https://api.insee.fr/melodi/data/DS_POPULATIONS_REFERENCE?GEO=EPCI-244400404*COM) |

⚠️ **Limitation emboîtement** : Fonctionne uniquement pour niveaux parfaitement imbriqués (pas EPCI d'un département car chevauchement possible)

---

### Récupération des libellés (ranges)

**Contexte** : Pour afficher les noms des territoires plutôt que leurs codes

**Méthode Melodi** : Utilisation des "ranges" de deux manières :

#### 1. Range complète d'un jeu de données

```http
https://api.insee.fr/melodi/range/DS_RP_EMPLOI_LR_PRINC
```

Récupère tous les libellés pour toutes les dimensions du jeu de données.

#### 2. Range sur requête filtrée

Ajout du paramètre `range=true` à une requête :

```http
https://api.insee.fr/melodi/data/DS_RP_POPULATION_PRINC?SEX=_T&AGE=Y_GE80&TIME_PERIOD=2022&GEO=EPCI&range=true
```

⚠️ **Limitation performance** :

- Retour très volumineux (>5 Mo dans les deux cas)
- Non optimal pour l'utilisation en production

**💡 Approche initiale retenue (18/11/2025)** :

- Phase 1 : Afficher uniquement les codes (GEO)
- Phase 2 : Implémenter les libellés après optimisation

---

## 🗺️ Ressources cartographiques

### Fichier PMTiles fourni : `epci.pmtiles`

**Contenu** :

- Couche `"contour"` : polygones des EPCI
- Couche `"centroides"` : points centraux des EPCI

**Attributs** (conformes aux conventions Melodi) :

- `GEO_OBJECT` : Type de territoire (`"EPCI"`)
- `GEO` : Code du territoire
- `GEO_LIB` : Libellé du territoire

**Évolution** : Même modèle prévu pour commune, département, région, etc.

---

## 📊 Modes de représentation cartographique

### 1. Choroplèthe (ratios/évolutions)

**Usage** : Indicateurs calculés (pourcentages, évolutions)

**Caractéristiques** :

- Remplissage coloré (`fill`) sur contours
- Palette de couleurs avec classes en `step`
- Seuils et nombre de classes :
  - Phase 1 : Fixés en dur (code ou fichier de config)
  - Phase 2 : Ajustables par l'utilisateur avec réactivité

**Exemple** : Part de la population de +80 ans

---

### 2. Ronds proportionnels (volumes)

**Usage** : Valeurs absolues brutes

**Caractéristiques** :

- Cercles positionnés sur centroïdes
- Rayon proportionnel à la valeur
- Réglage de proportion ajustable par utilisateur
- Code de référence : `test_rond_proportionnel.js:74`

**Exemple** : Population totale par EPCI

---

## 🎨 Indicateurs de test

### Indicateur 1 : Population 2022 par EPCI

**Type** : Valeur brute (volume)
**Calcul** : Aucun (donnée directe Melodi)
**Représentation** : Ronds proportionnels

**Requête API** :

```http
https://api.insee.fr/melodi/data/DS_RP_POPULATION_PRINC?SEX=_T&AGE=_T&TIME_PERIOD=2022&GEO=EPCI
```

**Résultat** : ~1 250 lignes (1 par EPCI)

---

### Indicateur 2 : Part des +80 ans en 2022 par EPCI

**Type** : Ratio calculé
**Calcul** : (Population +80 ans / Population totale) × 100
**Représentation** : Choroplèthe

**Requêtes API** :

1. **Numérateur** (population +80 ans) :

```http
https://api.insee.fr/melodi/data/DS_RP_POPULATION_PRINC?SEX=_T&AGE=Y_GE80&TIME_PERIOD=2022&GEO=EPCI
```

2. **Dénominateur** (population totale) :

```http
https://api.insee.fr/melodi/data/DS_RP_POPULATION_PRINC?SEX=_T&AGE=_T&TIME_PERIOD=2022&GEO=EPCI
```

3. **Requête combinée** (optimisée) :

```http
https://api.insee.fr/melodi/data/DS_RP_POPULATION_PRINC?SEX=_T&AGE=_T&AGE=Y_GE80&TIME_PERIOD=2022&GEO=EPCI
```

**Résultat** : ~2 500 lignes (requête combinée)

---

### Extension future

L'architecture doit permettre d'ajouter facilement de nouveaux indicateurs via configuration avec :

- Titre et thème
- Filtres Melodi
- Calculs éventuels
- Mode de représentation
- Paramètres de visualisation

⚠️ Approche retenue : Indicateurs paramétrés et sélectionnés (vs rendu automatique type OpenDataSoft)

---

## ✨ Fonctionnalités utilisateur

> Voir [maquette.png](maquette.png) pour référence visuelle

### Priorité 1 (P1) - MVP

#### Sélection d'indicateur

- Champ autocomplete avec regroupement par thème
- Un seul indicateur sélectionnable à la fois
- Référence UX : [menu thème du catalogue](https://catalogue-donnees.insee.fr/fr/catalogue/recherche)

#### Affichage des données

- Carte interactive avec indicateur choisi
- Liste/tableau des données affichées quelque part à l'écran

#### Paramètres de représentation réactifs

- **Si choroplèthe** : Ajustement des seuils de classes
- **Si ronds proportionnels** : Réglage de la taille maximale

---

### Priorité 2 (P2)

#### Niveau géographique

- Sélecteur de niveau (EPCI, commune, département, etc.)
- Changement dynamique de la carte
- *Note* : Non prioritaire pour le prototype (EPCI uniquement)

#### Tableau de données enrichi

- Tri
- Export
- Mise en forme avancée

#### Sélection multi-territoires

- Sélection de plusieurs EPCI (Ctrl+clic ou équivalent)
- Création d'un "zonage à façon"

---

### Priorité 3 (P3)

#### Persistance et partage de sélection

- URL avec paramètres
- Cookies / localStorage
- Faciliter le partage de vues personnalisées

#### Filtrage du tableau

- Afficher uniquement les territoires sélectionnés

#### Export cartographique

- Export PNG
- Export SVG

---

## ❓ Questions ouvertes

### 1. Architecture de récupération des données

**Question** : Appel direct à l'API ou cache intermédiaire ?

**Options** :

- **Direct (dynamique)** : Appel API à chaque changement d'indicateur
  - ✅ Données toujours à jour
  - ❌️ Latence, dépendance réseau, limite 30 req/min

- **Cache (semi-dynamique)** : Stockage intermédiaire des données fréquentes
  - ✅ Performance, résilience
  - ❌️ Complexité, fraîcheur des données

**Recommandation à définir** selon cas d'usage prioritaire

---

### 2. Gestion de la configuration des indicateurs

**Contexte** : cartofine utilise un unique `js/configuration.js` devenu difficile à maintenir

**Besoin** : Solution scalable pour gérer :

- Dizaines/centaines d'indicateurs
- Nombreux paramètres par indicateur
- Maintenance sans backoffice dédié

**Options à explorer** :

- Configuration multi-fichiers structurée (par thème ?)
- Format JSON/YAML déclaratif
- Validation de schéma
- Documentation auto-générée
- Import dynamique

**💡 Piste retenue (18/11/2025)** : Fichier de configuration externalisé hors application, récupéré dynamiquement par l'appli

---

## 📚 Ressources techniques

### Code source de référence

- **[cartofine](https://github.com/cbobinec/carto-fine-front-bpe)** : Code vanilla JS existant, éléments réutilisables
- **[proto-bpe](https://github.com/makinacorpus/insee-proto-bpe)** : Expérimentation React/Vite d'octobre 2024

### Fichiers cartographiques

- `epci.pmtiles` : Données géographiques EPCI (contours + centroïdes)

---

## 🏗️ Stack technique pressentie

- **Build** : Vite
- **Framework** : React
- **Carto** : À définir (MapLibre GL JS ?)
- **Format tuiles** : PMTiles
- **API** : Melodi (JSON)
