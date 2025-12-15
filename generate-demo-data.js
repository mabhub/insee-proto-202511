// Script temporaire pour générer des données fictives
import fs from 'fs';

// Lit les codes EPCI réels depuis le fichier CSV
const loadRealEPCICodes = () => {
  const csvContent = fs.readFileSync('./temp/epci.csv', 'utf-8');
  return csvContent.trim().split('\n').filter(code => code.length > 0);
};

// Génère des valeurs avec une distribution réaliste
const generateValues = (epciCodes, { min, max, decimals = 0 }) => {
  const data = {};
  epciCodes.forEach(code => {
    const value = min + Math.random() * (max - min);
    data[code] = decimals > 0 
      ? Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
      : Math.round(value);
  });
  return data;
};

// Génère le fichier de données
const generateDemoData = () => {
  const epciCodes = loadRealEPCICodes();
  console.log(`✓ Chargé ${epciCodes.length} codes EPCI réels depuis temp/epci.csv`);

  const datasets = [
    {
      id: "population-fictive",
      title: "Population fictive par EPCI",
      description: "Données de population simulées pour démonstration",
      data: generateValues(epciCodes, { min: 5000, max: 500000 })
    },
    {
      id: "densite-fictive",
      title: "Densité de population (hab/km²)",
      description: "Densité de population simulée",
      data: generateValues(epciCodes, { min: 20, max: 1200 })
    },
    {
      id: "revenus-fictifs",
      title: "Revenu médian par ménage (€)",
      description: "Revenus médians simulés",
      data: generateValues(epciCodes, { min: 18000, max: 45000 })
    },
    {
      id: "emploi-fictif",
      title: "Taux d'emploi (%)",
      description: "Taux d'emploi simulé",
      data: generateValues(epciCodes, { min: 50, max: 80, decimals: 1 })
    },
    {
      id: "chomage-fictif",
      title: "Taux de chômage (%)",
      description: "Taux de chômage simulé",
      data: generateValues(epciCodes, { min: 4, max: 15, decimals: 1 })
    },
    {
      id: "logements-fictifs",
      title: "Nombre de logements",
      description: "Nombre de logements simulé",
      data: generateValues(epciCodes, { min: 2000, max: 250000 })
    }
  ];

  const output = {
    datasets
  };

  fs.writeFileSync(
    './public/demo-data.json',
    JSON.stringify(output, null, 2),
    'utf-8'
  );

  console.log(`✓ Généré données fictives pour ${epciCodes.length} EPCI avec ${datasets.length} datasets`);
  console.log(`✓ Fichier sauvegardé: public/demo-data.json`);
};

generateDemoData();
