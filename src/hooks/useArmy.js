import { useState, useCallback, useMemo, useEffect } from 'react';

/**
 * useArmy - Unified army state management hook
 * 
 * Consolidates:
 * - Imported army data (from text paste)
 * - Unit selection (checkboxes in sidebar)
 * - Composition (leader attachments, transport embarking)
 * - Computed values (composed units, selected units with weapons)
 */
export function useArmy() {
  // Core army data
  const [importedArmy, setImportedArmy] = useState(null);
  const [wahapediaUnits, setWahapediaUnits] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Selection state - which units are "active" for analysis
  const [selectedUnitIds, setSelectedUnitIds] = useState(new Set());
  
  // Composition state
  const [attachments, setAttachments] = useState({}); // leaderId -> squadId
  const [embarked, setEmbarked] = useState({});       // unitId -> transportId
  
  // Sidebar UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Profile overrides - user-applied modifiers to weapons
  // Key: profileId (e.g., "0-Beast Snagga Boy-Choppa")
  // Value: { rerollHits: 'all', sustainedHits: 2, etc. }
  const [profileOverrides, setProfileOverrides] = useState({});

  // Unit overrides - modifiers applied to all weapons in a unit
  // Key: unitOriginalIndex (e.g., 0, 1, 2)
  // Value: { rerollHits: 'all', lance: true, etc. }
  const [unitOverrides, setUnitOverrides] = useState({});

  // Army overrides - modifiers applied to ALL weapons in the army
  // Single object: { rerollHits: 'all', sustainedHits: 1, etc. }
  const [armyOverrides, setArmyOverrides] = useState({});
  
  // Load Wahapedia data on mount
  useEffect(() => {
    async function loadWahapediaData() {
      try {
        const res = await fetch('/data/units.json');
        if (res.ok) {
          const units = await res.json();
          setWahapediaUnits(units);
        }
      } catch (err) {
        console.error('Failed to load Wahapedia data:', err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadWahapediaData();
  }, []);
  
  // All units (from imported army)
  const units = useMemo(() => {
    return importedArmy?.units || [];
  }, [importedArmy]);
  
  // Categorized units
  const { leaders, squads, transports } = useMemo(() => {
    const leaders = [];
    const squads = [];
    const transports = [];
    
    units.forEach((unit, index) => {
      const unitWithIndex = { ...unit, originalIndex: index };
      
      if (unit.section === 'characters') {
        leaders.push(unitWithIndex);
      } else if (isTransport(unit)) {
        transports.push(unitWithIndex);
      } else {
        squads.push(unitWithIndex);
      }
    });
    
    return { leaders, squads, transports };
  }, [units]);
  
  // Display names with disambiguation for duplicates
  const displayNames = useMemo(() => {
    const names = new Map();
    const nameCounts = {};
    const nameIndices = {};
    
    units.forEach(unit => {
      nameCounts[unit.name] = (nameCounts[unit.name] || 0) + 1;
    });
    
    units.forEach((unit, index) => {
      if (nameCounts[unit.name] > 1) {
        nameIndices[unit.name] = (nameIndices[unit.name] || 0) + 1;
        names.set(index, `${unit.name} (${nameIndices[unit.name]})`);
      } else {
        names.set(index, unit.name);
      }
    });
    
    return names;
  }, [units]);
  
  // Selected units (filtered by checkbox selection)
  const selectedUnits = useMemo(() => {
    if (selectedUnitIds.size === 0) return [];
    return units.filter((_, index) => selectedUnitIds.has(index));
  }, [units, selectedUnitIds]);
  
  // Composed units: squads with their attached leaders merged in
  const composedUnits = useMemo(() => {
    // Start with non-leader units
    const composed = squads.map(squad => {
      const attachedLeaders = Object.entries(attachments)
        .filter(([_, squadIdx]) => squadIdx === squad.originalIndex)
        .map(([leaderIdx]) => units[parseInt(leaderIdx)])
        .filter(Boolean);
      
      if (attachedLeaders.length === 0) {
        return squad;
      }
      
      // Merge leader weapons into squad
      const mergedModels = [...squad.models];
      attachedLeaders.forEach(leader => {
        mergedModels.push(...(leader.models || []));
      });
      
      return {
        ...squad,
        attachedLeaders,
        models: mergedModels,
        composedPoints: squad.points + attachedLeaders.reduce((sum, l) => sum + l.points, 0),
      };
    });
    
    // Add unattached leaders
    const attachedLeaderIds = new Set(Object.keys(attachments).map(Number));
    const unattachedLeaders = leaders.filter(l => !attachedLeaderIds.has(l.originalIndex));
    
    return [...composed, ...unattachedLeaders, ...transports];
  }, [squads, leaders, transports, attachments, units]);
  
  // Selected composed units for damage calculations
  const selectedComposedUnits = useMemo(() => {
    if (selectedUnitIds.size === 0) return [];
    
    return composedUnits.filter(unit => {
      // Check if the unit itself is selected
      if (selectedUnitIds.has(unit.originalIndex)) return true;
      
      // Check if any attached leader is selected (include the whole composed unit)
      if (unit.attachedLeaders) {
        return unit.attachedLeaders.some(l => selectedUnitIds.has(l.originalIndex));
      }
      
      return false;
    });
  }, [composedUnits, selectedUnitIds]);
  
  // Transform units to format expected by TargetUnitTab
  // TargetUnitTab expects: unit.profiles[] (flat weapon list with IDs)
  // We have: unit.models[].weapons[] (nested structure)
  // Applies cascading overrides: armyOverrides -> unitOverrides -> profileOverrides
  const unitsForCalculator = useMemo(() => {
    // Helper to filter only applicable modifiers for army/unit level
    // (excludes weapon-specific modifiers like torrent, melta, rapidFire, blast, antiKeyword)
    // Also handles melee/ranged filtering for sustained/lethal hits
    const filterHighLevelOverrides = (overrides, weaponType) => {
      if (!overrides) return {};
      const {
        torrent, melta, rapidFire, blast, antiKeyword, twinLinked,
        sustainedHitsFilter, lethalHitsFilter,
        ...applicable
      } = overrides;

      // Check if sustained hits should apply based on weapon type filter
      if (applicable.sustainedHits && sustainedHitsFilter && sustainedHitsFilter !== 'all') {
        if (sustainedHitsFilter !== weaponType) {
          delete applicable.sustainedHits;
        }
      }

      // Check if lethal hits should apply based on weapon type filter
      if (applicable.lethalHits && lethalHitsFilter && lethalHitsFilter !== 'all') {
        if (lethalHitsFilter !== weaponType) {
          delete applicable.lethalHits;
        }
      }

      return applicable;
    };

    return selectedComposedUnits.map(unit => {
      // Flatten models.weapons into profiles array
      const profiles = [];
      unit.models?.forEach(model => {
        model.weapons?.forEach(weapon => {
          // weapon.count is already the TOTAL number of this weapon type
          // (e.g., "20x Choppa" means 20 Choppas total, not 20 per model)
          const weaponCount = weapon.count || 1;
          const profileId = `${unit.originalIndex}-${model.name}-${weapon.name}`;
          const weaponType = weapon.type || 'ranged'; // default to ranged if not specified

          // Get applicable army and unit overrides (filtered by weapon type)
          const applicableArmyOverrides = filterHighLevelOverrides(armyOverrides, weaponType);
          const applicableUnitOverrides = filterHighLevelOverrides(unitOverrides[unit.originalIndex], weaponType);

          // Get any user overrides for this profile (weapon-level)
          const weaponOverrides = profileOverrides[profileId] || {};

          profiles.push({
            id: profileId,
            name: weapon.name,
            type: weaponType,
            attacks: weapon.attacks || '1',
            bs: weapon.bs || 4,
            strength: weapon.strength || 4,
            ap: weapon.ap || 0,
            damage: weapon.damage || '1',
            modelCount: weaponCount,
            // Weapon abilities - base values from parsed data
            torrent: weapon.torrent || false,
            heavy: weapon.heavy || false,
            lethalHits: weapon.lethalHits || false,
            devastatingWounds: weapon.devastatingWounds || false,
            sustainedHits: weapon.sustainedHits || 0,
            twinLinked: weapon.twinLinked || false,
            antiKeyword: weapon.antiKeyword || null,
            melta: weapon.melta || 0,
            rapidFire: weapon.rapidFire || 0,
            ignoresCover: weapon.ignoresCover || false,
            blast: weapon.blast || false,
            lance: weapon.lance || false,
            // Default modifier values
            hitMod: 0,
            rerollHits: 'none',
            critHitOn: 6,
            woundMod: 0,
            rerollWounds: 'none',
            critWoundOn: 6,
            // Dice rerolls
            rerollShots: 'none',
            rerollDamage: 'none',
            active: true,
            // Cascade overrides: army -> unit -> weapon (lower levels override higher)
            ...applicableArmyOverrides,
            ...applicableUnitOverrides,
            ...weaponOverrides,
          });
        });
      });

      return {
        id: unit.originalIndex,
        name: displayNames.get(unit.originalIndex) || unit.name,
        active: true,
        profiles,
      };
    });
  }, [selectedComposedUnits, displayNames, profileOverrides, unitOverrides, armyOverrides]);
  
  // Weapon profiles from selected units (for damage calculator)
  // Now derives from unitsForCalculator to ensure overrides are applied consistently
  const selectedProfiles = useMemo(() => {
    return unitsForCalculator
      .flatMap(unit => unit.profiles.map(profile => ({
        ...profile,
        unitId: unit.id,
        unitName: unit.name,
      })))
      .filter(p => p.active !== false);
  }, [unitsForCalculator]);
  
  // Match statistics
  const matchStats = useMemo(() => {
    return importedArmy?._matchStats || null;
  }, [importedArmy]);
  
  // Army statistics
  const armyStats = useMemo(() => {
    if (!importedArmy) return null;
    
    const totalPoints = units.reduce((sum, u) => sum + (u.points || 0), 0);
    const totalModels = units.reduce((sum, u) => {
      return sum + (u.models?.reduce((mSum, m) => mSum + (m.count || 1), 0) || 0);
    }, 0);
    
    return {
      totalUnits: units.length,
      totalPoints,
      totalModels,
      selectedCount: selectedUnitIds.size,
      armyName: importedArmy.armyName || 'Unnamed Army',
      faction: importedArmy.faction || '',
      detachment: importedArmy.detachment || '',
    };
  }, [importedArmy, units, selectedUnitIds]);
  
  // ============ ACTIONS (useCallbacks) ============
  
  const importArmy = useCallback((armyData) => {
    setImportedArmy(armyData);
    // Reset selection, composition, and all overrides
    setSelectedUnitIds(new Set());
    setAttachments({});
    setEmbarked({});
    setProfileOverrides({});
    setUnitOverrides({});
    setArmyOverrides({});
  }, []);
  
  const clearArmy = useCallback(() => {
    setImportedArmy(null);
    setSelectedUnitIds(new Set());
    setAttachments({});
    setEmbarked({});
    setProfileOverrides({});
    setUnitOverrides({});
    setArmyOverrides({});
  }, []);
  
  // Update a single profile's modifiers
  const updateProfileOverride = useCallback((profileId, overrides) => {
    setProfileOverrides(prev => ({
      ...prev,
      [profileId]: { ...(prev[profileId] || {}), ...overrides }
    }));
  }, []);
  
  // Reset all profile overrides
  const resetProfileOverrides = useCallback(() => {
    setProfileOverrides({});
  }, []);

  // Update a single unit's modifiers
  const updateUnitOverride = useCallback((unitIndex, overrides) => {
    setUnitOverrides(prev => ({
      ...prev,
      [unitIndex]: { ...(prev[unitIndex] || {}), ...overrides }
    }));
  }, []);

  // Reset a single unit's overrides
  const resetUnitOverride = useCallback((unitIndex) => {
    setUnitOverrides(prev => {
      const next = { ...prev };
      delete next[unitIndex];
      return next;
    });
  }, []);

  // Reset all unit overrides
  const resetUnitOverrides = useCallback(() => {
    setUnitOverrides({});
  }, []);

  // Update army-wide modifiers
  const updateArmyOverride = useCallback((overrides) => {
    setArmyOverrides(prev => ({ ...prev, ...overrides }));
  }, []);

  // Reset army overrides
  const resetArmyOverrides = useCallback(() => {
    setArmyOverrides({});
  }, []);

  // Reset all overrides (army, unit, and profile)
  const resetAllOverrides = useCallback(() => {
    setProfileOverrides({});
    setUnitOverrides({});
    setArmyOverrides({});
  }, []);
  
  const toggleUnit = useCallback((unitIndex) => {
    setSelectedUnitIds(prev => {
      const next = new Set(prev);
      if (next.has(unitIndex)) {
        next.delete(unitIndex);
      } else {
        next.add(unitIndex);
      }
      return next;
    });
  }, []);
  
  const selectAll = useCallback(() => {
    setSelectedUnitIds(new Set(units.map((_, i) => i)));
  }, [units]);
  
  const deselectAll = useCallback(() => {
    setSelectedUnitIds(new Set());
  }, []);
  
  const attachLeader = useCallback((leaderIndex, squadIndex) => {
    setAttachments(prev => {
      const next = { ...prev };
      if (squadIndex === null) {
        delete next[leaderIndex];
      } else {
        next[leaderIndex] = squadIndex;
      }
      return next;
    });
  }, []);
  
  const embarkUnit = useCallback((unitIndex, transportIndex) => {
    setEmbarked(prev => {
      const next = { ...prev };
      if (transportIndex === null) {
        delete next[unitIndex];
      } else {
        next[unitIndex] = transportIndex;
      }
      return next;
    });
  }, []);
  
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);
  
  // Helper to get display name
  const getDisplayName = useCallback((index) => {
    return displayNames.get(index) || units[index]?.name || 'Unknown';
  }, [displayNames, units]);

  return {
    // State
    importedArmy,
    wahapediaUnits,
    isLoadingData,
    sidebarCollapsed,

    // Units
    units,
    leaders,
    squads,
    transports,
    composedUnits,

    // Selection
    selectedUnitIds,
    selectedUnits,
    selectedComposedUnits,
    selectedProfiles,
    unitsForCalculator,

    // Composition
    attachments,
    embarked,

    // Overrides (cascading: army -> unit -> profile)
    profileOverrides,
    unitOverrides,
    armyOverrides,

    // Computed
    displayNames,
    matchStats,
    armyStats,

    // Actions
    importArmy,
    clearArmy,
    toggleUnit,
    selectAll,
    deselectAll,
    attachLeader,
    embarkUnit,
    toggleSidebar,
    getDisplayName,
    // Profile (weapon) level
    updateProfileOverride,
    resetProfileOverrides,
    // Unit level
    updateUnitOverride,
    resetUnitOverride,
    resetUnitOverrides,
    // Army level
    updateArmyOverride,
    resetArmyOverrides,
    // Reset all
    resetAllOverrides,
  };
}

/**
 * Check if a unit can transport other units
 * 
 * Detection priority:
 * 1. Section from army list parser (most reliable - "DEDICATED TRANSPORTS" section)
 * 2. Ability text containing transport-related keywords
 * 
 * We intentionally do NOT hardcode unit names - that's unmaintainable.
 */
function isTransport(unit) {
  // Primary: Army list parser sets section = 'transports' for DEDICATED TRANSPORTS
  if (unit.section === 'transports') return true;
  
  // Secondary: Check abilities for transport-related text
  if (unit.abilities && Array.isArray(unit.abilities)) {
    for (const ability of unit.abilities) {
      const desc = (ability.description || '').toLowerCase();
      const name = (ability.name || '').toLowerCase();
      
      // Look for functional keywords that indicate transport capability
      if (
        name.includes('transport') ||
        desc.includes('transport capacity') || 
        desc.includes('can transport') ||
        desc.includes('models can embark') ||
        (desc.includes('embark') && desc.includes('disembark'))
      ) {
        return true;
      }
    }
  }
  
  return false;
}

export default useArmy;