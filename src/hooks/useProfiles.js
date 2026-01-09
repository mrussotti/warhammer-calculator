import { useState, useCallback } from 'react';
import { DEFAULT_PROFILE } from '../utils/constants';

/**
 * useProfiles - Custom hook for managing weapon profile state
 * 
 * Encapsulates all profile CRUD operations for cleaner component code
 */
export function useProfiles(initialProfiles = null) {
  const [profiles, setProfiles] = useState(
    initialProfiles || [{ id: 1, ...DEFAULT_PROFILE }]
  );
  
  const addProfile = useCallback(() => {
    const newId = Math.max(...profiles.map(p => p.id), 0) + 1;
    setProfiles(prev => [...prev, {
      id: newId,
      name: `Weapon ${newId}`,
      attacks: 1,
      bs: 3,
      strength: 4,
      ap: 0,
      damage: '1'
    }]);
  }, [profiles]);
  
  const updateProfile = useCallback((id, updated) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...updated, id } : p));
  }, []);
  
  const removeProfile = useCallback((id) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  }, []);
  
  const resetProfiles = useCallback(() => {
    setProfiles([{ id: 1, ...DEFAULT_PROFILE }]);
  }, []);
  
  return {
    profiles,
    setProfiles,
    addProfile,
    updateProfile,
    removeProfile,
    resetProfiles,
  };
}

export default useProfiles;
