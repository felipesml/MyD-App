import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CHILE_REGIONS = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana',
  'O\'Higgins',
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes',
];

interface RegionContextType {
  selectedRegions: string[];
  setSelectedRegions: (regions: string[]) => Promise<void>;
  toggleRegion: (region: string) => Promise<void>;
  clearRegions: () => Promise<void>;
  selectAllRegions: () => Promise<void>;
  getFilteredRegions: () => string[];
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export const RegionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedRegions, setSelectedRegionsState] = useState<string[]>([]);

  useEffect(() => {
    loadRegionPreferences();
  }, []);

  const loadRegionPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem('selected_regions');
      if (saved) {
        setSelectedRegionsState(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading region preferences:', error);
    }
  };

  const setSelectedRegions = async (regions: string[]) => {
    try {
      await AsyncStorage.setItem('selected_regions', JSON.stringify(regions));
      setSelectedRegionsState(regions);
    } catch (error) {
      console.error('Error saving region preferences:', error);
    }
  };

  const toggleRegion = async (region: string) => {
    const newRegions = selectedRegions.includes(region)
      ? selectedRegions.filter((r) => r !== region)
      : [...selectedRegions, region];
    await setSelectedRegions(newRegions);
  };

  const clearRegions = async () => {
    await setSelectedRegions([]);
  };

  const selectAllRegions = async () => {
    await setSelectedRegions([...CHILE_REGIONS]);
  };

  const getFilteredRegions = () => {
    // If no regions selected, return all regions
    return selectedRegions.length > 0 ? selectedRegions : CHILE_REGIONS;
  };

  return (
    <RegionContext.Provider
      value={{
        selectedRegions,
        setSelectedRegions,
        toggleRegion,
        clearRegions,
        selectAllRegions,
        getFilteredRegions,
      }}
    >
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
};
