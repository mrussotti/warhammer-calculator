import { useMemo, useCallback } from 'react';

/**
 * CompositionPanel - Attach leaders to squads, embark units in transports
 * 
 * Simplified version of UnitCompositionManager for sidebar
 */
function CompositionPanel({
  units,
  leaders,
  squads,
  transports,
  attachments,
  embarked,
  onAttach,
  onEmbark,
  getDisplayName,
}) {
  // Get model count for a unit
  const getModelCount = useCallback((unit) => {
    if (!unit?.models) return 1;
    return unit.models.reduce((sum, m) => sum + (m.count || 1), 0);
  }, []);
  
  // Get embarked units for a transport
  const getEmbarkedUnits = useCallback((transportIndex) => {
    return Object.entries(embarked)
      .filter(([_, tIdx]) => tIdx === transportIndex)
      .map(([uIdx]) => {
        const idx = parseInt(uIdx);
        return units[idx] ? { ...units[idx], originalIndex: idx } : null;
      })
      .filter(Boolean);
  }, [embarked, units]);
  
  // Unattached leaders
  const unattachedLeaders = useMemo(() => {
    return leaders.filter(l => !(l.originalIndex in attachments));
  }, [leaders, attachments]);
  
  // Summary stats
  const stats = useMemo(() => ({
    attachedCount: Object.keys(attachments).length,
    embarkedCount: Object.keys(embarked).length,
  }), [attachments, embarked]);

  return (
    <div className="divide-y divide-zinc-800/50">
      {/* Leaders Section */}
      {leaders.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-zinc-800/30 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
              Attach Leaders
            </span>
            <span className="text-[10px] text-zinc-500">
              {unattachedLeaders.length} unattached
            </span>
          </div>
          
          <div className="divide-y divide-zinc-800/30">
            {leaders.map((leader) => {
              const isAttached = leader.originalIndex in attachments;
              const attachedToIdx = attachments[leader.originalIndex];
              
              return (
                <div 
                  key={leader.originalIndex}
                  className={`px-4 py-3 transition-colors ${isAttached ? 'bg-purple-500/5' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isAttached ? 'bg-purple-500' : 'bg-zinc-600'
                      }`} />
                      <span className={`text-xs font-medium truncate ${
                        isAttached ? 'text-purple-300' : 'text-white'
                      }`}>
                        {getDisplayName(leader.originalIndex)}
                      </span>
                    </div>
                    
                    <select
                      value={attachedToIdx ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onAttach(leader.originalIndex, val === '' ? null : parseInt(val));
                      }}
                      className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 focus:outline-none focus:border-purple-500 cursor-pointer max-w-[130px]"
                    >
                      <option value="">Unattached</option>
                      {squads.map((squad) => (
                        <option key={squad.originalIndex} value={squad.originalIndex}>
                          {getDisplayName(squad.originalIndex)} ({getModelCount(squad)})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {leader.enhancements?.length > 0 && (
                    <div className="mt-1 ml-4">
                      <span className="px-1.5 py-0.5 bg-orange-500/20 rounded text-[9px] text-orange-400">
                        {leader.enhancements[0]}
                      </span>
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
            <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
              Transports
            </span>
          </div>
          
          <div className="divide-y divide-zinc-800/30">
            {transports.map((transport) => {
              const embarkedUnits = getEmbarkedUnits(transport.originalIndex);
              
              return (
                <div 
                  key={transport.originalIndex}
                  className={`px-4 py-3 ${embarkedUnits.length > 0 ? 'bg-blue-500/5' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="text-xs font-medium text-blue-300">
                      {getDisplayName(transport.originalIndex)}
                    </span>
                    <span className="text-[10px] text-zinc-500">{transport.points} pts</span>
                  </div>
                  
                  {/* Embarked units */}
                  {embarkedUnits.length > 0 && (
                    <div className="mt-2 ml-6 space-y-1">
                      {embarkedUnits.map((unit) => (
                        <div key={unit.originalIndex} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            <span className="text-[10px] text-zinc-300">
                              {getDisplayName(unit.originalIndex)}
                            </span>
                          </div>
                          <button
                            onClick={() => onEmbark(unit.originalIndex, null)}
                            className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {embarkedUnits.length === 0 && (
                    <div className="mt-1 ml-6 text-[10px] text-zinc-600">
                      Empty
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Squads that can embark */}
      {transports.length > 0 && squads.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-zinc-800/30">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Embark Units
            </span>
          </div>
          
          <div className="divide-y divide-zinc-800/30">
            {squads.map((squad) => {
              const isEmbarked = squad.originalIndex in embarked;
              const embarkedInIdx = embarked[squad.originalIndex];
              
              return (
                <div 
                  key={squad.originalIndex}
                  className={`px-4 py-3 transition-colors ${isEmbarked ? 'bg-blue-500/5' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium text-white truncate">
                        {getDisplayName(squad.originalIndex)}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {getModelCount(squad)} models
                      </span>
                    </div>
                    
                    <select
                      value={embarkedInIdx ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onEmbark(squad.originalIndex, val === '' ? null : parseInt(val));
                      }}
                      className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 focus:outline-none focus:border-blue-500 cursor-pointer max-w-[130px]"
                    >
                      <option value="">Not embarked</option>
                      {transports.map((transport) => (
                        <option key={transport.originalIndex} value={transport.originalIndex}>
                          {getDisplayName(transport.originalIndex)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Summary */}
      {(stats.attachedCount > 0 || stats.embarkedCount > 0) && (
        <div className="px-4 py-3 bg-zinc-950/50">
          <div className="flex items-center gap-4 text-[10px]">
            {stats.attachedCount > 0 && (
              <span className="text-purple-400">
                {stats.attachedCount} leader{stats.attachedCount !== 1 ? 's' : ''} attached
              </span>
            )}
            {stats.embarkedCount > 0 && (
              <span className="text-blue-400">
                {stats.embarkedCount} unit{stats.embarkedCount !== 1 ? 's' : ''} embarked
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Empty states */}
      {leaders.length === 0 && transports.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-xs text-zinc-500">
            No leaders or transports to compose
          </p>
        </div>
      )}
    </div>
  );
}

export default CompositionPanel;
