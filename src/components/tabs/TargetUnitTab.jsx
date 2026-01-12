import { useState, useMemo } from 'react';
import { calculateCombinedDamage, getWoundRollNeeded } from '../../utils/damageCalculations';
import { TARGET_PRESETS, DEFAULT_TARGET, UNIT_KEYWORDS, PROFILE_COLORS } from '../../utils/constants';
import { Stepper } from '../ui';

const fmt = (val, decimals = 1) => { const n = Number(val); return isNaN(n) || !isFinite(n) ? '0' : n.toFixed(decimals); };
const safeVal = (val) => { const n = Number(val); return isNaN(n) || !isFinite(n) ? 0 : n; };
const pct = (val) => `${Math.round(safeVal(val) * 100)}%`;

function normalCDF(x, mean, stdDev) {
  if (stdDev === 0) return x >= mean ? 1 : 0;
  const z = (x - mean) / stdDev;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

function ToggleChip({ label, active, onChange, color = 'orange' }) {
  const colors = { orange: 'bg-orange-500', purple: 'bg-purple-500', green: 'bg-green-500', blue: 'bg-blue-500' };
  return (
    <button
      onClick={() => onChange(!active)}
      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
        active ? `${colors[color]} text-white` : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
      }`}
    >
      {label}
    </button>
  );
}

function NumberSelect({ label, value, onChange, options, color = 'orange' }) {
  const colors = { orange: 'bg-orange-500', purple: 'bg-purple-500', green: 'bg-green-500', blue: 'bg-blue-500' };
  const active = value !== options[0]?.value;
  return (
    <div className="flex items-center">
      <span className={`px-2 py-1.5 rounded-l text-xs font-medium ${active ? `${colors[color]} text-white` : 'bg-zinc-800 text-zinc-400'}`}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="bg-zinc-700 text-white text-xs py-1.5 px-2 rounded-r border-l border-zinc-600 focus:outline-none"
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function TargetUnitTab({ profiles }) {
  const [target, setTarget] = useState(DEFAULT_TARGET);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Calculate average weapon stats for roll display
  const weaponStats = useMemo(() => {
    if (!profiles || profiles.length === 0) return { bs: 3, strength: 4, ap: 0 };
    const total = profiles.reduce((acc, p) => {
      const atk = (typeof p.attacks === 'number' ? p.attacks : parseFloat(p.attacks) || 1) * (p.modelCount || 1);
      return {
        attacks: acc.attacks + atk,
        bs: acc.bs + (p.bs || 3) * atk,
        strength: acc.strength + (p.strength || 4) * atk,
        ap: acc.ap + (p.ap || 0) * atk,
      };
    }, { attacks: 0, bs: 0, strength: 0, ap: 0 });
    return {
      bs: Math.round(total.bs / total.attacks),
      strength: Math.round(total.strength / total.attacks),
      ap: Math.round(total.ap / total.attacks),
    };
  }, [profiles]);
  
  const combinedData = useMemo(() => calculateCombinedDamage(profiles, target), [profiles, target]);
  
  const analysis = useMemo(() => {
    const { total, breakdown } = combinedData;
    
    const totalAttacks = breakdown.reduce((sum, b) => sum + safeVal(b.result?.attacks), 0);
    const totalHits = breakdown.reduce((sum, b) => sum + safeVal(b.result?.expectedHits), 0);
    const totalWounds = breakdown.reduce((sum, b) => sum + safeVal(b.result?.expectedWoundsFromHits), 0);
    const totalUnsaved = breakdown.reduce((sum, b) => sum + safeVal(b.result?.expectedUnsaved), 0);
    const totalDamage = safeVal(total.expected);
    
    const lostToMisses = totalAttacks - totalHits;
    const lostToFailedWounds = totalHits - totalWounds;
    const lostToSaves = totalWounds - totalUnsaved;
    
    const losses = [
      { name: 'Misses', value: lostToMisses, suggestion: 'Improve BS or add hit rerolls' },
      { name: 'Failed Wounds', value: lostToFailedWounds, suggestion: 'Need higher Strength' },
      { name: 'Armor Saves', value: lostToSaves, suggestion: 'Need more AP' },
    ];
    const biggestLoss = losses.reduce((max, l) => l.value > max.value ? l : max, losses[0]);
    
    const stdDev = safeVal(total.stdDev);
    const expectedKills = safeVal(total.expectedKills);
    const woundsPerModel = target.wounds || 1;
    
    const probKillAtLeast1 = totalDamage > 0 ? Math.min(0.99, 1 - normalCDF(woundsPerModel, totalDamage, stdDev)) : 0;
    const probWipe = target.models > 0 ? Math.max(0.01, 1 - normalCDF(target.models * woundsPerModel, totalDamage, stdDev)) : 0;
    
    const woundRoll = getWoundRollNeeded(weaponStats.strength, target.toughness);
    const effectiveSave = Math.min(7, target.save + weaponStats.ap);
    
    return {
      totalAttacks, totalHits, totalWounds, totalUnsaved, totalDamage,
      lostToMisses, lostToFailedWounds, lostToSaves,
      biggestLoss, stdDev, expectedKills, probKillAtLeast1, probWipe,
      woundRoll, effectiveSave, breakdown,
    };
  }, [combinedData, target, weaponStats]);

  const applyPreset = (preset) => {
    setTarget({
      ...DEFAULT_TARGET, toughness: preset.t, save: preset.sv, wounds: preset.w,
      models: preset.m, name: preset.name, invuln: preset.invuln || 7,
      fnp: preset.fnp || 7, keywords: preset.keywords || ['INFANTRY'],
      damageReduction: preset.damageReduction || 0, damageCap: preset.damageCap || 0,
    });
  };

  const activeDefenses = [
    target.invuln < 7, target.fnp < 7, target.hasCover, target.stealth,
    target.minusToWound > 0, target.transhumanlike, target.damageReduction > 0,
    target.damageCap > 0, target.apReduction > 0,
  ].filter(Boolean).length;

  // Color for "Their Save" - from attacker's perspective
  const getSaveColor = (save) => {
    if (save > 6) return 'text-green-400'; // No save = great for attacker
    if (save >= 5) return 'text-yellow-400'; // 5+/6+ = okay
    return 'text-red-400'; // 2+/3+/4+ = bad for attacker
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Left Column - Target Configuration */}
      <div className="space-y-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <h3 className="text-base font-semibold text-white mb-4">Target Unit</h3>
          
          {/* Presets */}
          <div className="mb-4">
            <label className="block text-xs text-zinc-500 mb-2">Quick Select</label>
            <div className="flex flex-wrap gap-1.5">
              {TARGET_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    target.name === preset.name ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Toughness</label>
              <div className="flex flex-wrap gap-1">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(val => (
                  <button
                    key={val}
                    onClick={() => setTarget({ ...target, toughness: val, name: '' })}
                    className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                      target.toughness === val ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Armor Save</label>
              <div className="flex gap-1">
                {[2, 3, 4, 5, 6, 7].map(val => (
                  <button
                    key={val}
                    onClick={() => setTarget({ ...target, save: val, name: '' })}
                    className={`flex-1 h-8 rounded text-xs font-medium transition-colors ${
                      target.save === val ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {val <= 6 ? `${val}+` : '—'}
                  </button>
                ))}
              </div>
            </div>
            
            <Stepper label="Wounds / Model" value={target.wounds} onChange={(v) => setTarget({ ...target, wounds: v, name: '' })} min={1} max={30} />
            <Stepper label="Models in Unit" value={target.models} onChange={(v) => setTarget({ ...target, models: v, name: '' })} min={1} max={30} />
          </div>
          
          {/* Total wound pool */}
          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500">Total wound pool</span>
            <span className="text-sm font-bold text-white">{target.wounds * target.models} wounds</span>
          </div>
        </div>
        
        {/* Defensive Abilities */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center justify-between w-full p-4">
            <div className="flex items-center gap-2">
              <svg className={`w-4 h-4 text-zinc-500 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-medium text-white">Defensive Abilities</span>
            </div>
            {activeDefenses > 0 && <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded">{activeDefenses}</span>}
          </button>
          
          {showAdvanced && (
            <div className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <NumberSelect label="Invuln" value={target.invuln} onChange={(v) => setTarget({ ...target, invuln: v })}
                  options={[{ value: 7, label: 'None' }, { value: 6, label: '6++' }, { value: 5, label: '5++' }, { value: 4, label: '4++' }, { value: 3, label: '3++' }]} color="purple" />
                <NumberSelect label="FNP" value={target.fnp} onChange={(v) => setTarget({ ...target, fnp: v })}
                  options={[{ value: 7, label: 'None' }, { value: 6, label: '6+++' }, { value: 5, label: '5+++' }, { value: 4, label: '4+++' }]} color="green" />
              </div>
              <div className="flex flex-wrap gap-2">
                <ToggleChip label="Cover" active={target.hasCover} onChange={(v) => setTarget({ ...target, hasCover: v })} />
                <ToggleChip label="Stealth" active={target.stealth} onChange={(v) => setTarget({ ...target, stealth: v })} />
                <ToggleChip label="Transhuman" active={target.transhumanlike} onChange={(v) => setTarget({ ...target, transhumanlike: v })} color="green" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NumberSelect label="-X Damage" value={target.damageReduction || 0} onChange={(v) => setTarget({ ...target, damageReduction: v })}
                  options={[{ value: 0, label: 'None' }, { value: 1, label: '-1' }, { value: 2, label: '-2' }]} color="blue" />
                <NumberSelect label="Dmg Cap" value={target.damageCap || 0} onChange={(v) => setTarget({ ...target, damageCap: v })}
                  options={[{ value: 0, label: 'None' }, { value: 3, label: 'Max 3' }, { value: 6, label: 'Max 6' }]} color="blue" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Keywords (for Anti-X)</label>
                <div className="flex flex-wrap gap-1.5">
                  {UNIT_KEYWORDS.map(kw => (
                    <button key={kw} onClick={() => {
                      const keywords = target.keywords || [];
                      setTarget({ ...target, keywords: keywords.includes(kw) ? keywords.filter(k => k !== kw) : [...keywords, kw] });
                    }} className={`px-2 py-1 rounded text-xs transition-colors ${(target.keywords || []).includes(kw) ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}>
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Column - Results */}
      <div className="space-y-4">
        {/* Main Result Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-zinc-500">{target.name || 'Custom Target'}</div>
                <div className="text-lg font-bold text-white">
                  T{target.toughness} · {target.save <= 6 ? `${target.save}+ Sv` : 'No Sv'}
                  {target.invuln < 7 && ` · ${target.invuln}++`}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {target.wounds}W × {target.models} models = {target.wounds * target.models} wounds
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-orange-500 font-mono">{fmt(analysis.expectedKills, 1)}</div>
                <div className="text-xs text-zinc-500">of {target.models} models killed</div>
              </div>
            </div>
          </div>
          
          {/* Roll Requirements */}
          <div className="grid grid-cols-3 border-b border-zinc-800">
            <div className="p-3 text-center border-r border-zinc-800">
              <div className="text-xl font-bold text-blue-400 font-mono">{weaponStats.bs}+</div>
              <div className="text-[10px] text-zinc-500 uppercase">To Hit</div>
            </div>
            <div className="p-3 text-center border-r border-zinc-800">
              <div className={`text-xl font-bold font-mono ${analysis.woundRoll <= 3 ? 'text-green-400' : analysis.woundRoll >= 5 ? 'text-red-400' : 'text-yellow-400'}`}>
                {analysis.woundRoll}+
              </div>
              <div className="text-[10px] text-zinc-500 uppercase">To Wound</div>
            </div>
            <div className="p-3 text-center">
              <div className={`text-xl font-bold font-mono ${getSaveColor(analysis.effectiveSave)}`}>
                {analysis.effectiveSave <= 6 ? `${analysis.effectiveSave}+` : '—'}
              </div>
              <div className="text-[10px] text-zinc-500 uppercase">Their Save</div>
            </div>
          </div>
          
          {/* Model Kill Visualization */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {Array.from({ length: Math.min(target.models, 12) }).map((_, i) => {
                const killProgress = analysis.expectedKills - i;
                const fillPercent = Math.max(0, Math.min(1, killProgress)) * 100;
                const isFullyDead = killProgress >= 1;
                const isPartial = killProgress > 0 && killProgress < 1;
                return (
                  <div 
                    key={i} 
                    className={`relative w-10 h-10 rounded-lg overflow-hidden ${isFullyDead ? 'bg-red-500/30' : 'bg-zinc-800'}`}
                  >
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-orange-500/80 transition-all"
                      style={{ height: `${fillPercent}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {isFullyDead ? (
                        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <svg className={`w-6 h-6 ${isPartial ? 'text-orange-300' : 'text-zinc-600'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
              {target.models > 12 && <span className="text-xs text-zinc-500 ml-1">+{target.models - 12} more</span>}
            </div>
            <div className="text-xs text-zinc-500">
              Expected: <span className="text-orange-400 font-medium">{fmt(analysis.expectedKills, 2)} models killed</span>
              <span className="text-zinc-600 mx-2">·</span>
              Range: {fmt(Math.max(0, analysis.expectedKills - analysis.stdDev / target.wounds), 1)} – {fmt(analysis.expectedKills + analysis.stdDev / target.wounds, 1)}
            </div>
          </div>
          
          {/* Probability Cards */}
          <div className="grid grid-cols-2 divide-x divide-zinc-800">
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400 font-mono">{pct(analysis.probKillAtLeast1)}</div>
              <div className="text-xs text-zinc-500">Chance to kill 1+ model</div>
            </div>
            <div className="p-4 text-center">
              <div className={`text-2xl font-bold font-mono ${analysis.probWipe > 0.5 ? 'text-green-400' : analysis.probWipe > 0.15 ? 'text-yellow-400' : 'text-zinc-500'}`}>
                {pct(analysis.probWipe)}
              </div>
              <div className="text-xs text-zinc-500">Chance to wipe unit</div>
            </div>
          </div>
        </div>
        
        {/* Attack Pipeline */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Where Your Attacks Go</h3>
          
          <div className="space-y-3">
            <FunnelRow 
              label="Attacks" 
              value={analysis.totalAttacks} 
              max={analysis.totalAttacks} 
              color="bg-zinc-500" 
              isFirst 
            />
            <FunnelRow 
              label="Hit" 
              value={analysis.totalHits} 
              max={analysis.totalAttacks} 
              prevMax={analysis.totalAttacks}
              lost={analysis.lostToMisses} 
              lostLabel="missed" 
              color="bg-blue-500" 
            />
            <FunnelRow 
              label="Wound" 
              value={analysis.totalWounds} 
              max={analysis.totalAttacks} 
              prevMax={analysis.totalHits}
              lost={analysis.lostToFailedWounds} 
              lostLabel="failed to wound" 
              color="bg-green-500" 
            />
            <FunnelRow 
              label="Unsaved" 
              value={analysis.totalUnsaved} 
              max={analysis.totalAttacks} 
              prevMax={analysis.totalWounds}
              lost={analysis.lostToSaves} 
              lostLabel="saved by armor" 
              color="bg-purple-500" 
            />
          </div>
          
          <div className="mt-4 pt-3 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Total Damage</span>
              <span className="text-lg text-orange-400 font-bold font-mono">{fmt(analysis.totalDamage)}</span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Overall: <span className="text-orange-400 font-medium">{pct(analysis.totalUnsaved / analysis.totalAttacks)}</span> of attacks get through
            </div>
          </div>
        </div>
        
        {/* Biggest Problem + Suggestion */}
        {analysis.biggestLoss.value > 0 && (
          <div className="bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Biggest Loss: {analysis.biggestLoss.name}</div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {fmt(analysis.biggestLoss.value)} attacks ({pct(analysis.biggestLoss.value / analysis.totalAttacks)}) lost here
                </div>
                <div className="text-xs text-orange-400 mt-1.5 flex items-center gap-1">
                  <span>💡</span> {analysis.biggestLoss.suggestion}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Per-Weapon Breakdown */}
        {analysis.breakdown.length > 1 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-3">By Weapon</h3>
            <div className="space-y-2">
              {analysis.breakdown.map((b, i) => {
                const color = PROFILE_COLORS[i % PROFILE_COLORS.length];
                const dmg = safeVal(b.result?.expected);
                const kills = safeVal(b.result?.expectedKills);
                const pctOfTotal = analysis.totalDamage > 0 ? (dmg / analysis.totalDamage) * 100 : 0;
                return (
                  <div key={b.profile?.id || i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color.bg }} />
                        <span className="text-zinc-300">{b.profile?.name || 'Weapon'}</span>
                      </div>
                      <span className="text-white font-mono">{fmt(dmg)} dmg · {fmt(kills, 1)} kills</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pctOfTotal}%`, backgroundColor: color.bg }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Funnel row component - with percentage showing conversion rate
function FunnelRow({ label, value, max, prevMax, lost, lostLabel, color, isFirst = false }) {
  const pctWidth = max > 0 ? (value / max) * 100 : 0;
  // Show conversion rate from previous step (e.g., hits/attacks, wounds/hits)
  const conversionRate = prevMax > 0 ? (value / prevMax) : (isFirst ? 1 : 0);
  
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="w-14 text-xs text-zinc-400 text-right">{label}</div>
        <div className="flex-1 h-5 bg-zinc-800/50 rounded relative overflow-hidden">
          <div 
            className={`h-full ${color} rounded transition-all flex items-center justify-center`}
            style={{ width: `${Math.max(pctWidth, 8)}%` }}
          >
            <span className="text-[11px] font-bold text-white drop-shadow">{fmt(value)}</span>
          </div>
        </div>
        <div className="w-12 text-right">
          {!isFirst && (
            <span className={`text-xs font-medium ${conversionRate >= 0.5 ? 'text-green-400' : conversionRate >= 0.25 ? 'text-yellow-400' : 'text-red-400'}`}>
              {pct(conversionRate)}
            </span>
          )}
        </div>
      </div>
      {lost > 0 && (
        <div className="flex items-center gap-3 mt-0.5">
          <div className="w-14" />
          <div className="text-[10px] text-red-400">
            −{fmt(lost)} {lostLabel}
          </div>
          <div className="w-12" />
        </div>
      )}
    </div>
  );
}

export default TargetUnitTab;