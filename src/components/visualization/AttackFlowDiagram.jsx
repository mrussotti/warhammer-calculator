import { PROFILE_COLORS } from '../../utils/constants';

/**
 * AttackFlowDiagram - Visualizes the attack pipeline (attacks → hits → wounds → unsaved → damage)
 */
function AttackFlowDiagram({ data, profiles }) {
  if (!data) return null;
  
  const { total, breakdown } = data;
  const totalAttacks = breakdown.reduce((sum, b) => sum + b.result.attacks, 0);
  
  const stages = [
    { key: 'attacks', label: 'Attacks', getValue: r => r.attacks },
    { key: 'hits', label: 'Hits', getValue: r => r.expectedHits },
    { key: 'wounds', label: 'Wounds', getValue: r => r.expectedWoundsFromHits },
    { key: 'unsaved', label: 'Unsaved', getValue: r => r.expectedUnsaved },
  ];
  
  return (
    <div className="bg-gray-800 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-gray-300 mb-4">Attack Flow</h3>
      
      <div className="space-y-3">
        {/* Attack pipeline stages */}
        {stages.map((stage) => {
          const stageTotal = breakdown.reduce((sum, b) => sum + stage.getValue(b.result), 0);
          
          return (
            <div key={stage.key}>
              <div className="flex items-center gap-3 mb-1">
                <span className="w-16 text-sm text-gray-400">{stage.label}</span>
                <span className="text-sm font-bold text-white">{stageTotal.toFixed(1)}</span>
              </div>
              <div className="h-6 bg-gray-700/50 rounded overflow-hidden flex">
                {breakdown.map((b, i) => {
                  const value = stage.getValue(b.result);
                  const widthPercent = (value / totalAttacks) * 100;
                  const color = PROFILE_COLORS[i % PROFILE_COLORS.length];
                  
                  return (
                    <div
                      key={b.profile.id}
                      className="h-full relative group transition-all duration-300"
                      style={{ width: `${widthPercent}%`, backgroundColor: color.bg }}
                    >
                      {/* Highlight gradient */}
                      <div 
                        className="absolute inset-x-0 top-0 h-1/2 opacity-20" 
                        style={{ background: 'linear-gradient(180deg, white 0%, transparent 100%)' }} 
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {b.profile.name}: {value.toFixed(1)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {/* Final damage bar */}
        <div className="pt-2 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-16 text-sm font-semibold text-orange-400">Damage</span>
            <span className="text-lg font-bold text-orange-400">{total.expected.toFixed(1)}</span>
          </div>
          <div className="h-8 bg-gray-700/50 rounded overflow-hidden flex">
            {breakdown.map((b, i) => {
              const widthPercent = total.expected > 0 ? (b.result.expected / total.expected) * 100 : 0;
              const color = PROFILE_COLORS[i % PROFILE_COLORS.length];
              
              return (
                <div
                  key={b.profile.id}
                  className="h-full relative group transition-all duration-300"
                  style={{ 
                    width: `${Math.max(widthPercent, 1)}%`, 
                    backgroundColor: color.bg, 
                    boxShadow: `0 0 15px ${color.bg}40` 
                  }}
                >
                  <div 
                    className="absolute inset-x-0 top-0 h-1/2 opacity-20" 
                    style={{ background: 'linear-gradient(180deg, white 0%, transparent 100%)' }} 
                  />
                  {/* Inline value for wider bars */}
                  {widthPercent > 12 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow">
                        {b.result.expected.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {b.profile.name}: {b.result.expected.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Legend for multiple weapons */}
      {breakdown.length > 1 && (
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-700">
          {breakdown.map((b, i) => {
            const color = PROFILE_COLORS[i % PROFILE_COLORS.length];
            return (
              <div key={b.profile.id} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: color.bg }} />
                <span className="text-gray-400">{b.profile.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AttackFlowDiagram;
