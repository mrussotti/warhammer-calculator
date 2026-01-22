import { useMemo } from 'react';

/**
 * UnitSelector - Checkbox list of units in sidebar
 * 
 * Groups units by category (Leaders, Squads, Transports)
 * Shows attached leader indicators
 */
function UnitSelector({
  units,
  leaders,
  squads,
  transports,
  selectedUnitIds,
  attachments,
  onToggle,
  onSelectAll,
  onDeselectAll,
  getDisplayName,
}) {
  // Get attached leader info for each squad
  const squadAttachments = useMemo(() => {
    const map = {};
    Object.entries(attachments).forEach(([leaderIdx, squadIdx]) => {
      if (!map[squadIdx]) map[squadIdx] = [];
      map[squadIdx].push(parseInt(leaderIdx));
    });
    return map;
  }, [attachments]);
  
  // Check if a leader is attached
  const isLeaderAttached = (leaderIdx) => leaderIdx in attachments;
  
  const allSelected = selectedUnitIds.size === units.length;
  const noneSelected = selectedUnitIds.size === 0;

  return (
    <div className="divide-y divide-zinc-800/50">
      {/* Quick Actions */}
      <div className="px-4 py-2 flex items-center justify-between bg-zinc-800/20">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Quick Select</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            disabled={allSelected}
            className={`text-[10px] transition-colors ${
              allSelected 
                ? 'text-zinc-600 cursor-not-allowed' 
                : 'text-orange-400 hover:text-orange-300'
            }`}
          >
            All
          </button>
          <span className="text-zinc-700">|</span>
          <button
            onClick={onDeselectAll}
            disabled={noneSelected}
            className={`text-[10px] transition-colors ${
              noneSelected 
                ? 'text-zinc-600 cursor-not-allowed' 
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            None
          </button>
        </div>
      </div>
      
      {/* Leaders Section */}
      {leaders.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-zinc-800/30">
            <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
              Characters ({leaders.length})
            </span>
          </div>
          <div className="divide-y divide-zinc-800/30">
            {leaders.map((unit) => {
              const isSelected = selectedUnitIds.has(unit.originalIndex);
              const isAttached = isLeaderAttached(unit.originalIndex);
              const attachedToIdx = attachments[unit.originalIndex];
              
              return (
                <UnitRow
                  key={unit.originalIndex}
                  name={getDisplayName(unit.originalIndex)}
                  points={unit.points}
                  isSelected={isSelected}
                  onToggle={() => onToggle(unit.originalIndex)}
                  accentColor="purple"
                  badge={isAttached ? {
                    text: `→ ${getDisplayName(attachedToIdx)}`,
                    color: 'purple',
                  } : null}
                  enhancements={unit.enhancements}
                />
              );
            })}
          </div>
        </div>
      )}
      
      {/* Squads Section */}
      {squads.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-zinc-800/30">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Squads ({squads.length})
            </span>
          </div>
          <div className="divide-y divide-zinc-800/30">
            {squads.map((unit) => {
              const isSelected = selectedUnitIds.has(unit.originalIndex);
              const attachedLeaderIdxs = squadAttachments[unit.originalIndex] || [];
              
              return (
                <UnitRow
                  key={unit.originalIndex}
                  name={getDisplayName(unit.originalIndex)}
                  points={unit.points}
                  isSelected={isSelected}
                  onToggle={() => onToggle(unit.originalIndex)}
                  modelCount={unit.models?.reduce((sum, m) => sum + (m.count || 1), 0)}
                  attachedLeaders={attachedLeaderIdxs.map(idx => ({
                    name: getDisplayName(idx),
                    points: units[idx]?.points,
                  }))}
                />
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
              Transports ({transports.length})
            </span>
          </div>
          <div className="divide-y divide-zinc-800/30">
            {transports.map((unit) => {
              const isSelected = selectedUnitIds.has(unit.originalIndex);
              
              return (
                <UnitRow
                  key={unit.originalIndex}
                  name={getDisplayName(unit.originalIndex)}
                  points={unit.points}
                  isSelected={isSelected}
                  onToggle={() => onToggle(unit.originalIndex)}
                  accentColor="blue"
                  icon={
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * UnitRow - Individual unit in the selector list
 */
function UnitRow({
  name,
  points,
  isSelected,
  onToggle,
  accentColor = 'orange',
  modelCount,
  badge,
  enhancements,
  attachedLeaders,
  icon,
}) {
  const colors = {
    orange: {
      checkbox: 'border-orange-500 bg-orange-500/20',
      checkmark: 'text-orange-400',
    },
    purple: {
      checkbox: 'border-purple-500 bg-purple-500/20',
      checkmark: 'text-purple-400',
    },
    blue: {
      checkbox: 'border-blue-500 bg-blue-500/20',
      checkmark: 'text-blue-400',
    },
  };
  
  const color = colors[accentColor] || colors.orange;
  
  return (
    <div className={`transition-colors ${isSelected ? 'bg-zinc-800/30' : 'hover:bg-zinc-800/20'}`}>
      <button
        onClick={onToggle}
        className="w-full px-4 py-2.5 flex items-start gap-3 text-left"
      >
        {/* Checkbox */}
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
          isSelected 
            ? color.checkbox
            : 'border-zinc-600 hover:border-zinc-500'
        }`}>
          {isSelected && (
            <svg className={`w-2.5 h-2.5 ${color.checkmark}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {icon && <span className="text-zinc-500">{icon}</span>}
            <span className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
              {name}
            </span>
          </div>
          
          {/* Meta info */}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-zinc-500">{points} pts</span>
            {modelCount && (
              <>
                <span className="text-zinc-700">•</span>
                <span className="text-[10px] text-zinc-500">{modelCount} models</span>
              </>
            )}
            {enhancements?.length > 0 && (
              <span className="px-1.5 py-0.5 bg-orange-500/20 rounded text-[9px] text-orange-400">
                {enhancements[0]}
              </span>
            )}
          </div>
          
          {/* Badge (e.g., "attached to X") */}
          {badge && (
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-[10px] text-${badge.color}-400`}>
                {badge.text}
              </span>
            </div>
          )}
          
          {/* Attached leaders */}
          {attachedLeaders?.length > 0 && (
            <div className="mt-1.5 space-y-0.5">
              {attachedLeaders.map((leader, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span className="text-[10px] text-purple-300">+ {leader.name}</span>
                  <span className="text-[10px] text-zinc-600">{leader.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

export default UnitSelector;
