import { PROFILE_COLORS } from '../../utils/constants';

// Safe number formatting
const fmt = (val, decimals = 1) => {
  const n = Number(val);
  return isNaN(n) || !isFinite(n) ? '0' : n.toFixed(decimals);
};

const safeVal = (val) => {
  const n = Number(val);
  return isNaN(n) || !isFinite(n) ? 0 : n;
};

/**
 * AttackFlowDiagram - Visualizes the attack pipeline with 10th edition abilities
 */
function AttackFlowDiagram({ data, profiles }) {
  if (!data) return null;
  
  const { total, breakdown } = data;
  if (!breakdown || breakdown.length === 0) return null;
  
  const totalAttacks = breakdown.reduce((sum, b) => sum + safeVal(b.result?.attacks), 0);
  
  // Check for active abilities across all profiles
  const hasAbilities = {
    sustained: breakdown.some(b => safeVal(b.result?.sustainedBonus) > 0),
    lethal: breakdown.some(b => safeVal(b.result?.autoWounds) > 0),
    devastating: breakdown.some(b => safeVal(b.result?.devastatingDamage) > 0),
  };
  
  const stages = [
    { 
      key: 'attacks', 
      label: 'Attacks', 
      getValue: r => safeVal(r?.attacks),
      note: null,
    },
    { 
      key: 'hits', 
      label: 'Hits', 
      getValue: r => safeVal(r?.expectedHits),
      note: hasAbilities.sustained ? 'incl. Sustained' : null,
    },
    { 
      key: 'wounds', 
      label: 'Wounds', 
      getValue: r => safeVal(r?.expectedWoundsFromHits),
      note: hasAbilities.lethal ? 'incl. Lethal auto-wounds' : null,
    },
    { 
      key: 'unsaved', 
      label: 'Failed Saves', 
      getValue: r => safeVal(r?.expectedUnsaved),
      note: hasAbilities.devastating ? 'Dev. Wounds bypass saves' : null,
    },
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
                <span className="w-20 text-sm text-gray-400">{stage.label}</span>
                <span className="text-sm font-bold text-white">{fmt(stageTotal)}</span>
                {stage.note && (
                  <span className="text-xs text-orange-400">({stage.note})</span>
                )}
              </div>
              <div className="h-6 bg-gray-700/50 rounded overflow-hidden flex">
                {breakdown.map((b, i) => {
                  const value = stage.getValue(b.result);
                  const widthPercent = totalAttacks > 0 ? (value / totalAttacks) * 100 : 0;
                  const color = PROFILE_COLORS[i % PROFILE_COLORS.length];
                  
                  return (
                    <div
                      key={b.profile?.id || i}
                      className="h-full relative group transition-all duration-300"
                      style={{ width: `${safeVal(widthPercent)}%`, backgroundColor: color.bg }}
                    >
                      {/* Highlight gradient */}
                      <div 
                        className="absolute inset-x-0 top-0 h-1/2 opacity-20" 
                        style={{ background: 'linear-gradient(180deg, white 0%, transparent 100%)' }} 
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {b.profile?.name || 'Weapon'}: {fmt(value)}
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
            <span className="w-20 text-sm font-semibold text-orange-400">Damage</span>
            <span className="text-lg font-bold text-orange-400">{fmt(total?.expected)}</span>
          </div>
          <div className="h-8 bg-gray-700/50 rounded overflow-hidden flex">
            {breakdown.map((b, i) => {
              const totalExp = safeVal(total?.expected);
              const resultExp = safeVal(b.result?.expected);
              const widthPercent = totalExp > 0 ? (resultExp / totalExp) * 100 : 0;
              const color = PROFILE_COLORS[i % PROFILE_COLORS.length];
              
              return (
                <div
                  key={b.profile?.id || i}
                  className="h-full relative group transition-all duration-300"
                  style={{ 
                    width: `${Math.max(safeVal(widthPercent), 1)}%`, 
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
                        {fmt(resultExp)}
                      </span>
                    </div>
                  )}
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {b.profile?.name || 'Weapon'}: {fmt(resultExp, 2)}
                    {safeVal(b.result?.devastatingDamage) > 0 && (
                      <span className="text-purple-400"> ({fmt(b.result.devastatingDamage)} Dev)</span>
                    )}
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
              <div key={b.profile?.id || i} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: color.bg }} />
                <span className="text-gray-400">{b.profile?.name || 'Weapon'}</span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Ability summary */}
      {(hasAbilities.sustained || hasAbilities.lethal || hasAbilities.devastating) && (
        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
          <span className="text-gray-400">Active abilities: </span>
          {[
            hasAbilities.sustained && 'Sustained Hits',
            hasAbilities.lethal && 'Lethal Hits',
            hasAbilities.devastating && 'Devastating Wounds',
          ].filter(Boolean).join(', ')}
        </div>
      )}
    </div>
  );
}

export default AttackFlowDiagram;