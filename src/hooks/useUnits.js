import { useState, useCallback, useMemo } from 'react';
import { DEFAULT_PROFILE } from '../utils/constants';

/**
 * Default unit structure
 */
export const DEFAULT_UNIT = {
  name: 'New Unit',
  profiles: []
};

/**
 * useUnits - Custom hook for managing unit state
 * 
 * Units contain weapon profiles, allowing for organized list building
 */
export function useUnits(initialUnits = null) {
  // Start with empty array - user adds units via search
  const [units, setUnits] = useState(initialUnits || []);
  
  // Generate unique ID
  const generateId = useCallback(() => {
    return Date.now() + Math.random();
  }, []);
  
  // Add a new empty unit (legacy, kept for manual creation)
  const addUnit = useCallback(() => {
    const newId = generateId();
    setUnits(prev => [...prev, {
      id: newId,
      name: 'New Unit',
      profiles: []
    }]);
  }, [generateId]);
  
  // Add a unit with pre-loaded data (name and profiles)
  // This is the NEW primary way to add units
  const addUnitWithData = useCallback((unitData) => {
    const newId = generateId();
    const profiles = (unitData.profiles || []).map(p => ({
      // Defaults for all ability flags
      modelCount: 1,
      torrent: false,
      heavy: false,
      hitMod: 0,
      rerollHits: 'none',
      critHitOn: 6,
      lance: false,
      woundMod: 0,
      twinLinked: false,
      rerollWounds: 'none',
      critWoundOn: 6,
      sustainedHits: 0,
      lethalHits: false,
      devastatingWounds: false,
      antiKeyword: null,
      melta: 0,
      rapidFire: 0,
      ignoresCover: false,
      blast: false,
      // Override with provided data
      ...p,
      // Always generate new ID
      id: generateId(),
    }));
    
    setUnits(prev => [...prev, {
      id: newId,
      name: unitData.name || 'New Unit',
      profiles,
    }]);
  }, [generateId]);
  
  // Update a unit
  const updateUnit = useCallback((unitId, updates) => {
    setUnits(prev => prev.map(u => 
      u.id === unitId ? { ...u, ...updates } : u
    ));
  }, []);
  
  // Remove a unit
  const removeUnit = useCallback((unitId) => {
    setUnits(prev => prev.filter(u => u.id !== unitId));
  }, []);
  
  // Duplicate a unit
  const duplicateUnit = useCallback((unitId) => {
    setUnits(prev => {
      const unit = prev.find(u => u.id === unitId);
      if (!unit) return prev;
      
      const newUnit = {
        ...unit,
        id: generateId(),
        name: `${unit.name} (Copy)`,
        profiles: unit.profiles.map(p => ({
          ...p,
          id: generateId(),
        }))
      };
      
      const index = prev.findIndex(u => u.id === unitId);
      const newUnits = [...prev];
      newUnits.splice(index + 1, 0, newUnit);
      return newUnits;
    });
  }, [generateId]);
  
  // Add a weapon profile to a unit
  const addProfile = useCallback((unitId, initialData = null) => {
    setUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      
      // If initialData is provided, use it; otherwise create defaults
      const newProfile = initialData 
        ? {
            // Start with defaults for any missing fields
            modelCount: 1,
            torrent: false,
            heavy: false,
            hitMod: 0,
            rerollHits: 'none',
            critHitOn: 6,
            lance: false,
            woundMod: 0,
            twinLinked: false,
            rerollWounds: 'none',
            critWoundOn: 6,
            sustainedHits: 0,
            lethalHits: false,
            devastatingWounds: false,
            antiKeyword: null,
            antiValue: null,
            melta: 0,
            rapidFire: 0,
            ignoresCover: false,
            blast: false,
            // Override with provided data
            ...initialData,
            // Always generate a new ID
            id: generateId(),
          }
        : {
            id: generateId(),
            name: `Weapon ${u.profiles.length + 1}`,
            attacks: 1,
            modelCount: 1,
            bs: 3,
            strength: 4,
            ap: 0,
            damage: 1,
            // Hit modifiers
            torrent: false,
            heavy: false,
            hitMod: 0,
            rerollHits: 'none',
            critHitOn: 6,
            // Wound modifiers
            lance: false,
            woundMod: 0,
            twinLinked: false,
            rerollWounds: 'none',
            critWoundOn: 6,
            // Critical abilities
            sustainedHits: 0,
            lethalHits: false,
            devastatingWounds: false,
            antiKeyword: null,
            antiValue: null,
            // Range/other
            melta: 0,
            rapidFire: 0,
            ignoresCover: false,
            blast: false,
          };
      
      return {
        ...u,
        profiles: [...u.profiles, newProfile]
      };
    }));
  }, [generateId]);
  
  // Replace all profiles for a unit (useful for loading a full loadout)
  const setUnitProfiles = useCallback((unitId, newProfiles) => {
    setUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      
      return {
        ...u,
        profiles: newProfiles.map(p => ({
          // Defaults
          modelCount: 1,
          bs: 4,
          torrent: false,
          heavy: false,
          hitMod: 0,
          rerollHits: 'none',
          critHitOn: 6,
          lance: false,
          woundMod: 0,
          twinLinked: false,
          rerollWounds: 'none',
          critWoundOn: 6,
          sustainedHits: 0,
          lethalHits: false,
          devastatingWounds: false,
          antiKeyword: null,
          antiValue: null,
          melta: 0,
          rapidFire: 0,
          ignoresCover: false,
          blast: false,
          // Override with provided data
          ...p,
          // Always generate a new ID
          id: generateId(),
        }))
      };
    }));
  }, [generateId]);
  
  // Update a weapon profile
  const updateProfile = useCallback((unitId, profileId, updates) => {
    setUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      
      return {
        ...u,
        profiles: u.profiles.map(p =>
          p.id === profileId ? { ...p, ...updates } : p
        )
      };
    }));
  }, []);
  
  // Remove a weapon profile
  const removeProfile = useCallback((unitId, profileId) => {
    setUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      
      return {
        ...u,
        profiles: u.profiles.filter(p => p.id !== profileId)
      };
    }));
  }, []);
  
  // Clear all profiles from a unit
  const clearProfiles = useCallback((unitId) => {
    setUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      return { ...u, profiles: [] };
    }));
  }, []);
  
  // Reset to empty
  const resetUnits = useCallback(() => {
    setUnits([]);
  }, []);
  
  // Get flattened profiles for calculations (backwards compatible)
  const allProfiles = useMemo(() => {
    return units.flatMap(u => u.profiles);
  }, [units]);
  
  // Get total model count across all units
  const totalModels = useMemo(() => {
    return units.reduce((sum, u) => {
      const unitModels = u.profiles.reduce((pSum, p) => pSum + (p.modelCount || 1), 0);
      return sum + unitModels;
    }, 0);
  }, [units]);
  
  return {
    units,
    setUnits,
    addUnit,
    addUnitWithData,  // NEW: primary way to add units
    updateUnit,
    removeUnit,
    duplicateUnit,
    addProfile,
    setUnitProfiles,
    clearProfiles,
    updateProfile,
    removeProfile,
    resetUnits,
    // Computed
    allProfiles,
    totalModels,
  };
}

export default useUnits;