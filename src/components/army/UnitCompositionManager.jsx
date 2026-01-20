import { useState, useMemo } from 'react';

/**
 * UnitCompositionManager - Manage leader attachments and transport assignments
 * 
 * Simplified - no capacity limits or attachment restrictions
 * ANY unit can be used as a transport (Battlewagons, Land Raiders, Trukks, etc.)
 * Users know their own army rules better than we can code them
 */

// Icons
const LinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const UnlinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l16 16" />
  </svg>
);

const TransportIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="8" width="18" height="10" rx="2" strokeWidth={2} />
    <circle cx="7" cy="18" r="2" strokeWidth={2} />
    <circle cx="17" cy="18" r="2" strokeWidth={2} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" />
  </svg>
);

const LeaderIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SquadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

function UnitCompositionManager({ army, onCompositionChange }) {
  // State for attachments: { [leaderIndex]: squadIndex }
  const [attachments, setAttachments] = useState({});
  // State for transports: { [unitIndex]: transportIndex } - any unit can be a transport
  const [embarked, setEmbarked] = useState({});
  // UI state
  const [attachingLeader, setAttachingLeader] = useState(null);
  const [assigningToTransport, setAssigningToTransport] = useState(null);
  const [selectingTransport, setSelectingTransport] = useState(false);

  // Parse units into categories
  const { leaders, nonLeaders, allUnits } = useMemo(() => {
    if (!army?.units) return { leaders: [], nonLeaders: [], allUnits: [] };
    
    const leaders = [];
    const nonLeaders = [];
    
    army.units.forEach((unit, index) => {
      const unitWithIndex = { ...unit, originalIndex: index };
      
      if (unit.section === 'characters') {
        leaders.push(unitWithIndex);
      } else {
        // ALL non-character units can be squads OR transports
        nonLeaders.push(unitWithIndex);
      }
    });
    
    return { leaders, nonLeaders, allUnits: army.units };
  }, [army]);

  // Get units that are being used as transports (have something embarked)
  const activeTransports = useMemo(() => {
    const transportIndices = new Set(Object.values(embarked));
    return Array.from(transportIndices).map(idx => ({
      ...allUnits[idx],
      originalIndex: idx
    }));
  }, [embarked, allUnits]);

  // Get model count for a unit
  const getModelCount = (unit) => {
    return unit.models?.reduce((sum, m) => sum + m.count, 0) || 1;
  };

  // Get units currently in a transport
  const getEmbarkedUnits = (transportIndex) => {
    return Object.entries(embarked)
      .filter(([_, tIndex]) => tIndex === transportIndex)
      .map(([unitIndex]) => parseInt(unitIndex));
  };

  // Get leaders attached to a squad
  const getAttachedLeaders = (squadIndex) => {
    return Object.entries(attachments)
      .filter(([_, sIdx]) => sIdx === squadIndex)
      .map(([leaderIndex]) => ({
        index: parseInt(leaderIndex),
        leader: allUnits[parseInt(leaderIndex)]
      }));
  };

  // Check if a leader is already attached
  const isLeaderAttached = (leaderIndex) => attachments[leaderIndex] !== undefined;
  
  // Check if a unit is embarked
  const isUnitEmbarked = (unitIndex) => embarked[unitIndex] !== undefined;
  
  // Check if a unit is being used as a transport
  const isUsedAsTransport = (unitIndex) => Object.values(embarked).includes(unitIndex);

  // Attach a leader to a squad
  const attachLeader = (leaderIndex, squadIndex) => {
    const newAttachments = { ...attachments, [leaderIndex]: squadIndex };
    setAttachments(newAttachments);
    setAttachingLeader(null);
    onCompositionChange?.({ attachments: newAttachments, embarked });
  };

  // Detach a leader
  const detachLeader = (leaderIndex) => {
    const newAttachments = { ...attachments };
    delete newAttachments[leaderIndex];
    setAttachments(newAttachments);
    onCompositionChange?.({ attachments: newAttachments, embarked });
  };

  // Embark a unit on a transport
  const embarkUnit = (unitIndex, transportIndex) => {
    const newEmbarked = { ...embarked, [unitIndex]: transportIndex };
    setEmbarked(newEmbarked);
    setAssigningToTransport(null);
    setSelectingTransport(false);
    onCompositionChange?.({ attachments, embarked: newEmbarked });
  };

  // Disembark a unit
  const disembarkUnit = (unitIndex) => {
    const newEmbarked = { ...embarked };
    delete newEmbarked[unitIndex];
    setEmbarked(newEmbarked);
    onCompositionChange?.({ attachments, embarked: newEmbarked });
  };

  if (!army?.units || army.units.length === 0) {
    return null;
  }

  // Get available units that can be embarked (not already embarked, not used as transport)
  const getEmbarkableUnits = (excludeTransportIndex = null) => {
    return [...nonLeaders, ...leaders.filter(l => !isLeaderAttached(l.originalIndex))]
      .filter(unit => 
        !isUnitEmbarked(unit.originalIndex) && 
        !isUsedAsTransport(unit.originalIndex) &&
        unit.originalIndex !== excludeTransportIndex
      );
  };

  // Get available units that can be used as transports (ANY unit can be a transport)
  const getAvailableTransports = () => {
    // Include all units - characters, battleline, other datasheets, etc.
    // Users know what can actually transport in their army
    const allWithIndex = army.units.map((unit, index) => ({ ...unit, originalIndex: index }));
    return allWithIndex.filter(unit => 
      !isUnitEmbarked(unit.originalIndex) && 
      !isUsedAsTransport(unit.originalIndex)
    );
  };

  // Build composed units for display
  const composedUnits = useMemo(() => {
    const composed = [];
    const processedIndices = new Set();
    
    // First, add units being used as transports with their embarked units
    const transportIndices = [...new Set(Object.values(embarked))];
    transportIndices.forEach((transportIdx) => {
      const transport = allUnits[transportIdx];
      processedIndices.add(transportIdx);
      
      const embarkedIndices = getEmbarkedUnits(transportIdx);
      const embarkedUnits = embarkedIndices.map(idx => {
        processedIndices.add(idx);
        const unit = allUnits[idx];
        const attachedLeaders = getAttachedLeaders(idx);
        attachedLeaders.forEach(l => processedIndices.add(l.index));
        return { unit, index: idx, attachedLeaders };
      });
      
      composed.push({
        type: 'transport',
        transport: { ...transport, originalIndex: transportIdx },
        embarkedUnits,
      });
    });
    
    // Add non-leaders with attached leaders (not in transports, not used as transports)
    nonLeaders.forEach((squad) => {
      if (processedIndices.has(squad.originalIndex)) return;
      if (isUnitEmbarked(squad.originalIndex)) return;
      
      const attachedLeaders = getAttachedLeaders(squad.originalIndex);
      attachedLeaders.forEach(l => processedIndices.add(l.index));
      processedIndices.add(squad.originalIndex);
      
      composed.push({
        type: 'squad',
        squad,
        attachedLeaders,
      });
    });
    
    // Add unattached leaders
    leaders.forEach((leader) => {
      if (processedIndices.has(leader.originalIndex)) return;
      if (isLeaderAttached(leader.originalIndex)) return;
      
      composed.push({
        type: 'leader',
        leader,
      });
    });
    
    return composed;
  }, [allUnits, attachments, embarked, leaders, nonLeaders]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <LinkIcon />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Unit Composition</h3>
            <p className="text-xs text-zinc-500">Attach leaders & assign transports</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Leader Attachments Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <LeaderIcon />
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Leader Attachments</h4>
            <span className="text-xs text-zinc-600">({leaders.length})</span>
          </div>
          
          {leaders.length === 0 ? (
            <p className="text-xs text-zinc-600 italic">No characters in army</p>
          ) : (
            <div className="space-y-2">
              {leaders.map((leader) => {
                const isAttached = isLeaderAttached(leader.originalIndex);
                const attachedTo = isAttached ? allUnits[attachments[leader.originalIndex]] : null;
                const isSelecting = attachingLeader === leader.originalIndex;
                
                return (
                  <div key={leader.originalIndex} className="bg-zinc-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isAttached ? 'bg-green-500' : 'bg-zinc-600'}`} />
                        <div>
                          <div className="text-sm font-medium text-white">{leader.name}</div>
                          <div className="text-xs text-zinc-500">{leader.points} pts</div>
                        </div>
                      </div>
                      
                      {isAttached ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-green-400 flex items-center gap-1.5">
                            <LinkIcon />
                            {attachedTo?.name}
                          </span>
                          <button
                            onClick={() => detachLeader(leader.originalIndex)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Detach leader"
                          >
                            <UnlinkIcon />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAttachingLeader(isSelecting ? null : leader.originalIndex)}
                          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                            isSelecting 
                              ? 'bg-indigo-500 text-white' 
                              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                          }`}
                        >
                          {isSelecting ? 'Cancel' : 'Attach to...'}
                        </button>
                      )}
                    </div>
                    
                    {/* Squad selection dropdown */}
                    {isSelecting && (
                      <div className="mt-3 pt-3 border-t border-zinc-700 space-y-1.5">
                        <p className="text-xs text-zinc-400 mb-2">Select a unit to join:</p>
                        {nonLeaders.map((squad) => {
                          const existingLeaders = getAttachedLeaders(squad.originalIndex);
                          return (
                            <button
                              key={squad.originalIndex}
                              onClick={() => attachLeader(leader.originalIndex, squad.originalIndex)}
                              className="w-full flex items-center justify-between px-3 py-2 bg-zinc-700/50 hover:bg-indigo-500/20 hover:border-indigo-500/50 border border-transparent rounded transition-colors text-left"
                            >
                              <div className="flex items-center gap-2">
                                <SquadIcon />
                                <span className="text-sm text-zinc-200">{squad.name}</span>
                                {existingLeaders.length > 0 && (
                                  <span className="text-xs text-purple-400">
                                    (+{existingLeaders.length} leader{existingLeaders.length > 1 ? 's' : ''})
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-zinc-500">{getModelCount(squad)} models</span>
                            </button>
                          );
                        })}
                        {nonLeaders.length === 0 && (
                          <p className="text-xs text-zinc-500 italic">No units available</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transport Assignments Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TransportIcon />
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Transport Assignments</h4>
            </div>
            {!selectingTransport && (
              <button
                onClick={() => setSelectingTransport(true)}
                className="px-3 py-1.5 text-xs font-medium bg-zinc-700 text-zinc-300 hover:bg-zinc-600 rounded transition-colors"
              >
                + Add Transport
              </button>
            )}
          </div>
          
          {/* Transport selection - ANY unit can be a transport */}
          {selectingTransport && (
            <div className="mb-4 bg-zinc-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-zinc-400">Select any unit to use as transport:</p>
                <button
                  onClick={() => setSelectingTransport(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Cancel
                </button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {getAvailableTransports().map((unit) => (
                  <button
                    key={unit.originalIndex}
                    onClick={() => {
                      setAssigningToTransport(unit.originalIndex);
                      setSelectingTransport(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 bg-zinc-700/50 hover:bg-blue-500/20 border border-transparent rounded transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <TransportIcon />
                      <span className="text-sm text-zinc-200">{unit.name}</span>
                      <span className="text-xs text-zinc-600">({unit.section})</span>
                    </div>
                    <span className="text-xs text-zinc-500">{unit.points} pts</span>
                  </button>
                ))}
                {getAvailableTransports().length === 0 && (
                  <p className="text-xs text-zinc-500 italic py-2">No units available</p>
                )}
              </div>
            </div>
          )}
          
          {/* Active transports */}
          {activeTransports.length === 0 && !selectingTransport && assigningToTransport === null ? (
            <p className="text-xs text-zinc-600 italic">No transports assigned. Click "+ Add Transport" to embark units.</p>
          ) : (
            <div className="space-y-3">
              {activeTransports.map((transport) => {
                const embarkedUnits = getEmbarkedUnits(transport.originalIndex);
                const isSelecting = assigningToTransport === transport.originalIndex;
                
                return (
                  <div key={transport.originalIndex} className="bg-zinc-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <TransportIcon />
                        <div>
                          <div className="text-sm font-medium text-white">{transport.name}</div>
                          <div className="text-xs text-zinc-500">{transport.points} pts</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-mono font-bold ${embarkedUnits.length > 0 ? 'text-green-400' : 'text-zinc-500'}`}>
                          {embarkedUnits.length} unit{embarkedUnits.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    
                    {/* Embarked units */}
                    {embarkedUnits.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        {embarkedUnits.map((unitIndex) => {
                          const unit = allUnits[unitIndex];
                          const attachedLeaders = getAttachedLeaders(unitIndex);
                          
                          return (
                            <div 
                              key={unitIndex}
                              className="flex items-center justify-between px-2 py-1.5 bg-zinc-700/50 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-xs text-zinc-300">
                                  {unit.name}
                                  {attachedLeaders.length > 0 && (
                                    <span className="text-purple-400">
                                      {' + '}{attachedLeaders.map(l => l.leader.name).join(' + ')}
                                    </span>
                                  )}
                                </span>
                              </div>
                              <button
                                onClick={() => disembarkUnit(unitIndex)}
                                className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                title="Disembark"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Add unit button */}
                    <button
                      onClick={() => setAssigningToTransport(isSelecting ? null : transport.originalIndex)}
                      className={`w-full px-3 py-2 text-xs font-medium rounded transition-colors ${
                        isSelecting 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      {isSelecting ? 'Cancel' : '+ Embark Unit'}
                    </button>
                    
                    {/* Unit selection for embarking */}
                    {isSelecting && (
                      <div className="mt-3 pt-3 border-t border-zinc-700 space-y-1.5">
                        <p className="text-xs text-zinc-400 mb-2">Select unit to embark:</p>
                        {getEmbarkableUnits(transport.originalIndex).map((unit) => {
                          const attachedLeaders = getAttachedLeaders(unit.originalIndex);
                          
                          return (
                            <button
                              key={unit.originalIndex}
                              onClick={() => embarkUnit(unit.originalIndex, transport.originalIndex)}
                              className="w-full flex items-center justify-between px-3 py-2 bg-zinc-700/50 hover:bg-blue-500/20 hover:border-blue-500/50 border border-transparent rounded transition-colors text-left"
                            >
                              <div className="flex items-center gap-2">
                                {unit.section === 'characters' ? <LeaderIcon /> : <SquadIcon />}
                                <span className="text-sm text-zinc-200">
                                  {unit.name}
                                  {attachedLeaders.length > 0 && (
                                    <span className="text-purple-400">
                                      {' + '}{attachedLeaders.map(l => l.leader.name).join(' + ')}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                        {getEmbarkableUnits(transport.originalIndex).length === 0 && (
                          <p className="text-xs text-zinc-500 italic">No units available to embark</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Quick add - select transport then immediately show embark options */}
          {assigningToTransport !== null && !activeTransports.find(t => t.originalIndex === assigningToTransport) && (
            <div className="mt-3 bg-zinc-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TransportIcon />
                  <span className="text-sm font-medium text-white">{allUnits[assigningToTransport]?.name}</span>
                </div>
                <button
                  onClick={() => setAssigningToTransport(null)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-zinc-400 mb-2">Select unit to embark:</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {getEmbarkableUnits(assigningToTransport).map((unit) => {
                  const attachedLeaders = getAttachedLeaders(unit.originalIndex);
                  
                  return (
                    <button
                      key={unit.originalIndex}
                      onClick={() => embarkUnit(unit.originalIndex, assigningToTransport)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-zinc-700/50 hover:bg-blue-500/20 border border-transparent rounded transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        {unit.section === 'characters' ? <LeaderIcon /> : <SquadIcon />}
                        <span className="text-sm text-zinc-200">
                          {unit.name}
                          {attachedLeaders.length > 0 && (
                            <span className="text-purple-400">
                              {' + '}{attachedLeaders.map(l => l.leader.name).join(' + ')}
                            </span>
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {getEmbarkableUnits(assigningToTransport).length === 0 && (
                  <p className="text-xs text-zinc-500 italic">No units available to embark</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Composed Units Summary */}
        <div className="pt-4 border-t border-zinc-800">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Composed Army</h4>
          <div className="space-y-2">
            {composedUnits.map((composed, idx) => {
              if (composed.type === 'transport') {
                return (
                  <div key={`transport-${idx}`} className="flex items-start gap-3 px-3 py-2 bg-zinc-800/30 rounded-lg">
                    <TransportIcon />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-blue-400">{composed.transport.name}</div>
                      {composed.embarkedUnits.length > 0 ? (
                        <div className="mt-1 ml-3 space-y-0.5">
                          {composed.embarkedUnits.map(({ unit, attachedLeaders }, uIdx) => (
                            <div key={uIdx} className="text-xs text-zinc-400">
                              ↳ {unit.name}
                              {attachedLeaders.length > 0 && (
                                <span className="text-purple-400">
                                  {' + '}{attachedLeaders.map(l => l.leader.name).join(' + ')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-600 italic mt-0.5">Empty</div>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">{composed.transport.points} pts</span>
                  </div>
                );
              }
              
              if (composed.type === 'squad') {
                const totalPoints = composed.squad.points + composed.attachedLeaders.reduce((sum, l) => sum + (l.leader.points || 0), 0);
                return (
                  <div key={`squad-${idx}`} className="flex items-center gap-3 px-3 py-2 bg-zinc-800/30 rounded-lg">
                    <SquadIcon />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-200">
                        {composed.squad.name}
                        {composed.attachedLeaders.length > 0 && (
                          <span className="text-purple-400">
                            {' + '}{composed.attachedLeaders.map(l => l.leader.name).join(' + ')}
                          </span>
                        )}
                      </div>
                      {composed.attachedLeaders.length > 0 && (
                        <div className="text-xs text-green-400 mt-0.5 flex items-center gap-1">
                          <LinkIcon />
                          Led unit
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">{totalPoints} pts</span>
                  </div>
                );
              }
              
              if (composed.type === 'leader') {
                return (
                  <div key={`leader-${idx}`} className="flex items-center gap-3 px-3 py-2 bg-zinc-800/30 rounded-lg opacity-60">
                    <LeaderIcon />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-400">{composed.leader.name}</div>
                      <div className="text-xs text-zinc-600 mt-0.5">Unattached character</div>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">{composed.leader.points} pts</span>
                  </div>
                );
              }
              
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnitCompositionManager;