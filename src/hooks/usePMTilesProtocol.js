// src/hooks/usePMTilesProtocol.js
// Hook d'enregistrement/nettoyage du protocole PMTiles pour MapLibre
import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';

/**
 * Enregistre le protocole PMTiles au montage et le supprime au démontage.
 * Évite les conflits si plusieurs composants cartographiques sont montés/démontés.
 */
export const usePMTilesProtocol = () => {
  useEffect(() => {
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);
    return () => maplibregl.removeProtocol('pmtiles');
  }, []);
};
