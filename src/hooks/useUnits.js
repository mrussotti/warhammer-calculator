import { useState, useCallback, useMemo } from 'react';
import { DEFAULT_PROFILE } from '../utils/constants';

/**
 * Default unit structure
 */
export const DEFAULT_UNIT = {
  name: 'Intercessor Squad',
  profiles: [
    { 
      id: 1, 
      ...DEFAULT_PROFILE,
      name: 'Bolt Rifle',
      modelCount: 5,
    }
  ]
};

/**
 * useUnits - Custom hook for managing unit state
 * 
 * Units contain weapon profiles, allowing for organized list building
 */
export function useUnits(initialUnits = null) {
  const [units, setUnits] = useState(
    initialUnits || [{ id: 1, ...DEFAULT_UNIT }]
  );
  
  // Generate unique ID
  const generateId = useCallback(() => {
    return Date.now() + Math.random();
  }, []);
  
  // Add a new unit
  const addUnit = useCallback(() => {
    const newId = generateId();
    setUnits(prev => [...prev, {
      id: newId,
      name: `Unit ${prev.length + 1}`,
      profiles: [{
        id: generateId(),
        name: 'Weapon 1',
        attacks: 1,
        modelCount: 1,
        bs: 3,
        strength: 4,
        ap: 0,
        damage: '1',
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
        // Range/other
        melta: 0,
        rapidFire: 0,
        ignoresCover: false,
        blast: false,
      }]
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
  const addProfile = useCallback((unitId) => {
    setUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      
      return {
        ...u,
        profiles: [...u.profiles, {
          id: generateId(),
          name: `Weapon ${u.profiles.length + 1}`,
          attacks: 1,
          modelCount: 1,
          bs: 3,
          strength: 4,
          ap: 0,
          damage: '1',
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
          // Range/other
          melta: 0,
          rapidFire: 0,
          ignoresCover: false,
          blast: false,
        }]
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
  
  // Reset to default
  const resetUnits = useCallback(() => {
    setUnits([{ id: generateId(), ...DEFAULT_UNIT }]);
  }, [generateId]);
  
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
    updateUnit,
    removeUnit,
    duplicateUnit,
    addProfile,
    updateProfile,
    removeProfile,
    resetUnits,
    // Computed
    allProfiles,
    totalModels,
  };
}

export default useUnits;