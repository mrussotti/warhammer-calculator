import { useState, useMemo } from 'react';

// Wound roll probability based on S vs T
function getWoundProb(strength, toughness) {
  if (strength >= toughness * 2) return 5/6;
  if (strength > toughness) return 4/6;
  if (strength === toughness) return 3/6;
  if (strength * 2 <= toughness) return 1/6;
  return 2/6;
}

function getWoundRollNeeded(strength, toughness) {
  if (strength >= toughness * 2) return '2+';
  if (strength > toughness) return '3+';
  if (strength === toughness) return '4+';
  if (strength * 2 <= toughness) return '6+';
  return '5+';
}

function getFailSaveProb(save, ap) {
  const modifiedSave = save + ap;
  if (modifiedSave > 6) return 1;
  return (modifiedSave - 1) / 6;
}

function parseDamage(damageStr) {
  const str = damageStr.trim().toUpperCase();
  
  if (/^\d+$/.test(str)) {
    return { mean: parseInt(str), variance: 0, min: parseInt(str), max: parseInt(str) };
  }
  if (str === 'D3') return { mean: 2, variance: 2/3, min: 1, max: 3 };
  if (str === 'D6') return { mean: 3.5, variance: 35/12, min: 1, max: 6 };
  
  const d3Match = str.match(/^D3\+(\d+)$/);
  if (d3Match) {
    const bonus = parseInt(d3Match[1]);
    return { mean: 2 + bonus, variance: 2/3, min: 1 + bonus, max: 3 + bonus };
  }
  
  const d6Match = str.match(/^D6\+(\d+)$/);
  if (d6Match) {
    const bonus = parseInt(d6Match[1]);
    return { mean: 3.5 + bonus, variance: 35/12, min: 1 + bonus, max: 6 + bonus };
  }
  
  const multiMatch = str.match(/^(\d+)D(\d+)$/);
  if (multiMatch) {
    const numDice = parseInt(multiMatch[1]);
    const dieSize = parseInt(multiMatch[2]);
    return { 
      mean: numDice * (dieSize + 1) / 2, 
      variance: numDice * (dieSize * dieSize - 1) / 12,
      min: numDice,
      max: numDice * dieSize
    };
  }
  
  return { mean: 1, variance: 0, min: 1, max: 1 };
}

function calculateOverkillFactor(damageStats, woundsPerModel) {
  const { mean, min, max } = damageStats;
  
  if (min === max) {
    if (mean >= woundsPerModel) {
      return woundsPerModel / mean;
    }
    const hitsToKill = Math.ceil(woundsPerModel / mean);
    const totalDamageDealt = hitsToKill * mean;
    return woundsPerModel / totalDamageDealt;
  }
  
  if (mean >= woundsPerModel) {
    const expectedWaste = Math.max(0, (mean - woundsPerModel) * 0.5);
    return woundsPerModel / (woundsPerModel + expectedWaste);
  }
  
  const avgHitsToKill = woundsPerModel / mean;
  const fractionalPart = avgHitsToKill - Math.floor(avgHitsToKill);
  const expectedOverkill = fractionalPart * mean * 0.5;
  return woundsPerModel / (woundsPerModel + expectedOverkill);
}

function calculateDamage(profile, toughness, save, woundsPerModel = null) {
  const hitProb = (7 - profile.bs) / 6;
  const woundProb = getWoundProb(profile.strength, toughness);
  const failSaveProb = getFailSaveProb(save, profile.ap);
  const damage = parseDamage(profile.damage);
  
  const pSuccess = hitProb * woundProb * failSaveProb;
  const expectedWounds = profile.attacks * pSuccess;
  const expectedDamage = expectedWounds * damage.mean;
  
  const varN = profile.attacks * pSuccess * (1 - pSuccess);
  const variance = expectedWounds * damage.variance + varN * damage.mean * damage.mean;
  
  let expectedKills = null;
  let overkillEfficiency = null;
  
  if (woundsPerModel) {
    overkillEfficiency = calculateOverkillFactor(damage, woundsPerModel);
    const effectiveDamage = expectedDamage * overkillEfficiency;
    expectedKills = effectiveDamage / woundsPerModel;
  }
  
  return {
    expected: expectedDamage,
    variance,
    stdDev: Math.sqrt(variance),
    woundProb,
    failSaveProb,
    pSuccess,
    expectedWounds,
    attacks: profile.attacks,
    expectedHits: profile.attacks * hitProb,
    expectedWoundsFromHits: profile.attacks * hitProb * woundProb,
    expectedUnsaved: profile.attacks * hitProb * woundProb * failSaveProb,
    hitProb,
    expectedKills,
    overkillEfficiency,
    damagePerWound: damage.mean,
  };
}

function calculateCombinedDamage(profiles, toughness, save, woundsPerModel = null, modelCount = null) {
  const results = profiles.map(p => ({
    profile: p,
    result: calculateDamage(p, toughness, save, woundsPerModel)
  }));
  
  const totalExpected = results.reduce((sum, r) => sum + r.result.expected, 0);
  const totalVariance = results.reduce((sum, r) => sum + r.result.variance, 0);
  
  let totalKills = null;
  let actualKills = null;
  let overkillWaste = null;
  
  if (woundsPerModel && modelCount) {
    totalKills = results.reduce((sum, r) => sum + (r.result.expectedKills || 0), 0);
    actualKills = Math.min(totalKills, modelCount);
    overkillWaste = totalKills > modelCount ? (totalKills - modelCount) * woundsPerModel : 0;
  }
  
  return {
    total: {
      expected: totalExpected,
      variance: totalVariance,
      stdDev: Math.sqrt(totalVariance),
      expectedKills: actualKills,
      maxKills: modelCount,
      overkillWaste,
      woundsPerModel,
    },
    breakdown: results,
  };
}

function getHeatmapColor(value, max) {
  if (max === 0) return 'rgb(240, 240, 240)';
  const ratio = Math.min(value / max, 1);
  const r = Math.round(60 + ratio * 195);
  const g = Math.round(20 + ratio * 180);
  const b = Math.round(80 - ratio * 60);
  return `rgb(${r}, ${g}, ${b})`;
}

const PROFILE_COLORS = [
  { bg: '#f97316', light: '#fb923c' },
  { bg: '#3b82f6', light: '#60a5fa' },
  { bg: '#10b981', light: '#34d399' },
  { bg: '#8b5cf6', light: '#a78bfa' },
  { bg: '#ec4899', light: '#f472b6' },
  { bg: '#eab308', light: '#facc15' },
];

function Stepper({ value, onChange, min = 0, max = Infinity, label, showValue, small = false }) {
  return (
    <div>
      {label && <label className="block text-xs text-gray-500 mb-1">{label}</label>}
      <div className="flex items-center">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className={`${small ? 'px-2 py-1 text-sm' : 'px-3 py-1.5'} bg-gray-700 hover:bg-gray-600 rounded-l text-gray-300 font-medium transition-colors`}
        >
          −
        </button>
        <div className={`${small ? 'w-10 py-1 text-sm' : 'w-12 py-1.5'} bg-gray-900 text-center text-white font-bold border-y border-gray-600`}>
          {showValue || value}
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className={`${small ? 'px-2 py-1 text-sm' : 'px-3 py-1.5'} bg-gray-700 hover:bg-gray-600 rounded-r text-gray-300 font-medium transition-colors`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function WeaponProfileCard({ profile, index, color, onUpdate, onRemove, canRemove }) {
  const hitProb = (7 - profile.bs) / 6;
  const damageStats = parseDamage(profile.damage);
  
  return (
    <div 
      className="bg-gray-800 rounded-lg p-4 border-l-4"
      style={{ borderLeftColor: color.bg }}
    >
      <div className="flex items-start justify-between mb-3">
        <input
          type="text"
          value={profile.name}
          onChange={(e) => onUpdate({ ...profile, name: e.target.value })}
          className="bg-transparent text-white font-semibold text-lg focus:outline-none focus:border-b focus:border-gray-500 w-full"
          placeholder="Weapon name"
        />
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-gray-500 hover:text-red-400 ml-2 p-1 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Stepper label="Attacks" value={profile.attacks} onChange={(v) => onUpdate({ ...profile, attacks: v })} min={1} small />
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">BS/WS</label>
          <div className="flex">
            {[2, 3, 4, 5, 6].map((val, i) => (
              <button
                key={val}
                onClick={() => onUpdate({ ...profile, bs: val })}
                className={`flex-1 py-1 text-xs font-medium transition-colors ${i === 0 ? 'rounded-l' : ''} ${i === 4 ? 'rounded-r' : ''} ${
                  profile.bs === val ? 'text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
                style={profile.bs === val ? { backgroundColor: color.bg } : {}}
              >
                {val}+
              </button>
            ))}
          </div>
        </div>
        
        <Stepper label="Strength" value={profile.strength} onChange={(v) => onUpdate({ ...profile, strength: v })} min={1} small />
        <Stepper label="AP" value={profile.ap} onChange={(v) => onUpdate({ ...profile, ap: v })} min={0} showValue={`-${profile.ap}`} small />
      </div>
      
      <div className="mt-3">
        <label className="block text-xs text-gray-500 mb-1">Damage</label>
        <div className="flex flex-wrap gap-1">
          {['1', '2', '3', 'D3', 'D6', 'D6+1'].map(preset => (
            <button
              key={preset}
              onClick={() => onUpdate({ ...profile, damage: preset })}
              className={`px-2 py-0.5 rounded font-mono text-xs transition-colors ${
                profile.damage === preset ? 'text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
              style={profile.damage === preset ? { backgroundColor: color.bg } : {}}
            >
              {preset}
            </button>
          ))}
          <input
            type="text"
            value={profile.damage}
            onChange={(e) => onUpdate({ ...profile, damage: e.target.value })}
            className="px-2 py-0.5 bg-gray-700 rounded text-white text-xs font-mono border border-gray-600 focus:border-orange-500 focus:outline-none w-14"
          />
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-700 flex gap-4 text-xs text-gray-500">
        <span>Hit: {(hitProb * 100).toFixed(0)}%</span>
        <span>D: {damageStats.mean.toFixed(1)}{damageStats.variance > 0 && ` ±${Math.sqrt(damageStats.variance).toFixed(1)}`}</span>
      </div>
    </div>
  );
}

function ModelKillDisplay({ kills, total, woundsPerModel }) {
  const deadModels = Math.floor(kills);
  const partialDamage = (kills - deadModels) * woundsPerModel;
  const aliveModels = Math.max(0, total - deadModels - (partialDamage > 0 ? 1 : 0));
  
  // Limit display to 20 models max
  const displayTotal = Math.min(total, 20);
  const scale = total > 20 ? displayTotal / total : 1;
  
  const displayDead = Math.floor(deadModels * scale);
  const displayPartial = partialDamage > 0 && (displayDead < displayTotal);
  const displayAlive = displayTotal - displayDead - (displayPartial ? 1 : 0);
  
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: displayDead }).map((_, i) => (
          <div key={`dead-${i}`} className="w-7 h-7 rounded bg-red-500/80 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        ))}
        
        {displayPartial && (
          <div className="w-7 h-7 rounded bg-yellow-500/80 flex items-center justify-center text-xs font-bold text-yellow-900">
            {Math.round(partialDamage)}
          </div>
        )}
        
        {Array.from({ length: Math.max(0, displayAlive) }).map((_, i) => (
          <div key={`alive-${i}`} className="w-7 h-7 rounded bg-gray-600 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
        ))}
      </div>
      {total > 20 && (
        <div className="text-xs text-gray-500 mt-1">Showing scaled representation ({total} models)</div>
      )}
    </div>
  );
}

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
                      <div className="absolute inset-x-0 top-0 h-1/2 opacity-20" style={{ background: 'linear-gradient(180deg, white 0%, transparent 100%)' }} />
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
        
        {/* Damage bar */}
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
                  style={{ width: `${Math.max(widthPercent, 1)}%`, backgroundColor: color.bg, boxShadow: `0 0 15px ${color.bg}40` }}
                >
                  <div className="absolute inset-x-0 top-0 h-1/2 opacity-20" style={{ background: 'linear-gradient(180deg, white 0%, transparent 100%)' }} />
                  {widthPercent > 12 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow">{b.result.expected.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {b.profile.name}: {b.result.expected.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Legend */}
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

function DamageDistribution({ expected, stdDev }) {
  if (expected === 0) return null;
  
  const maxDisplay = expected + 2.5 * stdDev;
  
  return (
    <div className="bg-gray-800 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-gray-300 mb-4">Damage Distribution</h3>
      
      <div className="relative h-14 bg-gray-700/50 rounded-lg overflow-hidden">
        <div 
          className="absolute top-0 h-full bg-orange-500/30 transition-all duration-300"
          style={{
            left: `${Math.max(0, (expected - 2 * stdDev) / maxDisplay * 100)}%`,
            width: `${Math.min(100, (4 * stdDev) / maxDisplay * 100)}%`,
          }}
        />
        <div 
          className="absolute top-0 h-full bg-orange-500/50 transition-all duration-300"
          style={{
            left: `${Math.max(0, (expected - stdDev) / maxDisplay * 100)}%`,
            width: `${Math.min(100, (2 * stdDev) / maxDisplay * 100)}%`,
          }}
        />
        <div 
          className="absolute top-0 h-full w-0.5 bg-orange-400 transition-all duration-300"
          style={{ left: `${(expected / maxDisplay) * 100}%` }}
        />
        
        <div className="absolute inset-0 flex items-center justify-between px-4 text-xs text-white/70">
          <span>{Math.max(0, expected - 2 * stdDev).toFixed(1)}</span>
          <span className="font-bold text-orange-400">{expected.toFixed(1)}</span>
          <span>{(expected + 2 * stdDev).toFixed(1)}</span>
        </div>
      </div>
      
      <div className="flex justify-center gap-6 mt-2 text-xs text-gray-500">
        <span>68%: {Math.max(0, expected - stdDev).toFixed(1)}–{(expected + stdDev).toFixed(1)}</span>
        <span>95%: {Math.max(0, expected - 2*stdDev).toFixed(1)}–{(expected + 2*stdDev).toFixed(1)}</span>
      </div>
    </div>
  );
}

// ============ TAB 1: DAMAGE ANALYSIS (Heatmap) ============
function DamageAnalysisTab({ profiles }) {
  const [showMode, setShowMode] = useState('expected');
  const [hoveredCell, setHoveredCell] = useState(null);
  const [selectedCell, setSelectedCell] = useState({ toughness: 5, save: 3 });
  
  const toughnessRange = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const saveRange = [2, 3, 4, 5, 6, 7];
  
  const heatmapData = useMemo(() => {
    const data = [];
    let maxExpected = 0;
    let maxStdDev = 0;
    
    for (const t of toughnessRange) {
      const row = [];
      for (const sv of saveRange) {
        const combined = calculateCombinedDamage(profiles, t, sv);
        row.push({ 
          ...combined.total, 
          toughness: t, 
          save: sv,
          breakdown: combined.breakdown 
        });
        maxExpected = Math.max(maxExpected, combined.total.expected);
        maxStdDev = Math.max(maxStdDev, combined.total.stdDev);
      }
      data.push(row);
    }
    
    return { data, maxExpected, maxStdDev };
  }, [profiles]);
  
  const displayCell = hoveredCell || selectedCell;
  const combinedData = useMemo(() => {
    return calculateCombinedDamage(profiles, displayCell.toughness, displayCell.save);
  }, [profiles, displayCell]);
  
  const getValue = (cell) => {
    switch (showMode) {
      case 'expected': return cell.expected;
      case 'stddev': return cell.stdDev;
      case 'cv': return cell.expected > 0 ? (cell.stdDev / cell.expected) : 0;
      default: return cell.expected;
    }
  };
  
  const getMax = () => {
    switch (showMode) {
      case 'expected': return heatmapData.maxExpected;
      case 'stddev': return heatmapData.maxStdDev;
      case 'cv': return 1;
      default: return heatmapData.maxExpected;
    }
  };
  
  const formatValue = (val) => {
    if (showMode === 'cv') return (val * 100).toFixed(0) + '%';
    return val.toFixed(1);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Heatmap */}
      <div>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'expected', label: 'Expected Damage' },
            { key: 'stddev', label: 'Std Deviation' },
            { key: 'cv', label: 'CV (σ/μ)' },
          ].map(mode => (
            <button
              key={mode.key}
              onClick={() => setShowMode(mode.key)}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                showMode === mode.key 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">
            {showMode === 'expected' && 'Expected Damage'}
            {showMode === 'stddev' && 'Standard Deviation'}
            {showMode === 'cv' && 'Coefficient of Variation (Swinginess)'}
          </h2>
          
          <table className="border-collapse w-full">
            <thead>
              <tr>
                <th className="p-2 text-sm text-gray-500 font-normal">T↓ Sv→</th>
                {saveRange.map(sv => (
                  <th key={sv} className="p-2 text-sm text-gray-400 font-medium min-w-12">
                    {sv <= 6 ? `${sv}+` : '—'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.data.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="p-2 text-sm text-gray-400 font-medium">{toughnessRange[rowIdx]}</td>
                  {row.map((cell, colIdx) => {
                    const value = getValue(cell);
                    const max = getMax();
                    const isHovered = hoveredCell?.toughness === cell.toughness && hoveredCell?.save === cell.save;
                    const isSelected = !hoveredCell && selectedCell.toughness === cell.toughness && selectedCell.save === cell.save;
                    
                    return (
                      <td
                        key={colIdx}
                        className={`p-2 text-center text-sm font-mono cursor-pointer transition-all duration-150 ${
                          isSelected ? 'ring-2 ring-orange-400 ring-inset' : ''
                        } ${isHovered ? 'ring-2 ring-white/50 ring-inset' : ''}`}
                        style={{
                          backgroundColor: getHeatmapColor(value, max),
                          color: value > max * 0.4 ? '#fff' : '#1f2937',
                        }}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => setSelectedCell({ toughness: cell.toughness, save: cell.save })}
                      >
                        {formatValue(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          
          <p className="text-xs text-gray-500 mt-3">Hover to preview · Click to select</p>
        </div>
      </div>
      
      {/* Details panel */}
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-400">Target Profile</div>
              <div className="text-xl font-bold text-white">
                T{displayCell.toughness} / {displayCell.save <= 6 ? `${displayCell.save}+ Save` : 'No Save'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-400">{combinedData.total.expected.toFixed(1)}</div>
              <div className="text-sm text-gray-400">expected damage</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
            <div>
              <div className="text-2xl font-bold text-gray-300">±{combinedData.total.stdDev.toFixed(1)}</div>
              <div className="text-xs text-gray-500">Std Deviation</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-300">
                {combinedData.total.expected > 0 
                  ? ((combinedData.total.stdDev / combinedData.total.expected) * 100).toFixed(0) + '%'
                  : '—'}
              </div>
              <div className="text-xs text-gray-500">CV (Variance)</div>
            </div>
          </div>
        </div>
        
        <AttackFlowDiagram data={combinedData} profiles={profiles} />
        <DamageDistribution expected={combinedData.total.expected} stdDev={combinedData.total.stdDev} />
      </div>
    </div>
  );
}

// ============ TAB 2: TARGET UNIT ============
function TargetUnitTab({ profiles }) {
  const [target, setTarget] = useState({
    toughness: 4,
    save: 3,
    wounds: 2,
    models: 5,
    name: 'Intercessors'
  });
  
  const combinedData = useMemo(() => {
    return calculateCombinedDamage(profiles, target.toughness, target.save, target.wounds, target.models);
  }, [profiles, target]);
  
  const presets = [
    { name: 'Guardsmen', t: 3, sv: 5, w: 1, m: 10 },
    { name: 'Intercessors', t: 4, sv: 3, w: 2, m: 5 },
    { name: 'Terminators', t: 5, sv: 2, w: 3, m: 5 },
    { name: 'Gravis', t: 6, sv: 3, w: 3, m: 3 },
    { name: 'Ork Boyz', t: 5, sv: 6, w: 1, m: 10 },
    { name: 'Custodes', t: 6, sv: 2, w: 3, m: 5 },
    { name: 'Rhino', t: 9, sv: 3, w: 10, m: 1 },
    { name: 'Leman Russ', t: 11, sv: 2, w: 13, m: 1 },
    { name: 'Knight', t: 12, sv: 3, w: 22, m: 1 },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Target config */}
      <div className="space-y-6">
        {/* Presets */}
        <div className="bg-gray-800 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">Target Unit</h3>
          
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-2">Presets</label>
            <div className="flex flex-wrap gap-2">
              {presets.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => setTarget({ ...target, toughness: preset.t, save: preset.sv, wounds: preset.w, models: preset.m, name: preset.name })}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    target.name === preset.name
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Toughness</label>
              <div className="flex">
                {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((val, i) => (
                  <button
                    key={val}
                    onClick={() => setTarget({ ...target, toughness: val, name: '' })}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                      i === 0 ? 'rounded-l' : ''
                    } ${i === 9 ? 'rounded-r' : ''} ${
                      target.toughness === val
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Save</label>
              <div className="flex">
                {[2, 3, 4, 5, 6, 7].map((val, i) => (
                  <button
                    key={val}
                    onClick={() => setTarget({ ...target, save: val, name: '' })}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                      i === 0 ? 'rounded-l' : ''
                    } ${i === 5 ? 'rounded-r' : ''} ${
                      target.save === val
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {val <= 6 ? `${val}+` : '—'}
                  </button>
                ))}
              </div>
            </div>
            
            <Stepper
              label="Wounds / Model"
              value={target.wounds}
              onChange={(v) => setTarget({ ...target, wounds: v, name: '' })}
              min={1}
              max={30}
            />
            
            <Stepper
              label="Models"
              value={target.models}
              onChange={(v) => setTarget({ ...target, models: v, name: '' })}
              min={1}
              max={30}
            />
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-400">
            <span className="text-gray-500">Total wound pool:</span>{' '}
            <span className="text-white font-bold">{target.wounds * target.models}</span> wounds
          </div>
        </div>
        
        <AttackFlowDiagram data={combinedData} profiles={profiles} />
      </div>
      
      {/* Results */}
      <div className="space-y-6">
        {/* Big result card */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-sm text-gray-400">Target</div>
              <div className="text-2xl font-bold text-white">
                {target.name || `T${target.toughness}/${target.save <= 6 ? target.save + '+' : '—'}/${target.wounds}W`}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                T{target.toughness} · {target.save <= 6 ? `${target.save}+ Save` : 'No Save'} · {target.wounds}W × {target.models}
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-orange-400">
                {combinedData.total.expectedKills?.toFixed(1) || '0'}
              </div>
              <div className="text-sm text-gray-400">models killed</div>
            </div>
          </div>
          
          {/* Model visualization */}
          <div className="pt-4 border-t border-gray-700">
            <div className="text-xs text-gray-500 mb-3">Expected Result</div>
            <ModelKillDisplay 
              kills={combinedData.total.expectedKills || 0} 
              total={target.models}
              woundsPerModel={target.wounds}
            />
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-700 text-center">
            <div>
              <div className="text-xl font-bold text-gray-300">{combinedData.total.expected.toFixed(1)}</div>
              <div className="text-xs text-gray-500">Damage</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-300">±{combinedData.total.stdDev.toFixed(1)}</div>
              <div className="text-xs text-gray-500">Std Dev</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-300">
                {Math.round((combinedData.total.expectedKills || 0) / target.models * 100)}%
              </div>
              <div className="text-xs text-gray-500">Unit Killed</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-300">
                {((combinedData.total.expectedKills || 0) >= target.models) ? '✓' : '✗'}
              </div>
              <div className="text-xs text-gray-500">Wipes Unit</div>
            </div>
          </div>
        </div>
        
        <DamageDistribution expected={combinedData.total.expected} stdDev={combinedData.total.stdDev} />
        
        {/* Per-weapon breakdown */}
        {combinedData.breakdown.length > 1 && (
          <div className="bg-gray-800 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Damage Breakdown</h3>
            <div className="space-y-3">
              {combinedData.breakdown.map((b, i) => {
                const color = PROFILE_COLORS[i % PROFILE_COLORS.length];
                const percentage = combinedData.total.expected > 0 
                  ? (b.result.expected / combinedData.total.expected * 100) 
                  : 0;
                  
                return (
                  <div key={b.profile.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: color.bg }} />
                        <span className="text-gray-300">{b.profile.name}</span>
                      </div>
                      <div className="text-gray-400">
                        {b.result.expected.toFixed(1)} dmg · {b.result.expectedKills?.toFixed(1) || '—'} kills
                      </div>
                    </div>
                    <div className="h-2 bg-gray-700 rounded overflow-hidden">
                      <div 
                        className="h-full transition-all duration-300"
                        style={{ width: `${percentage}%`, backgroundColor: color.bg }}
                      />
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

// ============ MAIN COMPONENT ============
function Warhammer40KDamageCalculator() {
  const [activeTab, setActiveTab] = useState('analysis');
  const [profiles, setProfiles] = useState([
    { id: 1, name: 'Bolt Rifles', attacks: 10, bs: 3, strength: 4, ap: 1, damage: '1' },
  ]);
  
  const addProfile = () => {
    const newId = Math.max(...profiles.map(p => p.id), 0) + 1;
    setProfiles([...profiles, {
      id: newId,
      name: `Weapon ${newId}`,
      attacks: 1,
      bs: 3,
      strength: 4,
      ap: 0,
      damage: '1'
    }]);
  };
  
  const updateProfile = (id, updated) => {
    setProfiles(profiles.map(p => p.id === id ? { ...updated, id } : p));
  };
  
  const removeProfile = (id) => {
    setProfiles(profiles.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-orange-400">
        Warhammer 40K Damage Calculator
      </h1>
      
      {/* Weapon Profiles */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-300">Weapon Profiles</h2>
          <button
            onClick={addProfile}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Weapon
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {profiles.map((profile, index) => (
            <WeaponProfileCard
              key={profile.id}
              profile={profile}
              index={index}
              color={PROFILE_COLORS[index % PROFILE_COLORS.length]}
              onUpdate={(updated) => updateProfile(profile.id, updated)}
              onRemove={() => removeProfile(profile.id)}
              canRemove={profiles.length > 1}
            />
          ))}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-700 mb-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-6 py-3 font-medium transition-colors rounded-t-lg ${
              activeTab === 'analysis'
                ? 'bg-gray-800 text-orange-400 border-b-2 border-orange-400'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            📊 Damage Analysis
          </button>
          <button
            onClick={() => setActiveTab('target')}
            className={`px-6 py-3 font-medium transition-colors rounded-t-lg ${
              activeTab === 'target'
                ? 'bg-gray-800 text-orange-400 border-b-2 border-orange-400'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            🎯 Target Unit
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'analysis' && <DamageAnalysisTab profiles={profiles} />}
      {activeTab === 'target' && <TargetUnitTab profiles={profiles} />}
    </div>
  );
}

export default Warhammer40KDamageCalculator;