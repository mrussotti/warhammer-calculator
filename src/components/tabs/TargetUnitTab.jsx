import { useState, useMemo } from 'react';
import { calculateCombinedDamage } from '../../utils/damageCalculations';
import { TARGET_PRESETS, DEFAULT_TARGET, UNIT_KEYWORDS } from '../../utils/constants';
import { Stepper } from '../ui';
import { 
  ModelKillDisplay, 
  AttackFlowDiagram, 
  DamageDistribution, 
  DamageBreakdown 
} from '../visualization';

// ============ UI HELPERS ============

function ToggleChip({ label, active, onChange, color = 'orange' }) {
  const colors = {
    orange: 'bg-orange-600',
    purple: 'bg-purple-600',
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    red: 'bg-red-600',
  };
  
  return (
    <button
      onClick={() => onChange(!active)}
      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
        active 
          ? `${colors[color]} text-white` 
          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );
}

function NumberSelect({ label, value, onChange, options, color = 'orange' }) {
  const colors = {
    orange: 'bg-orange-600',
    purple: 'bg-purple-600',
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    red: 'bg-red-600',
  };
  
  const defaultValue = options[0]?.value;
  const active = value !== defaultValue;
  
  return (
    <div className="flex items-center">
      <span className={`px-2 py-1.5 rounded-l text-xs font-medium ${
        active ? `${colors[color]} text-white` : 'bg-gray-700 text-gray-400'
      }`}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="bg-gray-600 text-white text-xs py-1.5 px-2 rounded-r border-l border-gray-500 focus:outline-none"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ============ MAIN COMPONENT ============

function TargetUnitTab({ profiles }) {
  const [target, setTarget] = useState(DEFAULT_TARGET);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const combinedData = useMemo(() => {
    return calculateCombinedDamage(profiles, target);
  }, [profiles, target]);

  const applyPreset = (preset) => {
    setTarget({
      ...DEFAULT_TARGET,
      toughness: preset.t,
      save: preset.sv,
      wounds: preset.w,
      models: preset.m,
      name: preset.name,
      invuln: preset.invuln || 7,
      fnp: preset.fnp || 7,
      keywords: preset.keywords || ['INFANTRY'],
      minusToWound: preset.minusToWound || 0,
      transhumanlike: preset.transhumanlike || false,
      damageReduction: preset.damageReduction || 0,
      damageCap: preset.damageCap || 0,
    });
  };

  // Count active defensive abilities
  const activeDefenses = [
    target.invuln < 7,
    target.fnp < 7,
    target.hasCover,
    target.stealth,
    target.minusToWound > 0,
    target.transhumanlike,
    target.damageReduction > 0,
    target.damageCap > 0,
    target.apReduction > 0,
  ].filter(Boolean).length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Target configuration */}
      <div className="space-y-6">
        {/* Target unit selector */}
        <div className="bg-gray-800 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">Target Unit</h3>
          
          {/* Presets */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-2">Presets</label>
            <div className="flex flex-wrap gap-2">
              {TARGET_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
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
          
          {/* Basic stats */}
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
              <label className="block text-xs text-gray-500 mb-1">Armor Save</label>
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
        
        {/* Defensive Abilities */}
        <div className="bg-gray-800 rounded-lg p-5">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-lg font-semibold text-gray-300 mb-4 w-full"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Defensive Abilities
            {activeDefenses > 0 && (
              <span className="px-2 py-0.5 bg-orange-600 text-white text-xs rounded">
                {activeDefenses} active
              </span>
            )}
          </button>
          
          {showAdvanced && (
            <div className="space-y-4">
              {/* Save Modifiers */}
              <div>
                <div className="text-xs text-purple-400 font-medium mb-2">Save Modifiers</div>
                <div className="grid grid-cols-2 gap-2">
                  <NumberSelect
                    label="Invuln"
                    value={target.invuln}
                    onChange={(v) => setTarget({ ...target, invuln: v })}
                    options={[
                      { value: 7, label: 'None' },
                      { value: 6, label: '6++' },
                      { value: 5, label: '5++' },
                      { value: 4, label: '4++' },
                      { value: 3, label: '3++' },
                    ]}
                    color="purple"
                  />
                  <NumberSelect
                    label="FNP"
                    value={target.fnp}
                    onChange={(v) => setTarget({ ...target, fnp: v })}
                    options={[
                      { value: 7, label: 'None' },
                      { value: 6, label: '6+++' },
                      { value: 5, label: '5+++' },
                      { value: 4, label: '4+++' },
                    ]}
                    color="green"
                  />
                  <NumberSelect
                    label="Reduce AP"
                    value={target.apReduction || 0}
                    onChange={(v) => setTarget({ ...target, apReduction: v })}
                    options={[
                      { value: 0, label: 'None' },
                      { value: 1, label: '-1 AP' },
                      { value: 2, label: '-2 AP' },
                    ]}
                    color="purple"
                  />
                </div>
              </div>
              
              {/* Wound Protection */}
              <div>
                <div className="text-xs text-green-400 font-medium mb-2">Wound Protection</div>
                <div className="flex flex-wrap gap-2">
                  <NumberSelect
                    label="-X to Wound"
                    value={target.minusToWound || 0}
                    onChange={(v) => setTarget({ ...target, minusToWound: v })}
                    options={[
                      { value: 0, label: 'None' },
                      { value: 1, label: '-1' },
                      { value: 2, label: '-2' },
                    ]}
                    color="green"
                  />
                  <ToggleChip
                    label="Transhuman (4+ max when S>T)"
                    active={target.transhumanlike}
                    onChange={(v) => setTarget({ ...target, transhumanlike: v })}
                    color="green"
                  />
                </div>
              </div>
              
              {/* Damage Reduction */}
              <div>
                <div className="text-xs text-blue-400 font-medium mb-2">Damage Reduction</div>
                <div className="flex flex-wrap gap-2">
                  <NumberSelect
                    label="Reduce Dmg"
                    value={target.damageReduction || 0}
                    onChange={(v) => setTarget({ ...target, damageReduction: v })}
                    options={[
                      { value: 0, label: 'None' },
                      { value: 1, label: '-1' },
                      { value: 2, label: '-2' },
                      { value: 3, label: '-3' },
                    ]}
                    color="blue"
                  />
                  <NumberSelect
                    label="Dmg Cap"
                    value={target.damageCap || 0}
                    onChange={(v) => setTarget({ ...target, damageCap: v })}
                    options={[
                      { value: 0, label: 'None' },
                      { value: 3, label: 'Max 3' },
                      { value: 4, label: 'Max 4' },
                      { value: 6, label: 'Max 6' },
                    ]}
                    color="blue"
                  />
                </div>
              </div>
              
              {/* Hit Protection & Situational */}
              <div>
                <div className="text-xs text-orange-400 font-medium mb-2">Situational</div>
                <div className="flex flex-wrap gap-2">
                  <ToggleChip
                    label="Stealth (-1 to hit)"
                    active={target.stealth}
                    onChange={(v) => setTarget({ ...target, stealth: v })}
                    color="orange"
                  />
                  <ToggleChip
                    label="In Cover (+1 Sv)"
                    active={target.hasCover}
                    onChange={(v) => setTarget({ ...target, hasCover: v })}
                    color="orange"
                  />
                  <ToggleChip
                    label="Half Range"
                    active={target.halfRange}
                    onChange={(v) => setTarget({ ...target, halfRange: v })}
                    color="orange"
                  />
                </div>
              </div>
              
              {/* Attacker Situational */}
              <div>
                <div className="text-xs text-gray-400 font-medium mb-2">Attacker Status</div>
                <div className="flex flex-wrap gap-2">
                  <ToggleChip
                    label="Stationary (for Heavy)"
                    active={target.stationary}
                    onChange={(v) => setTarget({ ...target, stationary: v })}
                    color="blue"
                  />
                  <ToggleChip
                    label="Charged (for Lance)"
                    active={target.charged}
                    onChange={(v) => setTarget({ ...target, charged: v })}
                    color="red"
                  />
                </div>
              </div>
              
              {/* Keywords */}
              <div>
                <div className="text-xs text-gray-400 font-medium mb-2">Unit Keywords (for Anti-X)</div>
                <div className="flex flex-wrap gap-2">
                  {UNIT_KEYWORDS.map(kw => (
                    <button
                      key={kw}
                      onClick={() => {
                        const keywords = target.keywords || [];
                        if (keywords.includes(kw)) {
                          setTarget({ ...target, keywords: keywords.filter(k => k !== kw) });
                        } else {
                          setTarget({ ...target, keywords: [...keywords, kw] });
                        }
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        (target.keywords || []).includes(kw)
                          ? 'bg-gray-500 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
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
                T{target.toughness} · {target.save <= 6 ? `${target.save}+ Sv` : 'No Sv'}
                {target.invuln < 7 && ` · ${target.invuln}++`}
                {target.fnp < 7 && ` · ${target.fnp}+++`}
                {target.damageReduction > 0 && ` · -${target.damageReduction}D`}
                {target.damageCap > 0 && ` · Max${target.damageCap}`}
                {target.minusToWound > 0 && ` · -${target.minusToWound}W`}
                {target.transhumanlike && ` · Trans`}
                {' · '}{target.wounds}W × {target.models}
              </div>
              {(target.hasCover || target.stealth || target.apReduction > 0) && (
                <div className="text-xs text-orange-400 mt-1">
                  {[
                    target.hasCover && 'Cover',
                    target.stealth && 'Stealth',
                    target.apReduction > 0 && `-${target.apReduction} AP`,
                  ].filter(Boolean).join(', ')}
                </div>
              )}
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
          
          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-700 text-center">
            <div>
              <div className="text-xl font-bold text-gray-300">
                {combinedData.total.expected.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Damage</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-300">
                ±{combinedData.total.stdDev.toFixed(1)}
              </div>
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
        
        <DamageDistribution 
          expected={combinedData.total.expected} 
          stdDev={combinedData.total.stdDev} 
        />
        
        <DamageBreakdown 
          breakdown={combinedData.breakdown} 
          totalExpected={combinedData.total.expected} 
        />
      </div>
    </div>
  );
}

export default TargetUnitTab;