import { PROFILE_COLORS } from '../../utils/constants';

const fmt = (val, decimals = 1) => { const n = Number(val); return isNaN(n) || !isFinite(n) ? '0' : n.toFixed(decimals); };
const safeVal = (val) => { const n = Number(val); return isNaN(n) || !isFinite(n) ? 0 : n; };

function AttackFlowDiagram({ data }) {
  if (!data) return null;
  const { total, breakdown } = data;
  if (!breakdown || breakdown.length === 0) return null;
  
  const totalAttacks = breakdown.reduce((sum, b) => sum + safeVal(b.result?.attacks), 0);
  const hasAbilities = {
    sustained: breakdown.some(b => safeVal(b.result?.sustainedBonus) > 0),
    lethal: breakdown.some(b => safeVal(b.result?.autoWounds) > 0),
    devastating: breakdown.some(b => safeVal(b.result?.devastatingDamage) > 0),
  };
  
  const stages = [
    { key: 'attacks', label: 'Attacks', getValue: r => safeVal(r?.attacks), note: null },
    { key: 'hits', label: 'Hits', getValue: r => safeVal(r?.expectedHits), note: hasAbilities.sustained ? 'incl. Sustained' : null },
    { key: 'wounds', label: 'Wounds', getValue: r => safeVal(r?.expectedWoundsFromHits), note: hasAbilities.lethal ? 'incl. Lethal' : null },
    { key: 'unsaved', label: 'Failed Saves', getValue: r => safeVal(r?.expectedUnsaved), note: hasAbilities.devastating ? 'Dev. bypass' : null },
  ];
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <h3 className="text-base font-semibold text-white mb-4">Attack Flow</h3>
      <div className="space-y-3">
        {stages.map((stage) => {
          const stageTotal = breakdown.reduce((sum, b) => sum + stage.getValue(b.result), 0);
          return (
            <div key={stage.key}>
              <div className="flex items-center gap-3 mb-1.5">
                <span className="w-20 text-xs text-zinc-500">{stage.label}</span>
                <span className="text-sm font-bold text-white font-mono">{fmt(stageTotal)}</span>
                {stage.note && <span className="text-[10px] text-orange-500">({stage.note})</span>}
              </div>
              <div className="h-5 bg-zinc-800/30 rounded overflow-hidden flex border border-zinc-800/50">
                {breakdown.map((b, i) => {
                  const value = stage.getValue(b.result);
                  const widthPercent = totalAttacks > 0 ? (value / totalAttacks) * 100 : 0;
                  const color = PROFILE_COLORS[i % PROFILE_COLORS.length];
                  return (
                    <div key={b.profile?.id || i} className="h-full relative group transition-all" style={{ width: `${safeVal(widthPercent)}%`, backgroundColor: color.bg }}>
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {b.profile?.name || 'Weapon'}: {fmt(value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        <div className="pt-3 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-1.5">
            <span className="w-20 text-xs font-semibold text-orange-500">Damage</span>
            <span className="text-lg font-bold text-orange-500 font-mono">{fmt(total?.expected)}</span>
          </div>
          <div className="h-7 bg-zinc-800/30 rounded-lg overflow-hidden flex border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)]">
            {breakdown.map((b, i) => {
              const totalExp = safeVal(total?.expected);
              const resultExp = safeVal(b.result?.expected);
              const widthPercent = totalExp > 0 ? (resultExp / totalExp) * 100 : 0;
              const color = PROFILE_COLORS[i % PROFILE_COLORS.length];
              return (
                <div key={b.profile?.id || i} className="h-full relative group transition-all" style={{ width: `${Math.max(safeVal(widthPercent), 1)}%`, backgroundColor: color.bg }}>
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
                  {widthPercent > 12 && <div className="absolute inset-0 flex items-center justify-center"><span className="text-xs font-bold text-white drop-shadow font-mono">{fmt(resultExp)}</span></div>}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {b.profile?.name || 'Weapon'}: {fmt(resultExp, 2)}
                    {safeVal(b.result?.devastatingDamage) > 0 && <span className="text-purple-400"> ({fmt(b.result.devastatingDamage)} Dev)</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {breakdown.length > 1 && (
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-zinc-800">
          {breakdown.map((b, i) => {
            const color = PROFILE_COLORS[i % PROFILE_COLORS.length];
            return <div key={b.profile?.id || i} className="flex items-center gap-2 text-xs"><div className="w-3 h-3 rounded" style={{ backgroundColor: color.bg }} /><span className="text-zinc-400">{b.profile?.name || 'Weapon'}</span></div>;
          })}
        </div>
      )}
      
      {(hasAbilities.sustained || hasAbilities.lethal || hasAbilities.devastating) && (
        <div className="mt-3 pt-3 border-t border-zinc-800 text-[10px] text-zinc-500">
          <span className="text-zinc-400">Active: </span>
          {[hasAbilities.sustained && 'Sustained Hits', hasAbilities.lethal && 'Lethal Hits', hasAbilities.devastating && 'Devastating Wounds'].filter(Boolean).join(', ')}
        </div>
      )}
    </div>
  );
}

export default AttackFlowDiagram;