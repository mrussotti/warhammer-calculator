import { useState } from 'react';
import { Stepper } from '../ui';
import { parseDamage } from '../../utils/damageCalculations';
import { BS_WS_RANGE, DAMAGE_PRESETS, UNIT_KEYWORDS } from '../../utils/constants';

// ============ UI COMPONENTS ============

function AbilityToggle({ label, active, onChange, color = '#f97316' }) {
  return (
    <button
      onClick={() => onChange(!active)}
      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
        active 
          ? 'text-white' 
          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
      }`}
      style={active ? { backgroundColor: color } : {}}
    >
      {label}
    </button>
  );
}

function AbilityNumber({ label, value, onChange, max = 3, min = 0, color = '#f97316', showSign = false }) {
  const active = value !== 0;
  const displayValue = showSign && value > 0 ? `+${value}` : value;
  
  return (
    <div className="flex items-center">
      <button
        onClick={() => onChange(value === 0 ? (min < 0 ? -1 : 1) : 0)}
        className={`px-2 py-0.5 rounded-l text-xs font-medium transition-colors ${
          active 
            ? 'text-white' 
            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
        }`}
        style={active ? { backgroundColor: color } : {}}
      >
        {label}
      </button>
      {active && (
        <select
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="bg-gray-600 text-white text-xs py-0.5 px-1 rounded-r border-l border-gray-500 focus:outline-none"
        >
          {Array.from({ length: max - min + 1 }, (_, i) => min + i)
            .filter(n => n !== 0 || min === 0)
            .map(n => (
              <option key={n} value={n}>
                {showSign && n > 0 ? `+${n}` : n}
              </option>
            ))}
        </select>
      )}
    </div>
  );
}

function AbilitySelect({ label, value, onChange, options, color = '#f97316' }) {
  const defaultValue = options[0]?.value;
  const active = value !== defaultValue;
  
  return (
    <div className="flex items-center">
      <span className={`px-2 py-0.5 rounded-l text-xs font-medium ${
        active ? 'text-white' : 'bg-gray-700 text-gray-400'
      }`}
      style={active ? { backgroundColor: color } : {}}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === 'none' ? val : isNaN(val) ? val : parseInt(val));
        }}
        className="bg-gray-600 text-white text-xs py-0.5 px-1 rounded-r border-l border-gray-500 focus:outline-none"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function AntiKeywordSelector({ value, onChange, color = '#f97316' }) {
  // Treat undefined / malformed values as "not set".
  // (Older profiles may not have antiKeyword initialized.)
  const normalized =
    value &&
    typeof value === 'object' &&
    typeof value.keyword === 'string' &&
    value.keyword.length > 0 &&
    (typeof value.value === 'number' || typeof value.value === 'string')
      ? { keyword: value.keyword, value: parseInt(value.value, 10) || 4 }
      : null;

  const active = normalized !== null;
  const [showDropdown, setShowDropdown] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => {
          if (active) {
            onChange(null);
          } else {
            setShowDropdown(!showDropdown);
          }
        }}
        className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
          active 
            ? 'text-white' 
            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
        }`}
        style={active ? { backgroundColor: color } : {}}
      >
        {active ? `Anti-${normalized.keyword} ${normalized.value}+` : 'Anti-X'}
      </button>
      
      {showDropdown && !active && (
        <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-20 p-2 min-w-32">
          <div className="text-xs text-gray-400 mb-2">Select keyword:</div>
          {UNIT_KEYWORDS.map(kw => (
            <button
              key={kw}
              onClick={() => {
                onChange({ keyword: kw, value: 4 });
                setShowDropdown(false);
              }}
              className="block w-full text-left px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 rounded"
            >
              {kw}
            </button>
          ))}
        </div>
      )}
      
      {active && (
        <select
          value={normalized.value}
          onChange={(e) => onChange({ ...normalized, value: parseInt(e.target.value, 10) })}
          onClick={(e) => e.stopPropagation()}
          className="ml-1 bg-gray-600 text-white text-xs py-0.5 px-1 rounded border border-gray-500 focus:outline-none"
        >
          {[2, 3, 4, 5].map(n => (
            <option key={n} value={n}>{n}+</option>
          ))}
        </select>
      )}
    </div>
  );
}

// ============ MAIN COMPONENT ============

function WeaponProfileCard({ profile, index, color, onUpdate, onRemove, canRemove }) {
  const [showAbilities, setShowAbilities] = useState(false);
  const hitProb = profile.torrent ? 1 : (7 - profile.bs) / 6;
  const damageStats = parseDamage(profile.damage);
  
  // Count active abilities
  const activeAbilities = [
    profile.torrent,
    profile.heavy,
    profile.hitMod !== 0,
    profile.rerollHits !== 'none',
    profile.critHitOn < 6,
    profile.lance,
    profile.woundMod !== 0,
    profile.twinLinked,
    profile.rerollWounds !== 'none',
    profile.critWoundOn < 6,
    profile.sustainedHits > 0,
    profile.lethalHits,
    profile.devastatingWounds,
    // antiKeyword may be null/undefined on older profiles
    profile.antiKeyword?.keyword,
    profile.melta > 0,
    profile.rapidFire > 0,
    profile.ignoresCover,
    profile.blast,
  ].filter(Boolean);
  
  const activeCount = activeAbilities.length;
  
  // Build ability summary string
  const abilitySummary = [
    profile.torrent && 'Torrent',
    profile.heavy && 'Heavy',
    profile.hitMod > 0 && `+${profile.hitMod} Hit`,
    profile.hitMod < 0 && `${profile.hitMod} Hit`,
    profile.rerollHits === 'ones' && 'RR1 Hit',
    profile.rerollHits === 'all' && 'RR Hit',
    profile.critHitOn < 6 && `Crit ${profile.critHitOn}+`,
    profile.lance && 'Lance',
    profile.woundMod > 0 && `+${profile.woundMod} Wnd`,
    profile.woundMod < 0 && `${profile.woundMod} Wnd`,
    profile.twinLinked && 'Twin',
    profile.rerollWounds === 'ones' && 'RR1 Wnd',
    profile.rerollWounds === 'all' && !profile.twinLinked && 'RR Wnd',
    profile.critWoundOn < 6 && `CritW ${profile.critWoundOn}+`,
    profile.sustainedHits > 0 && `Sust${profile.sustainedHits}`,
    profile.lethalHits && 'Lethal',
    profile.devastatingWounds && 'DevW',
    profile.antiKeyword?.keyword && `Anti-${profile.antiKeyword.keyword.slice(0,3)}`,
    profile.melta > 0 && `Melta${profile.melta}`,
    profile.rapidFire > 0 && `RF${profile.rapidFire}`,
    profile.ignoresCover && 'IgnCov',
    profile.blast && 'Blast',
  ].filter(Boolean).join(', ');
  
  return (
    <div 
      className="bg-gray-800 rounded-lg p-4 border-l-4"
      style={{ borderLeftColor: color.bg }}
    >
      {/* Header */}
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
      
      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex gap-3 items-end">
          <div className="flex-1">
            <Stepper 
              label="Attacks" 
              value={profile.attacks} 
              onChange={(v) => onUpdate({ ...profile, attacks: v })} 
              min={1} 
              small 
            />
          </div>
          <div className="text-gray-500 text-lg pb-1">×</div>
          <div className="flex-1">
            <Stepper 
              label="Models" 
              value={profile.modelCount || 1} 
              onChange={(v) => onUpdate({ ...profile, modelCount: v })} 
              min={1}
              max={100}
              small 
            />
          </div>
          <div className="text-gray-400 text-sm pb-1 min-w-12">
            = {(profile.attacks || 1) * (profile.modelCount || 1)}
          </div>
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">BS/WS</label>
          <div className="flex">
            {BS_WS_RANGE.map((val, i) => (
              <button
                key={val}
                onClick={() => onUpdate({ ...profile, bs: val })}
                className={`flex-1 py-1 text-xs font-medium transition-colors ${
                  i === 0 ? 'rounded-l' : ''
                } ${i === BS_WS_RANGE.length - 1 ? 'rounded-r' : ''} ${
                  profile.bs === val ? 'text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
                style={profile.bs === val ? { backgroundColor: color.bg } : {}}
              >
                {val}+
              </button>
            ))}
          </div>
        </div>
        
        <Stepper 
          label="Strength" 
          value={profile.strength} 
          onChange={(v) => onUpdate({ ...profile, strength: v })} 
          min={1} 
          small 
        />
        <Stepper 
          label="AP" 
          value={profile.ap} 
          onChange={(v) => onUpdate({ ...profile, ap: v })} 
          min={0} 
          showValue={`-${profile.ap}`} 
          small 
        />
      </div>
      
      {/* Damage */}
      <div className="mt-3">
        <label className="block text-xs text-gray-500 mb-1">Damage</label>
        <div className="flex flex-wrap gap-1">
          {DAMAGE_PRESETS.slice(0, 6).map(preset => (
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
      
      {/* Abilities Section */}
      <div className="mt-3">
        <button
          onClick={() => setShowAbilities(!showAbilities)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 transition-colors"
        >
          <svg 
            className={`w-3 h-3 transition-transform ${showAbilities ? 'rotate-90' : ''}`} 
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Weapon Abilities
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-white text-xs" style={{ backgroundColor: color.bg }}>
              {activeCount}
            </span>
          )}
        </button>
        
        {showAbilities && (
          <div className="mt-2 p-3 bg-gray-900/50 rounded space-y-3">
            {/* Hit Modifiers */}
            <div>
              <div className="text-xs text-blue-400 font-medium mb-1.5">Hit Modifiers</div>
              <div className="flex flex-wrap gap-1.5">
                <AbilityToggle
                  label="Torrent"
                  active={profile.torrent}
                  onChange={(v) => onUpdate({ ...profile, torrent: v })}
                  color="#3b82f6"
                />
                <AbilityToggle
                  label="Heavy"
                  active={profile.heavy}
                  onChange={(v) => onUpdate({ ...profile, heavy: v })}
                  color="#3b82f6"
                />
                <AbilityNumber
                  label="Hit Mod"
                  value={profile.hitMod || 0}
                  onChange={(v) => onUpdate({ ...profile, hitMod: v })}
                  min={-2}
                  max={2}
                  showSign
                  color="#3b82f6"
                />
                <AbilitySelect
                  label="RR Hits"
                  value={profile.rerollHits || 'none'}
                  onChange={(v) => onUpdate({ ...profile, rerollHits: v })}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'ones', label: '1s' },
                    { value: 'all', label: 'All' },
                  ]}
                  color="#3b82f6"
                />
                <AbilitySelect
                  label="Crit On"
                  value={profile.critHitOn || 6}
                  onChange={(v) => onUpdate({ ...profile, critHitOn: v })}
                  options={[
                    { value: 6, label: '6s' },
                    { value: 5, label: '5+' },
                    { value: 4, label: '4+' },
                  ]}
                  color="#3b82f6"
                />
              </div>
            </div>
            
            {/* Wound Modifiers */}
            <div>
              <div className="text-xs text-green-400 font-medium mb-1.5">Wound Modifiers</div>
              <div className="flex flex-wrap gap-1.5">
                <AbilityToggle
                  label="Lance"
                  active={profile.lance}
                  onChange={(v) => onUpdate({ ...profile, lance: v })}
                  color="#10b981"
                />
                <AbilityToggle
                  label="Twin-Linked"
                  active={profile.twinLinked}
                  onChange={(v) => onUpdate({ ...profile, twinLinked: v })}
                  color="#10b981"
                />
                <AbilityNumber
                  label="Wnd Mod"
                  value={profile.woundMod || 0}
                  onChange={(v) => onUpdate({ ...profile, woundMod: v })}
                  min={-2}
                  max={2}
                  showSign
                  color="#10b981"
                />
                <AbilitySelect
                  label="RR Wnds"
                  value={profile.rerollWounds || 'none'}
                  onChange={(v) => onUpdate({ ...profile, rerollWounds: v })}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'ones', label: '1s' },
                    { value: 'all', label: 'All' },
                  ]}
                  color="#10b981"
                />
                <AbilitySelect
                  label="Crit Wnd"
                  value={profile.critWoundOn || 6}
                  onChange={(v) => onUpdate({ ...profile, critWoundOn: v })}
                  options={[
                    { value: 6, label: '6s' },
                    { value: 5, label: '5+' },
                    { value: 4, label: '4+' },
                  ]}
                  color="#10b981"
                />
              </div>
            </div>
            
            {/* Critical Abilities */}
            <div>
              <div className="text-xs text-purple-400 font-medium mb-1.5">Critical Abilities</div>
              <div className="flex flex-wrap gap-1.5">
                <AbilityNumber
                  label="Sust Hits"
                  value={profile.sustainedHits || 0}
                  onChange={(v) => onUpdate({ ...profile, sustainedHits: v })}
                  max={3}
                  color="#8b5cf6"
                />
                <AbilityToggle
                  label="Lethal"
                  active={profile.lethalHits}
                  onChange={(v) => onUpdate({ ...profile, lethalHits: v })}
                  color="#8b5cf6"
                />
                <AbilityToggle
                  label="Dev. Wounds"
                  active={profile.devastatingWounds}
                  onChange={(v) => onUpdate({ ...profile, devastatingWounds: v })}
                  color="#8b5cf6"
                />
                <AntiKeywordSelector
                  value={profile.antiKeyword}
                  onChange={(v) => onUpdate({ ...profile, antiKeyword: v })}
                  color="#8b5cf6"
                />
              </div>
            </div>
            
            {/* Range & Other */}
            <div>
              <div className="text-xs text-orange-400 font-medium mb-1.5">Range & Other</div>
              <div className="flex flex-wrap gap-1.5">
                <AbilityNumber
                  label="Melta"
                  value={profile.melta || 0}
                  onChange={(v) => onUpdate({ ...profile, melta: v })}
                  max={4}
                  color="#f97316"
                />
                <AbilityNumber
                  label="Rapid Fire"
                  value={profile.rapidFire || 0}
                  onChange={(v) => onUpdate({ ...profile, rapidFire: v })}
                  max={4}
                  color="#f97316"
                />
                <AbilityToggle
                  label="Ign. Cover"
                  active={profile.ignoresCover}
                  onChange={(v) => onUpdate({ ...profile, ignoresCover: v })}
                  color="#f97316"
                />
                <AbilityToggle
                  label="Blast"
                  active={profile.blast}
                  onChange={(v) => onUpdate({ ...profile, blast: v })}
                  color="#f97316"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Stats Footer */}
      <div className="mt-3 pt-2 border-t border-gray-700 text-xs text-gray-500">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>Total: {(profile.attacks || 1) * (profile.modelCount || 1)} attacks</span>
          <span>Hit: {profile.torrent ? 'Auto' : `${(hitProb * 100).toFixed(0)}%`}</span>
          <span>
            D: {damageStats.mean.toFixed(1)}
            {damageStats.variance > 0 && ` ±${Math.sqrt(damageStats.variance).toFixed(1)}`}
          </span>
        </div>
        {abilitySummary && (
          <div className="mt-1 text-orange-400 truncate" title={abilitySummary}>
            {abilitySummary}
          </div>
        )}
      </div>
    </div>
  );
}

export default WeaponProfileCard;