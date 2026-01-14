import { useState, useMemo } from 'react';
import { calculateCombinedDamage, calculateDamage } from '../../utils/damageCalculations';
import { TOUGHNESS_RANGE, SAVE_RANGE, PROFILE_COLORS } from '../../utils/constants';

const fmt = (val, decimals = 1) => { const n = Number(val); return isNaN(n) || !isFinite(n) ? '0' : n.toFixed(decimals); };
const safeVal = (val) => { const n = Number(val); return isNaN(n) || !isFinite(n) ? 0 : n; };
const pct = (val) => `${Math.round(safeVal(val) * 100)}%`;

function DamageAnalysisTab({ profiles, units = [] }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [selectedCell, setSelectedCell] = useState({ toughness: 5, save: 3 });
  const [woundsPerModel, setWoundsPerModel] = useState(2);
  const [showMode, setShowMode] = useState('damage');
  const [breakdownMode, setBreakdownMode] = useState('unit');
  
  // Generate heatmap data
  const heatmapData = useMemo(() => {
    const data = [];
    let maxKills = 0;
    let maxDamage = 0;
    for (const t of TOUGHNESS_RANGE) {
      const row = [];
      for (const sv of SAVE_RANGE) {
        const combined = calculateCombinedDamage(profiles, { toughness: t, save: sv, wounds: woundsPerModel, models: 10 });
        const kills = combined.total.expected / woundsPerModel;
        row.push({ 
          expected: combined.total.expected,
          stdDev: combined.total.stdDev,
          toughness: t, 
          save: sv,
          kills,
          breakdown: combined.breakdown,
        });
        maxKills = Math.max(maxKills, kills);
        maxDamage = Math.max(maxDamage, safeVal(combined.total.expected));
      }
      data.push(row);
    }
    return { data, maxKills, maxDamage };
  }, [profiles, woundsPerModel]);
  
  // Calculate unit-level breakdown for selected cell
  const unitBreakdown = useMemo(() => {
    if (!units || units.length === 0) return [];
    
    const target = { 
      toughness: selectedCell.toughness, 
      save: selectedCell.save, 
      wounds: woundsPerModel, 
      models: 10 
    };
    
    return units.map((unit, unitIndex) => {
      const profileResults = unit.profiles.map(profile => ({
        profile,
        result: calculateDamage(profile, target)
      }));
      
      const unitStats = profileResults.reduce((acc, pr) => ({
        attacks: acc.attacks + safeVal(pr.result?.attacks),
        hits: acc.hits + safeVal(pr.result?.expectedHits),
        wounds: acc.wounds + safeVal(pr.result?.expectedWoundsFromHits),
        unsaved: acc.unsaved + safeVal(pr.result?.expectedUnsaved),
        damage: acc.damage + safeVal(pr.result?.expected),
        kills: acc.kills + safeVal(pr.result?.expectedKills),
      }), { attacks: 0, hits: 0, wounds: 0, unsaved: 0, damage: 0, kills: 0 });
      
      const hitRate = unitStats.attacks > 0 ? unitStats.hits / unitStats.attacks : 0;
      const woundRate = unitStats.hits > 0 ? unitStats.wounds / unitStats.hits : 0;
      const saveFailRate = unitStats.wounds > 0 ? unitStats.unsaved / unitStats.wounds : 0;
      
      return { unit, unitIndex, ...unitStats, hitRate, woundRate, saveFailRate, profileResults };
    });
  }, [units, selectedCell, woundsPerModel]);
  
  // Calculate weapon-level breakdown
  const weaponBreakdown = useMemo(() => {
    if (!profiles || profiles.length === 0) return [];
    
    const target = { 
      toughness: selectedCell.toughness, 
      save: selectedCell.save, 
      wounds: woundsPerModel, 
      models: 10 
    };
    
    const weaponToUnit = {};
    units.forEach((unit, unitIndex) => {
      unit.profiles.forEach(profile => {
        weaponToUnit[profile.id] = { unit, unitIndex };
      });
    });
    
    return profiles.map((profile, index) => {
      const result = calculateDamage(profile, target);
      const attacks = safeVal(result?.attacks);
      const hits = safeVal(result?.expectedHits);
      const wounds = safeVal(result?.expectedWoundsFromHits);
      const unsaved = safeVal(result?.expectedUnsaved);
      
      return {
        profile, index, unitInfo: weaponToUnit[profile.id],
        attacks, hits, wounds, unsaved,
        damage: safeVal(result?.expected),
        kills: safeVal(result?.expectedKills),
        hitRate: attacks > 0 ? hits / attacks : 0,
        woundRate: hits > 0 ? wounds / hits : 0,
        saveFailRate: wounds > 0 ? unsaved / wounds : 0,
      };
    });
  }, [profiles, units, selectedCell, woundsPerModel]);
  
  // Calculate totals for percentages
  const totalDamage = useMemo(() => {
    return unitBreakdown.reduce((sum, ub) => sum + ub.damage, 0) || 
           weaponBreakdown.reduce((sum, wb) => sum + wb.damage, 0);
  }, [unitBreakdown, weaponBreakdown]);
  
  // Find the full cell data for the selected cell
  const getFullCellData = (toughness, save) => {
    const rowIdx = TOUGHNESS_RANGE.indexOf(toughness);
    const colIdx = SAVE_RANGE.indexOf(save);
    if (rowIdx >= 0 && colIdx >= 0 && heatmapData.data[rowIdx]) {
      return heatmapData.data[rowIdx][colIdx];
    }
    const combined = calculateCombinedDamage(profiles, { toughness, save, wounds: woundsPerModel, models: 10 });
    return {
      expected: combined.total.expected,
      stdDev: combined.total.stdDev,
      toughness,
      save,
      kills: combined.total.expected / woundsPerModel,
      breakdown: combined.breakdown,
    };
  };
  
  const displayCell = hoveredCell || getFullCellData(selectedCell.toughness, selectedCell.save);
  
  // Heatmap color function
  const getHeatmapColor = (value, max) => {
    if (max === 0) return 'rgba(255,255,255,0.03)';
    const ratio = Math.min(value / max, 1);
    const r = Math.round(139 + ratio * (249 - 139));
    const g = Math.round(92 + ratio * (115 - 92));
    const b = Math.round(246 + ratio * (22 - 246));
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  // Get efficiency rating
  const getEfficiencyRating = (kills, maxKills) => {
    if (maxKills === 0) return { label: '—', color: 'text-zinc-500' };
    const ratio = kills / maxKills;
    if (ratio >= 0.8) return { label: 'Excellent', color: 'text-green-400' };
    if (ratio >= 0.5) return { label: 'Good', color: 'text-blue-400' };
    if (ratio >= 0.25) return { label: 'Fair', color: 'text-yellow-400' };
    return { label: 'Poor', color: 'text-red-400' };
  };

  const efficiency = getEfficiencyRating(displayCell.kills, heatmapData.maxKills);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Heatmap - takes 2 columns */}
        <div className="xl:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                {showMode === 'kills' ? `Expected Kills (${woundsPerModel}W models)` : 'Expected Damage'}
              </h2>
              <p className="text-xs text-zinc-500">Click any cell to see details</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Show:</span>
                <div className="flex rounded overflow-hidden border border-zinc-700">
                  <button
                    onClick={() => setShowMode('damage')}
                    className={`px-3 py-1 text-xs font-medium transition-all ${showMode === 'damage' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-400'}`}
                  >
                    Damage
                  </button>
                  <button
                    onClick={() => setShowMode('kills')}
                    className={`px-3 py-1 text-xs font-medium transition-all ${showMode === 'kills' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-400'}`}
                  >
                    Kills
                  </button>
                </div>
              </div>
              
              {showMode === 'kills' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">W:</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5, 6].map(w => (
                      <button
                        key={w}
                        onClick={() => setWoundsPerModel(w)}
                        className={`w-6 h-6 rounded text-xs font-medium transition-all ${
                          woundsPerModel === w ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="border-collapse w-full">
              <thead>
                <tr>
                  <th className="p-2 text-[10px] text-zinc-500 font-medium">T↓ Sv→</th>
                  {SAVE_RANGE.map(sv => (
                    <th key={sv} className="p-2.5 text-xs text-zinc-400 font-medium min-w-[52px]">
                      {sv <= 6 ? `${sv}+` : '—'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.data.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    <td className="p-2 text-xs text-zinc-400 font-medium text-center">{TOUGHNESS_RANGE[rowIdx]}</td>
                    {row.map((cell, colIdx) => {
                      const isHovered = hoveredCell?.toughness === cell.toughness && hoveredCell?.save === cell.save;
                      const isSelected = !hoveredCell && selectedCell.toughness === cell.toughness && selectedCell.save === cell.save;
                      const value = showMode === 'kills' ? cell.kills : cell.expected;
                      const max = showMode === 'kills' ? heatmapData.maxKills : heatmapData.maxDamage;
                      return (
                        <td
                          key={colIdx}
                          className={`p-2.5 text-center text-sm font-mono font-medium cursor-pointer transition-all ${
                            isSelected ? 'ring-2 ring-orange-500 ring-inset' : ''
                          } ${isHovered ? 'ring-2 ring-white/50 ring-inset' : ''}`}
                          style={{ 
                            backgroundColor: getHeatmapColor(value, max), 
                            color: value > max * 0.25 ? '#fff' : 'rgba(255,255,255,0.6)' 
                          }}
                          onMouseEnter={() => setHoveredCell(cell)}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => setSelectedCell({ toughness: cell.toughness, save: cell.save })}
                        >
                          {showMode === 'kills' 
                            ? (value >= 1 ? value.toFixed(1) : value.toFixed(2))
                            : value.toFixed(1)
                          }
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded" style={{ backgroundColor: 'rgb(139, 92, 246)' }} />
              <span className="text-[10px] text-zinc-500">Low</span>
              <div className="w-16 h-3 rounded" style={{ background: 'linear-gradient(to right, rgb(139, 92, 246), rgb(249, 115, 22))' }} />
              <span className="text-[10px] text-zinc-500">High</span>
              <div className="w-4 h-3 rounded" style={{ backgroundColor: 'rgb(249, 115, 22)' }} />
            </div>
            <span className="text-[10px] text-zinc-500">Brighter = more effective</span>
          </div>
        </div>
        
        {/* Selected Cell Details - 1 column */}
        <div className="space-y-4">
          {/* Quick Stats Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500/10 to-transparent p-4 border-b border-zinc-800">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Selected Target</div>
              <div className="text-xl font-bold text-white">
                T{displayCell.toughness} / {displayCell.save <= 6 ? `${displayCell.save}+ Sv` : 'No Save'}
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 font-mono">
                  {showMode === 'kills' ? fmt(displayCell.kills, 2) : fmt(displayCell.expected, 1)}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {showMode === 'kills' ? `models killed (${woundsPerModel}W each)` : 'damage dealt'}
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 px-3 bg-zinc-950 rounded-lg">
                <span className="text-xs text-zinc-500">Efficiency vs this target</span>
                <span className={`text-sm font-bold ${efficiency.color}`}>{efficiency.label}</span>
              </div>
              
              <div className="flex items-center justify-between text-xs py-2 px-3 bg-zinc-950 rounded-lg">
                <span className="text-zinc-500">Typical range</span>
                <span className="text-zinc-300 font-mono">
                  {fmt(Math.max(0, displayCell.expected - 1.5 * displayCell.stdDev))} — {fmt(displayCell.expected + 1.5 * displayCell.stdDev)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Breakdown Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="flex border-b border-zinc-800">
              <button
                onClick={() => setBreakdownMode('unit')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                  breakdownMode === 'unit' ? 'bg-zinc-800 text-white border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                By Unit
              </button>
              <button
                onClick={() => setBreakdownMode('weapon')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                  breakdownMode === 'weapon' ? 'bg-zinc-800 text-white border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                By Weapon
              </button>
            </div>
            
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {breakdownMode === 'unit' && unitBreakdown.length > 0 && (
                <div className="space-y-4">
                  {unitBreakdown.map((ub) => {
                    const color = PROFILE_COLORS[ub.unitIndex % PROFILE_COLORS.length];
                    const dmgPct = totalDamage > 0 ? (ub.damage / totalDamage) * 100 : 0;
                    return (
                      <div key={ub.unit.id} className="border-l-2 pl-3" style={{ borderColor: color.bg }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-white">{ub.unit.name}</span>
                          <span className="text-xs text-zinc-400 font-mono">{fmt(dmgPct, 0)}%</span>
                        </div>
                        <div className="text-xs text-zinc-400 mb-1.5 font-mono">
                          <span className="text-zinc-300">{fmt(ub.attacks, 0)}</span> atk → 
                          <span className="text-blue-400"> {fmt(ub.hits, 1)}</span> hits → 
                          <span className="text-green-400"> {fmt(ub.wounds, 1)}</span> wnd → 
                          <span className="text-purple-400"> {fmt(ub.unsaved, 1)}</span> unsv
                        </div>
                        <div className="text-[10px] text-zinc-500 mb-2">
                          <span className={ub.hitRate >= 0.5 ? 'text-green-400' : ub.hitRate >= 0.33 ? 'text-yellow-400' : 'text-red-400'}>{pct(ub.hitRate)}</span> hit · 
                          <span className={ub.woundRate >= 0.5 ? 'text-green-400' : ub.woundRate >= 0.33 ? 'text-yellow-400' : 'text-red-400'}> {pct(ub.woundRate)}</span> wnd · 
                          <span className={ub.saveFailRate >= 0.5 ? 'text-green-400' : ub.saveFailRate >= 0.33 ? 'text-yellow-400' : 'text-red-400'}> {pct(ub.saveFailRate)}</span> unsv
                        </div>
                        <div className="flex items-center gap-4 text-xs mb-2">
                          <span className="text-zinc-500">Damage: <span className="text-orange-400 font-semibold font-mono">{fmt(ub.damage)}</span></span>
                          <span className="text-zinc-500">Kills: <span className="text-orange-400 font-semibold font-mono">{fmt(ub.kills, 1)}</span></span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                          <div className="h-full rounded-full transition-all" style={{ width: `${dmgPct}%`, backgroundColor: color.bg }} />
                        </div>
                        <div className="ml-2 space-y-1 border-l border-zinc-700 pl-2">
                          {ub.profileResults.map((pr) => (
                            <div key={pr.profile.id} className="flex items-center justify-between text-[11px]">
                              <span className="text-zinc-500 truncate max-w-[120px]">└ {pr.profile.name}</span>
                              <span className="text-zinc-400 font-mono">{fmt(safeVal(pr.result?.expected))} dmg</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {breakdownMode === 'weapon' && weaponBreakdown.length > 0 && (
                <div className="space-y-4">
                  {weaponBreakdown.map((wb) => {
                    const color = PROFILE_COLORS[wb.index % PROFILE_COLORS.length];
                    const dmgPct = totalDamage > 0 ? (wb.damage / totalDamage) * 100 : 0;
                    return (
                      <div key={wb.profile?.id || wb.index} className="border-l-2 pl-3" style={{ borderColor: color.bg }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{wb.profile?.name || 'Weapon'}</span>
                            {wb.unitInfo && <span className="text-[10px] text-zinc-500">({wb.unitInfo.unit.name})</span>}
                          </div>
                          <span className="text-xs text-zinc-400 font-mono">{fmt(dmgPct, 0)}%</span>
                        </div>
                        <div className="text-xs text-zinc-400 mb-1.5 font-mono">
                          <span className="text-zinc-300">{fmt(wb.attacks, 0)}</span> atk → 
                          <span className="text-blue-400"> {fmt(wb.hits, 1)}</span> hits → 
                          <span className="text-green-400"> {fmt(wb.wounds, 1)}</span> wnd → 
                          <span className="text-purple-400"> {fmt(wb.unsaved, 1)}</span> unsv
                        </div>
                        <div className="text-[10px] text-zinc-500 mb-2">
                          <span className={wb.hitRate >= 0.5 ? 'text-green-400' : wb.hitRate >= 0.33 ? 'text-yellow-400' : 'text-red-400'}>{pct(wb.hitRate)}</span> hit · 
                          <span className={wb.woundRate >= 0.5 ? 'text-green-400' : wb.woundRate >= 0.33 ? 'text-yellow-400' : 'text-red-400'}> {pct(wb.woundRate)}</span> wnd · 
                          <span className={wb.saveFailRate >= 0.5 ? 'text-green-400' : wb.saveFailRate >= 0.33 ? 'text-yellow-400' : 'text-red-400'}> {pct(wb.saveFailRate)}</span> unsv
                        </div>
                        <div className="flex items-center gap-4 text-xs mb-2">
                          <span className="text-zinc-500">Damage: <span className="text-orange-400 font-semibold font-mono">{fmt(wb.damage)}</span></span>
                          <span className="text-zinc-500">Kills: <span className="text-orange-400 font-semibold font-mono">{fmt(wb.kills, 1)}</span></span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${dmgPct}%`, backgroundColor: color.bg }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {((breakdownMode === 'unit' && unitBreakdown.length === 0) || (breakdownMode === 'weapon' && weaponBreakdown.length === 0)) && (
                <div className="text-center py-6 text-zinc-500 text-sm">
                  No {breakdownMode === 'unit' ? 'units' : 'weapons'} to display
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DamageAnalysisTab;