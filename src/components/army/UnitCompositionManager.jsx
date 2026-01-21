import { useState, useMemo, useCallback } from 'react';

/**
 * UnitCompositionManager - Unified composition view
 * 
 * Features:
 * - Disambiguates duplicate unit names: "Flash Gitz (1)", "Flash Gitz (2)"
 * - Shows points in dropdowns for additional clarity
 * - Detects transports by abilities, not just section
 */

/**
 * Check if a unit can transport other units
 */
function canTransport(unit) {
  if (unit.section === 'transports') return true;
  
  if (unit.abilities && Array.isArray(unit.abilities)) {
    for (const ability of unit.abilities) {
      const desc = (ability.description || '').toLowerCase();
      const name = (ability.name || '').toLowerCase();
      if (
        desc.includes('transport capacity') || 
        desc.includes('can transport') ||
        desc.includes('models can embark') ||
        name.includes('transport')
      ) {
        return true;
      }
    }
  }
  
  const unitName = (unit.name || '').toLowerCase();
  const transportKeywords = [
    'battlewagon', 'trukk', 'chinork', 'kill rig', 'hunta rig',
    'land raider', 'repulsor', 'impulsor', 'rhino', 'razorback', 'drop pod',
    'stormraven', 'stormwolf', 'stormfang',
    'raider', 'venom', 'starweaver',
    'wave serpent', 'falcon', 'fire prism',
    'ghost ark', 'night scythe',
    'chimera', 'taurox', 'valkyrie',
    'devilfish', 'hammerhead',
    'tyrannocyte', 'haruspex',
  ];
  
  return transportKeywords.some(kw => unitName.includes(kw));
}

/**
 * Build display names with disambiguation for duplicates
 * "Flash Gitz" x2 becomes "Flash Gitz (1)" and "Flash Gitz (2)"
 */
function buildDisplayNames(units) {
  const displayNames = new Map();
  const nameCounts = {};
  const nameIndices = {};
  
  // First pass: count occurrences of each name
  units.forEach(unit => {
    const name = unit.name;
    nameCounts[name] = (nameCounts[name] || 0) + 1;
  });
  
  // Second pass: assign display names with numbers for duplicates
  units.forEach(unit => {
    const name = unit.name;
    if (nameCounts[name] > 1) {
      nameIndices[name] = (nameIndices[name] || 0) + 1;
      displayNames.set(unit.originalIndex, `${name} (${nameIndices[name]})`);
    } else {
      displayNames.set(unit.originalIndex, name);
    }
  });
  
  return displayNames;
}

function UnitCompositionManager({ army, onCompositionChange }) {
  const [attachments, setAttachments] = useState({});
  const [embarked, setEmbarked] = useState({});
  
  // Categorize units
  const { leaders, squads, transports } = useMemo(() => {
    if (!army?.units) return { leaders: [], squads: [], transports: [] };
    
    const leaders = [];
    const squads = [];
    const transports = [];
    
    army.units.forEach((unit, index) => {
      const unitWithIndex = { ...unit, originalIndex: index };
      
      if (unit.section === 'characters') {
        leaders.push(unitWithIndex);
      } else if (canTransport(unit)) {
        transports.push(unitWithIndex);
      } else {
        squads.push(unitWithIndex);
      }
    });
    
    return { leaders, squads, transports };
  }, [army]);
  
  // Build display names for ALL units (for disambiguation)
  const displayNames = useMemo(() => {
    if (!army?.units) return new Map();
    const allUnitsWithIndex = army.units.map((u, i) => ({ ...u, originalIndex: i }));
    return buildDisplayNames(allUnitsWithIndex);
  }, [army]);
  
  // Helper to get display name
  const getDisplayName = useCallback((originalIndex) => {
    return displayNames.get(originalIndex) || army?.units?.[originalIndex]?.name || 'Unknown';
  }, [displayNames, army]);
  
  // Helper to get model count for a unit
  const getModelCount = useCallback((unit) => {
    if (!unit?.models) return 1;
    return unit.models.reduce((sum, m) => sum + (m.count || 1), 0);
  }, []);
  
  // Get unattached leaders count
  const unattachedLeaders = useMemo(() => {
    return leaders.filter(l => !(l.originalIndex in attachments));
  }, [leaders, attachments]);
  
  // Get attachments for a squad
  const getAttachedLeaders = useCallback((squadIndex) => {
    return Object.entries(attachments)
      .filter(([_, sIdx]) => sIdx === squadIndex)
      .map(([lIdx]) => leaders.find(l => l.originalIndex === parseInt(lIdx)))
      .filter(Boolean);
  }, [attachments, leaders]);
  
  // Get embarked units for a transport
  const getEmbarkedUnits = useCallback((transportIndex) => {
    return Object.entries(embarked)
      .filter(([_, tIdx]) => tIdx === transportIndex)
      .map(([uIdx]) => {
        const idx = parseInt(uIdx);
        return army.units[idx] ? { ...army.units[idx], originalIndex: idx } : null;
      })
      .filter(Boolean);
  }, [embarked, army]);
  
  const handleAttach = useCallback((leaderIndex, squadIndex) => {
    const newAttachments = { ...attachments };
    if (squadIndex === null) {
      delete newAttachments[leaderIndex];
    } else {
      newAttachments[leaderIndex] = squadIndex;
    }
    setAttachments(newAttachments);
    onCompositionChange?.({ attachments: newAttachments, embarked });
  }, [attachments, embarked, onCompositionChange]);
  
  const handleEmbark = useCallback((unitIndex, transportIndex) => {
    const newEmbarked = { ...embarked };
    if (transportIndex === null) {
      delete newEmbarked[unitIndex];
    } else {
      newEmbarked[unitIndex] = transportIndex;
    }
    setEmbarked(newEmbarked);
    onCompositionChange?.({ attachments, embarked: newEmbarked });
  }, [attachments, embarked, onCompositionChange]);
  
  const summary = useMemo(() => {
    const attachedCount = Object.keys(attachments).length;
    const embarkedCount = Object.keys(embarked).length;
    const totalUnits = army?.units?.length || 0;
    const composedUnits = totalUnits - attachedCount;
    
    return { totalUnits, composedUnits, attachedCount, embarkedCount };
  }, [army, attachments, embarked]);

  if (!army?.units || army.units.length === 0) {
    return null;
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Compose Your Army</h3>
            <p className="text-xs text-zinc-500">Attach leaders to squads and embark units in transports</p>
          </div>
        </div>
      </div>
      
      {/* Leaders Section */}
      {leaders.length > 0 && (
        <div className="border-b border-zinc-800">
          <div className="px-4 py-2 bg-zinc-800/30">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Leaders ({unattachedLeaders.length} unattached)
            </span>
          </div>
          
          <div className="divide-y divide-zinc-800/50">
            {leaders.map((leader) => {
              const isAttached = leader.originalIndex in attachments;
              const attachedToIndex = attachments[leader.originalIndex];
              
              return (
                <div 
                  key={leader.originalIndex}
                  className={`px-4 py-3 flex items-center justify-between transition-colors ${
                    isAttached ? 'bg-purple-500/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isAttached ? 'bg-purple-500' : 'bg-zinc-600'}`} />
                    <div>
                      <span className={`text-sm font-medium ${isAttached ? 'text-purple-300' : 'text-white'}`}>
                        {getDisplayName(leader.originalIndex)}
                      </span>
                      {leader.enhancements?.length > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-orange-500/20 rounded text-[10px] text-orange-400">
                          {leader.enhancements[0]}
                        </span>
                      )}
                      <span className="ml-2 text-xs text-zinc-500">{leader.points} pts</span>
                    </div>
                  </div>
                  
                  <select
                    value={attachedToIndex ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleAttach(leader.originalIndex, val === '' ? null : parseInt(val));
                    }}
                    className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-purple-500 cursor-pointer min-w-[160px]"
                  >
                    <option value="">Unattached</option>
                    {squads.map((squad) => (
                      <option key={squad.originalIndex} value={squad.originalIndex}>
                        {getDisplayName(squad.originalIndex)} • {getModelCount(squad)} models
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Squads & Vehicles Section */}
      {squads.length > 0 && (
        <div className="border-b border-zinc-800">
          <div className="px-4 py-2 bg-zinc-800/30">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Squads & Vehicles ({squads.length})
            </span>
          </div>
          
          <div className="divide-y divide-zinc-800/50">
            {squads.map((squad) => {
              const attachedLeaders = getAttachedLeaders(squad.originalIndex);
              const isEmbarked = squad.originalIndex in embarked;
              const embarkedInIndex = embarked[squad.originalIndex];
              
              return (
                <div key={squad.originalIndex} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <span className="text-sm font-medium text-white">
                          {getDisplayName(squad.originalIndex)}
                        </span>
                        <span className="ml-2 text-xs text-zinc-500">{squad.points} pts</span>
                      </div>
                    </div>
                    
                    {transports.length > 0 && (
                      <select
                        value={embarkedInIndex ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleEmbark(squad.originalIndex, val === '' ? null : parseInt(val));
                        }}
                        className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[160px]"
                      >
                        <option value="">Not embarked</option>
                        {transports.map((transport) => (
                          <option key={transport.originalIndex} value={transport.originalIndex}>
                            {getDisplayName(transport.originalIndex)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  {/* Attached leaders */}
                  {attachedLeaders.length > 0 && (
                    <div className="mt-2 ml-7 space-y-1">
                      {attachedLeaders.map((leader) => (
                        <div key={leader.originalIndex} className="flex items-center gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          <span className="text-purple-300">+ {getDisplayName(leader.originalIndex)}</span>
                          {leader.enhancements?.length > 0 && (
                            <span className="px-1 py-0.5 bg-orange-500/20 rounded text-[9px] text-orange-400">
                              {leader.enhancements[0]}
                            </span>
                          )}
                          <span className="text-zinc-600">{leader.points} pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Embarked indicator */}
                  {isEmbarked && embarkedInIndex !== undefined && (
                    <div className="mt-2 ml-7 flex items-center gap-2 text-xs">
                      <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span className="text-blue-400">Embarked in {getDisplayName(embarkedInIndex)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Transports Section */}
      {transports.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-zinc-800/30">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Transports ({transports.length})
            </span>
          </div>
          
          <div className="divide-y divide-zinc-800/50">
            {transports.map((transport) => {
              const embarkedUnits = getEmbarkedUnits(transport.originalIndex);
              
              return (
                <div 
                  key={transport.originalIndex} 
                  className={`px-4 py-3 ${embarkedUnits.length > 0 ? 'bg-blue-500/5' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <div>
                      <span className="text-sm font-medium text-blue-300">
                        {getDisplayName(transport.originalIndex)}
                      </span>
                      <span className="ml-2 text-xs text-zinc-500">{transport.points} pts</span>
                      {embarkedUnits.length === 0 && (
                        <span className="ml-2 text-xs text-zinc-600">• Empty</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Embarked units */}
                  {embarkedUnits.length > 0 && (
                    <div className="mt-2 ml-7 space-y-1">
                      {embarkedUnits.map((unit) => {
                        const attachedLeaders = getAttachedLeaders(unit.originalIndex);
                        const totalPoints = unit.points + attachedLeaders.reduce((sum, l) => sum + l.points, 0);
                        
                        return (
                          <div key={unit.originalIndex} className="flex items-center gap-2 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            <span className="text-zinc-300">{getDisplayName(unit.originalIndex)}</span>
                            {attachedLeaders.length > 0 && (
                              <span className="text-purple-400">
                                +{attachedLeaders.length} leader{attachedLeaders.length > 1 ? 's' : ''}
                              </span>
                            )}
                            <span className="text-zinc-600">{totalPoints} pts</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Summary Footer */}
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">
            {summary.totalUnits} units → <span className="text-white font-medium">{summary.composedUnits} composed</span>
          </span>
          <div className="flex items-center gap-4">
            {summary.attachedCount > 0 && (
              <span className="text-purple-400">
                {summary.attachedCount} leader{summary.attachedCount !== 1 ? 's' : ''} attached
              </span>
            )}
            {summary.embarkedCount > 0 && (
              <span className="text-blue-400">
                {summary.embarkedCount} unit{summary.embarkedCount !== 1 ? 's' : ''} embarked
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnitCompositionManager;