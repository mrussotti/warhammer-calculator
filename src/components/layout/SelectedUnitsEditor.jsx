import { useState, useMemo } from 'react';
import { PROFILE_COLORS, UNIT_KEYWORDS } from '../../utils/constants';

/**
 * SelectedUnitsEditor - Edit weapon modifiers for selected units
 * 
 * Displays expandable weapon cards with modifier toggles for:
 * - Hit modifiers (rerolls, +/- to hit, torrent, heavy)
 * - Wound modifiers (lance, twin-linked, +/- to wound)
 * - Critical abilities (sustained hits, lethal hits, devastating wounds)
 * - Other (melta, rapid fire, ignores cover, blast)
 */

// Toggle chip for boolean modifiers
function ModToggle({ label, active, onChange, color = 'orange', size = 'normal' }) {
  const colors = {
    blue: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    green: 'bg-green-500/20 border-green-500/50 text-green-400',
    purple: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
    orange: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
  };
  
  const sizeClasses = size === 'small' 
    ? 'px-2 py-0.5 text-[10px]' 
    : 'px-2.5 py-1 text-xs';
  
  return (
    <button
      onClick={() => onChange(!active)}
      className={`${sizeClasses} rounded font-medium transition-all border ${
        active ? colors[color] : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
      }`}
    >
      {label}
    </button>
  );
}

// Select dropdown for enum modifiers
function ModSelect({ label, value, onChange, options, color = 'orange' }) {
  const defaultValue = options[0]?.value;
  const active = value !== defaultValue;
  const colors = {
    blue: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    green: 'bg-green-500/20 border-green-500/50 text-green-400',
    purple: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
    orange: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
  };

  // Handle case where label is empty (just show the select)
  if (!label) {
    return (
      <select
        value={value ?? defaultValue}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === 'none' ? 'none' : isNaN(val) ? val : parseInt(val));
        }}
        className={`h-[26px] text-xs py-0.5 px-2 rounded border focus:outline-none focus:border-orange-500 ${
          active
            ? `${colors[color]}`
            : 'bg-zinc-800 border-zinc-700 text-zinc-400'
        }`}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex items-center">
      <span className={`px-2 py-1 text-[11px] font-medium border rounded-l border-r-0 ${
        active ? colors[color] : 'bg-zinc-800 border-zinc-700 text-zinc-500'
      }`}>
        {label}
      </span>
      <select
        value={value ?? defaultValue}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === 'none' ? 'none' : isNaN(val) ? val : parseInt(val));
        }}
        className="h-[26px] bg-zinc-800 text-zinc-300 text-xs py-0.5 px-2 rounded-r border border-l-0 border-zinc-700 focus:outline-none focus:border-orange-500"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// Number input for numeric modifiers
function ModNumber({ label, value, onChange, min = 0, max = 3, color = 'orange', showSign = false }) {
  const active = value !== 0 && value !== undefined && value !== null;
  const colors = {
    blue: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    green: 'bg-green-500/20 border-green-500/50 text-green-400',
    purple: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
    orange: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
  };
  
  return (
    <div className="flex items-center">
      <button
        onClick={() => onChange(value === 0 || value === undefined ? (min < 0 ? -1 : 1) : 0)}
        className={`px-2 py-1 text-[11px] font-medium transition-all border ${
          active 
            ? `${colors[color]} rounded-l border-r-0` 
            : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 rounded'
        }`}
      >
        {label}
      </button>
      {active && (
        <select
          value={value || 0}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="h-[26px] bg-zinc-800 text-zinc-300 text-xs py-0.5 px-2 rounded-r border border-l-0 border-zinc-700 focus:outline-none focus:border-orange-500"
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

// Anti-X keyword selector
function AntiKeywordSelector({ value, onChange }) {
  const normalized = value && typeof value === 'object' && value.keyword 
    ? { keyword: value.keyword, value: value.value || 4 } 
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
        className={`px-2 py-1 rounded text-[11px] font-medium transition-all border ${
          active 
            ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' 
            : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
        }`}
      >
        {active ? `Anti-${normalized.keyword} ${normalized.value}+` : 'Anti-X'}
      </button>
      
      {showDropdown && !active && (
        <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-20 p-2 min-w-36">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 px-1">Select keyword</div>
          {UNIT_KEYWORDS.map(kw => (
            <button
              key={kw}
              onClick={() => {
                onChange({ keyword: kw, value: 4 });
                setShowDropdown(false);
              }}
              className="block w-full text-left px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 rounded transition-colors"
            >
              {kw}
            </button>
          ))}
        </div>
      )}
      
      {active && (
        <select
          value={normalized.value}
          onChange={(e) => onChange({ ...normalized, value: parseInt(e.target.value) })}
          onClick={(e) => e.stopPropagation()}
          className="ml-1 h-[26px] bg-zinc-800 text-zinc-300 text-xs py-0.5 px-1.5 rounded border border-zinc-700 focus:outline-none focus:border-orange-500"
        >
          {[2, 3, 4, 5].map(n => (
            <option key={n} value={n}>{n}+</option>
          ))}
        </select>
      )}
    </div>
  );
}

// Individual weapon card with expandable modifiers
function WeaponCard({ profile, index, color, onUpdate, isExpanded, onToggleExpand, armyOverrides, unitOverrides }) {
  // Count active modifiers (from any source)
  const activeModCount = useMemo(() => {
    let count = 0;
    if (profile.torrent) count++;
    if (profile.heavy) count++;
    if (profile.hitMod && profile.hitMod !== 0) count++;
    if (profile.rerollHits && profile.rerollHits !== 'none') count++;
    if (profile.critHitOn && profile.critHitOn < 6) count++;
    if (profile.lance) count++;
    if (profile.woundMod && profile.woundMod !== 0) count++;
    if (profile.twinLinked) count++;
    if (profile.rerollWounds && profile.rerollWounds !== 'none') count++;
    if (profile.critWoundOn && profile.critWoundOn < 6) count++;
    if (profile.sustainedHits && profile.sustainedHits > 0) count++;
    if (profile.lethalHits) count++;
    if (profile.devastatingWounds) count++;
    if (profile.antiKeyword?.keyword) count++;
    if (profile.melta && profile.melta > 0) count++;
    if (profile.rapidFire && profile.rapidFire > 0) count++;
    if (profile.ignoresCover) count++;
    if (profile.blast) count++;
    return count;
  }, [profile]);

  // Check for inherited modifiers
  const hasArmyInheritance = countActiveModifiers(armyOverrides) > 0;
  const hasUnitInheritance = countActiveModifiers(unitOverrides) > 0;
  
  // Format stat value
  const formatStat = (val) => {
    if (val === undefined || val === null) return '?';
    return String(val);
  };
  
  // Calculate total attacks
  const totalAttacks = useMemo(() => {
    const attacks = typeof profile.attacks === 'number' ? profile.attacks : parseFloat(profile.attacks) || 1;
    return attacks * (profile.modelCount || 1);
  }, [profile.attacks, profile.modelCount]);
  
  const handleChange = (key, value) => {
    onUpdate(profile.id, { [key]: value });
  };
  
  return (
    <div className={`bg-zinc-900/50 border rounded-lg overflow-hidden transition-all ${
      profile.active !== false ? 'border-zinc-800' : 'border-zinc-800/50 opacity-50'
    }`}>
      {/* Color indicator */}
      <div className="h-1" style={{ backgroundColor: color.bg }} />
      
      {/* Header - always visible */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Active toggle */}
            <button
              onClick={() => handleChange('active', profile.active === false)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                profile.active !== false 
                  ? 'border-green-500 bg-green-500/20' 
                  : 'border-zinc-600 hover:border-zinc-500'
              }`}
            >
              {profile.active !== false && (
                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            
            {/* Weapon name and stats */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-semibold truncate ${profile.active !== false ? 'text-white' : 'text-zinc-500'}`}>
                  {profile.name}
                </span>
                {activeModCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white" style={{ backgroundColor: color.bg }}>
                    {activeModCount} mod{activeModCount !== 1 ? 's' : ''}
                  </span>
                )}
                {hasArmyInheritance && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400">
                    army
                  </span>
                )}
                {hasUnitInheritance && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400">
                    unit
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 font-mono">
                <span className="text-zinc-400">
                  {profile.modelCount > 1
                    ? `${formatStat(profile.attacks)}×${profile.modelCount}=${formatStat(totalAttacks)}A`
                    : `${formatStat(totalAttacks)}A`
                  }
                </span>
                <span>·</span>
                <span>{profile.torrent ? 'Auto' : `${formatStat(profile.bs)}+`}</span>
                <span>·</span>
                <span>S{formatStat(profile.strength)}</span>
                <span>·</span>
                <span>AP-{formatStat(profile.ap)}</span>
                <span>·</span>
                <span>D{formatStat(profile.damage)}</span>
              </div>
            </div>
          </div>
          
          {/* Expand/collapse button */}
          <button
            onClick={onToggleExpand}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Expanded modifier controls */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-zinc-800 pt-3">
          {/* Inheritance notice */}
          {(hasArmyInheritance || hasUnitInheritance) && (
            <div className="px-2 py-1.5 bg-zinc-800/50 border border-zinc-700 rounded text-[10px] text-zinc-400">
              <span className="font-medium text-zinc-300">Inherited modifiers: </span>
              {hasArmyInheritance && <span className="text-amber-400">Army</span>}
              {hasArmyInheritance && hasUnitInheritance && <span> + </span>}
              {hasUnitInheritance && <span className="text-blue-400">Unit</span>}
              <span className="ml-1">— Set values below to override.</span>
            </div>
          )}
          {/* Hit Modifiers */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
            <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-2">Hit Modifiers</div>
            <div className="flex flex-wrap gap-1.5">
              <ModToggle 
                label="Torrent" 
                active={profile.torrent} 
                onChange={(v) => handleChange('torrent', v)} 
                color="blue" 
              />
              <ModToggle 
                label="Heavy" 
                active={profile.heavy} 
                onChange={(v) => handleChange('heavy', v)} 
                color="blue" 
              />
              <ModNumber 
                label="Hit ±" 
                value={profile.hitMod || 0} 
                onChange={(v) => handleChange('hitMod', v)} 
                min={-2} 
                max={2} 
                showSign 
                color="blue" 
              />
              <ModSelect
                label="RR Hits"
                value={profile.rerollHits || 'none'}
                onChange={(v) => handleChange('rerollHits', v)}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'ones', label: '1s' },
                  { value: 'all', label: 'All' },
                  { value: 'fishing', label: 'Fish' },
                  { value: 'cp', label: 'CP' },
                ]}
                color="blue"
              />
              <ModSelect
                label="Crit On"
                value={profile.critHitOn || 6}
                onChange={(v) => handleChange('critHitOn', v)}
                options={[
                  { value: 6, label: '6s' },
                  { value: 5, label: '5+' },
                  { value: 4, label: '4+' },
                  { value: 3, label: '3+' },
                  { value: 2, label: '2+' },
                ]}
                color="blue"
              />
            </div>
          </div>
          
          {/* Wound Modifiers */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
            <div className="text-[10px] font-semibold text-green-400 uppercase tracking-wider mb-2">Wound Modifiers</div>
            <div className="flex flex-wrap gap-1.5">
              <ModToggle 
                label="Lance" 
                active={profile.lance} 
                onChange={(v) => handleChange('lance', v)} 
                color="green" 
              />
              <ModToggle 
                label="Twin-Linked" 
                active={profile.twinLinked} 
                onChange={(v) => handleChange('twinLinked', v)} 
                color="green" 
              />
              <ModNumber 
                label="Wnd ±" 
                value={profile.woundMod || 0} 
                onChange={(v) => handleChange('woundMod', v)} 
                min={-2} 
                max={2} 
                showSign 
                color="green" 
              />
              <ModSelect
                label="RR Wnds"
                value={profile.rerollWounds || 'none'}
                onChange={(v) => handleChange('rerollWounds', v)}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'ones', label: '1s' },
                  { value: 'all', label: 'All' },
                  { value: 'fishing', label: 'Fish' },
                  { value: 'cp', label: 'CP' },
                ]}
                color="green"
              />
              <ModSelect 
                label="Crit Wnd"
                value={profile.critWoundOn || 6}
                onChange={(v) => handleChange('critWoundOn', v)}
                options={[
                  { value: 6, label: '6s' },
                  { value: 5, label: '5+' },
                  { value: 4, label: '4+' },
                  { value: 3, label: '3+' },
                  { value: 2, label: '2+' },
                ]}
                color="green"
              />
            </div>
          </div>
          
          {/* Critical Abilities */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
            <div className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-2">Critical Abilities</div>
            <div className="flex flex-wrap gap-1.5">
              <ModNumber 
                label="Sustained" 
                value={profile.sustainedHits || 0} 
                onChange={(v) => handleChange('sustainedHits', v)} 
                max={3} 
                color="purple" 
              />
              <ModToggle 
                label="Lethal Hits" 
                active={profile.lethalHits} 
                onChange={(v) => handleChange('lethalHits', v)} 
                color="purple" 
              />
              <ModToggle 
                label="Devastating" 
                active={profile.devastatingWounds} 
                onChange={(v) => handleChange('devastatingWounds', v)} 
                color="purple" 
              />
              <AntiKeywordSelector 
                value={profile.antiKeyword} 
                onChange={(v) => handleChange('antiKeyword', v)} 
              />
            </div>
          </div>
          
          {/* Dice Rerolls */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
            <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider mb-2">Dice Rerolls</div>
            <div className="flex flex-wrap gap-1.5">
              <ModSelect
                label="RR Shots"
                value={profile.rerollShots || 'none'}
                onChange={(v) => handleChange('rerollShots', v)}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'ones', label: '1s' },
                  { value: 'all', label: 'All' },
                  { value: 'cp', label: 'CP' },
                ]}
                color="blue"
              />
              <ModSelect
                label="RR Dmg"
                value={profile.rerollDamage || 'none'}
                onChange={(v) => handleChange('rerollDamage', v)}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'ones', label: '1s' },
                  { value: 'all', label: 'All' },
                  { value: 'cp', label: 'CP' },
                ]}
                color="blue"
              />
            </div>
          </div>

          {/* Range & Other */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
            <div className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider mb-2">Range & Other</div>
            <div className="flex flex-wrap gap-1.5">
              <ModNumber
                label="Melta"
                value={profile.melta || 0}
                onChange={(v) => handleChange('melta', v)}
                max={4}
                color="orange"
              />
              <ModNumber
                label="Rapid Fire"
                value={profile.rapidFire || 0}
                onChange={(v) => handleChange('rapidFire', v)}
                max={4}
                color="orange"
              />
              <ModToggle
                label="Ignores Cover"
                active={profile.ignoresCover}
                onChange={(v) => handleChange('ignoresCover', v)}
                color="orange" 
              />
              <ModToggle 
                label="Blast" 
                active={profile.blast} 
                onChange={(v) => handleChange('blast', v)} 
                color="orange" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Unit group containing multiple weapons with unit-level modifiers
function UnitGroup({
  unit,
  unitIndex,
  globalProfileStartIndex,
  onUpdateProfile,
  expandedProfiles,
  onToggleExpand,
  // Unit-level modifiers
  unitOverrides,
  onUnitOverrideUpdate,
  onUnitOverrideReset,
  isUnitModsExpanded,
  onToggleUnitMods,
  // Army-level modifiers (for inheritance display)
  armyOverrides,
}) {
  const activeProfiles = unit.profiles.filter(p => p.active !== false);
  const unitColor = PROFILE_COLORS[unitIndex % PROFILE_COLORS.length];
  const unitModCount = countActiveModifiers(unitOverrides);
  const armyModCount = countActiveModifiers(armyOverrides);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Unit header */}
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: unitColor.bg }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">{unit.name}</h3>
                {unitModCount > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ backgroundColor: `${unitColor.bg}40`, color: unitColor.bg }}
                  >
                    {unitModCount} unit mod{unitModCount !== 1 ? 's' : ''}
                  </span>
                )}
                {armyModCount > 0 && unitModCount === 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400">
                    inherits army
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>{activeProfiles.length}/{unit.profiles.length} weapon profiles active</span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleUnitMods}
              className={`px-2 py-1 text-[10px] rounded transition-colors ${
                isUnitModsExpanded
                  ? 'bg-zinc-700 text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              Unit Mods
            </button>
            <span className="text-zinc-700">|</span>
            <button
              onClick={() => {
                unit.profiles.forEach(p => {
                  if (!expandedProfiles.has(p.id)) {
                    onToggleExpand(p.id);
                  }
                });
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Expand all
            </button>
            <span className="text-zinc-700">|</span>
            <button
              onClick={() => {
                unit.profiles.forEach(p => {
                  if (expandedProfiles.has(p.id)) {
                    onToggleExpand(p.id);
                  }
                });
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Collapse all
            </button>
          </div>
        </div>
      </div>

      {/* Unit-level modifiers (expandable) */}
      {isUnitModsExpanded && (
        <div
          className="px-4 py-3 border-b border-zinc-800"
          style={{ backgroundColor: `${unitColor.bg}08` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: unitColor.bg }}>
                Unit-Level Modifiers
              </span>
              <span className="text-[10px] text-zinc-500">
                (applies to all weapons in this unit)
              </span>
            </div>
            {unitModCount > 0 && (
              <button
                onClick={() => onUnitOverrideReset(unit.id)}
                className="px-2 py-1 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <SharedModifierPanel
            overrides={unitOverrides || {}}
            onChange={(updates) => onUnitOverrideUpdate(unit.id, updates)}
            color="blue"
            label="Unit"
          />
          {armyModCount > 0 && (
            <div className="mt-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-400">
              Note: {armyModCount} army-wide modifier{armyModCount !== 1 ? 's' : ''} also applied.
              Set a value here to override the army setting for this unit.
            </div>
          )}
        </div>
      )}

      {/* Weapon cards */}
      <div className="p-3 space-y-2">
        {unit.profiles.map((profile, idx) => {
          const globalIndex = globalProfileStartIndex + idx;
          const color = PROFILE_COLORS[globalIndex % PROFILE_COLORS.length];

          return (
            <WeaponCard
              key={profile.id}
              profile={profile}
              index={globalIndex}
              color={color}
              onUpdate={onUpdateProfile}
              isExpanded={expandedProfiles.has(profile.id)}
              onToggleExpand={() => onToggleExpand(profile.id)}
              // Inheritance info
              armyOverrides={armyOverrides}
              unitOverrides={unitOverrides}
            />
          );
        })}
      </div>
    </div>
  );
}

// Shared modifier panel for army/unit level (excludes weapon-specific modifiers)
function SharedModifierPanel({ overrides, onChange, color = 'orange', label }) {
  const handleChange = (key, value) => {
    onChange({ [key]: value });
  };

  return (
    <div className="space-y-3">
      {/* Hit Modifiers */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
        <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-2">Hit Modifiers</div>
        <div className="flex flex-wrap gap-1.5">
          <ModToggle
            label="Heavy"
            active={overrides.heavy}
            onChange={(v) => handleChange('heavy', v)}
            color="blue"
            size="small"
          />
          <ModNumber
            label="Hit ±"
            value={overrides.hitMod || 0}
            onChange={(v) => handleChange('hitMod', v)}
            min={-2}
            max={2}
            showSign
            color="blue"
          />
          <ModSelect
            label="RR Hits"
            value={overrides.rerollHits || 'none'}
            onChange={(v) => handleChange('rerollHits', v)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'ones', label: '1s' },
              { value: 'all', label: 'All' },
              { value: 'fishing', label: 'Fish' },
              { value: 'cp', label: 'CP' },
            ]}
            color="blue"
          />
          <ModSelect
            label="Crit On"
            value={overrides.critHitOn || 6}
            onChange={(v) => handleChange('critHitOn', v)}
            options={[
              { value: 6, label: '6s' },
              { value: 5, label: '5+' },
              { value: 4, label: '4+' },
              { value: 3, label: '3+' },
              { value: 2, label: '2+' },
            ]}
            color="blue"
          />
        </div>
      </div>

      {/* Wound Modifiers */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
        <div className="text-[10px] font-semibold text-green-400 uppercase tracking-wider mb-2">Wound Modifiers</div>
        <div className="flex flex-wrap gap-1.5">
          <ModToggle
            label="Lance"
            active={overrides.lance}
            onChange={(v) => handleChange('lance', v)}
            color="green"
            size="small"
          />
          <ModNumber
            label="Wnd ±"
            value={overrides.woundMod || 0}
            onChange={(v) => handleChange('woundMod', v)}
            min={-2}
            max={2}
            showSign
            color="green"
          />
          <ModSelect
            label="RR Wnds"
            value={overrides.rerollWounds || 'none'}
            onChange={(v) => handleChange('rerollWounds', v)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'ones', label: '1s' },
              { value: 'all', label: 'All' },
              { value: 'fishing', label: 'Fish' },
              { value: 'cp', label: 'CP' },
            ]}
            color="green"
          />
          <ModSelect
            label="Crit Wnd"
            value={overrides.critWoundOn || 6}
            onChange={(v) => handleChange('critWoundOn', v)}
            options={[
              { value: 6, label: '6s' },
              { value: 5, label: '5+' },
              { value: 4, label: '4+' },
              { value: 3, label: '3+' },
              { value: 2, label: '2+' },
            ]}
            color="green"
          />
        </div>
      </div>

      {/* Critical Abilities */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
        <div className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-2">Critical Abilities</div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {/* Sustained Hits with filter */}
          <ModNumber
            label="Sustained"
            value={overrides.sustainedHits || 0}
            onChange={(v) => handleChange('sustainedHits', v)}
            max={3}
            color="purple"
          />
          {(overrides.sustainedHits > 0) && (
            <ModSelect
              label=""
              value={overrides.sustainedHitsFilter || 'all'}
              onChange={(v) => handleChange('sustainedHitsFilter', v)}
              options={[
                { value: 'all', label: 'All' },
                { value: 'melee', label: 'Melee' },
                { value: 'ranged', label: 'Ranged' },
              ]}
              color="purple"
            />
          )}

          {/* Lethal Hits with filter */}
          <ModToggle
            label="Lethal Hits"
            active={overrides.lethalHits}
            onChange={(v) => handleChange('lethalHits', v)}
            color="purple"
            size="small"
          />
          {overrides.lethalHits && (
            <ModSelect
              label=""
              value={overrides.lethalHitsFilter || 'all'}
              onChange={(v) => handleChange('lethalHitsFilter', v)}
              options={[
                { value: 'all', label: 'All' },
                { value: 'melee', label: 'Melee' },
                { value: 'ranged', label: 'Ranged' },
              ]}
              color="purple"
            />
          )}

          <ModToggle
            label="Devastating"
            active={overrides.devastatingWounds}
            onChange={(v) => handleChange('devastatingWounds', v)}
            color="purple"
            size="small"
          />
        </div>
      </div>

      {/* Dice Rerolls */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
        <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider mb-2">Dice Rerolls</div>
        <div className="flex flex-wrap gap-1.5">
          <ModSelect
            label="RR Shots"
            value={overrides.rerollShots || 'none'}
            onChange={(v) => handleChange('rerollShots', v)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'ones', label: '1s' },
              { value: 'all', label: 'All' },
              { value: 'cp', label: 'CP' },
            ]}
            color="blue"
          />
          <ModSelect
            label="RR Dmg"
            value={overrides.rerollDamage || 'none'}
            onChange={(v) => handleChange('rerollDamage', v)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'ones', label: '1s' },
              { value: 'all', label: 'All' },
              { value: 'cp', label: 'CP' },
            ]}
            color="blue"
          />
        </div>
      </div>

      {/* Other */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
        <div className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider mb-2">Other</div>
        <div className="flex flex-wrap gap-1.5">
          <ModToggle
            label="Ignores Cover"
            active={overrides.ignoresCover}
            onChange={(v) => handleChange('ignoresCover', v)}
            color="orange"
            size="small"
          />
        </div>
      </div>
    </div>
  );
}

// Count active modifiers in an overrides object
function countActiveModifiers(overrides) {
  if (!overrides) return 0;
  let count = 0;
  if (overrides.heavy) count++;
  if (overrides.hitMod && overrides.hitMod !== 0) count++;
  if (overrides.rerollHits && overrides.rerollHits !== 'none') count++;
  if (overrides.critHitOn && overrides.critHitOn < 6) count++;
  if (overrides.lance) count++;
  if (overrides.woundMod && overrides.woundMod !== 0) count++;
  if (overrides.rerollWounds && overrides.rerollWounds !== 'none') count++;
  if (overrides.critWoundOn && overrides.critWoundOn < 6) count++;
  if (overrides.sustainedHits && overrides.sustainedHits > 0) count++;
  if (overrides.lethalHits) count++;
  if (overrides.devastatingWounds) count++;
  if (overrides.ignoresCover) count++;
  if (overrides.rerollShots && overrides.rerollShots !== 'none') count++;
  if (overrides.rerollDamage && overrides.rerollDamage !== 'none') count++;
  return count;
}

// Army-wide modifiers section
function ArmyWideModifiers({ armyOverrides, onUpdate, onReset }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeCount = countActiveModifiers(armyOverrides);

  return (
    <div className="mb-4 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-700/40 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-900/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-amber-200">Army-Wide Modifiers</span>
              {activeCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/30 text-amber-300">
                  {activeCount} active
                </span>
              )}
            </div>
            <p className="text-[11px] text-amber-400/60">Applies to ALL weapons in selected units</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              className="px-2 py-1 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
            >
              Clear
            </button>
          )}
          <svg
            className={`w-4 h-4 text-amber-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-amber-700/30">
          <div className="pt-3">
            <SharedModifierPanel
              overrides={armyOverrides || {}}
              onChange={onUpdate}
              color="orange"
              label="Army"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main SelectedUnitsEditor component
 */
function SelectedUnitsEditor({
  units,
  onProfileUpdate,
  onResetAll,
  // Unit overrides
  unitOverrides,
  onUnitOverrideUpdate,
  onUnitOverrideReset,
  // Army overrides
  armyOverrides,
  onArmyOverrideUpdate,
  onArmyOverrideReset,
}) {
  const [expandedProfiles, setExpandedProfiles] = useState(new Set());
  const [expandedUnitMods, setExpandedUnitMods] = useState(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Toggle profile expansion
  const toggleExpand = (profileId) => {
    setExpandedProfiles(prev => {
      const next = new Set(prev);
      if (next.has(profileId)) {
        next.delete(profileId);
      } else {
        next.add(profileId);
      }
      return next;
    });
  };

  // Toggle unit modifiers expansion
  const toggleUnitMods = (unitId) => {
    setExpandedUnitMods(prev => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };
  
  // Calculate totals
  const totalWeapons = units.reduce((sum, u) => sum + u.profiles.length, 0);
  const activeWeapons = units.reduce((sum, u) => sum + u.profiles.filter(p => p.active !== false).length, 0);

  // Count modifiers at each level
  const armyModCount = countActiveModifiers(armyOverrides);
  const totalUnitMods = Object.values(unitOverrides || {}).reduce((sum, o) => sum + countActiveModifiers(o), 0);
  const totalWeaponMods = units.reduce((sum, u) => {
    return sum + u.profiles.reduce((pSum, p) => {
      let count = 0;
      if (p.torrent) count++;
      if (p.heavy) count++;
      if (p.hitMod && p.hitMod !== 0) count++;
      if (p.rerollHits && p.rerollHits !== 'none') count++;
      if (p.critHitOn && p.critHitOn < 6) count++;
      if (p.lance) count++;
      if (p.woundMod && p.woundMod !== 0) count++;
      if (p.twinLinked) count++;
      if (p.rerollWounds && p.rerollWounds !== 'none') count++;
      if (p.critWoundOn && p.critWoundOn < 6) count++;
      if (p.sustainedHits && p.sustainedHits > 0) count++;
      if (p.lethalHits) count++;
      if (p.devastatingWounds) count++;
      if (p.antiKeyword?.keyword) count++;
      if (p.melta && p.melta > 0) count++;
      if (p.rapidFire && p.rapidFire > 0) count++;
      if (p.ignoresCover) count++;
      if (p.blast) count++;
      return pSum + count;
    }, 0);
  }, 0);
  const totalModsApplied = armyModCount + totalUnitMods + totalWeaponMods;
  
  // Track global profile index for coloring
  let globalProfileIndex = 0;
  
  if (units.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2"
        >
          <svg 
            className={`w-4 h-4 text-zinc-500 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h2 className="text-lg font-semibold text-white">Weapon Modifiers</h2>
          <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">
            {activeWeapons}/{totalWeapons} weapons
          </span>
          {armyModCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-500/20 rounded text-xs text-amber-400">
              {armyModCount} army
            </span>
          )}
          {totalUnitMods > 0 && (
            <span className="px-2 py-0.5 bg-blue-500/20 rounded text-xs text-blue-400">
              {totalUnitMods} unit
            </span>
          )}
          {totalWeaponMods > 0 && (
            <span className="px-2 py-0.5 bg-orange-500/20 rounded text-xs text-orange-400">
              {totalWeaponMods} weapon
            </span>
          )}
        </button>
        
        <div className="flex items-center gap-2">
          {totalModsApplied > 0 && onResetAll && (
            <button
              onClick={onResetAll}
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
            >
              Reset All
            </button>
          )}
        </div>
      </div>
      
      {/* Help text */}
      {!isCollapsed && (
        <p className="text-xs text-zinc-500 mb-4">
          Set modifiers at Army, Unit, or Weapon level. Lower levels override higher ones (Weapon {">"} Unit {">"} Army).
        </p>
      )}

      {/* Army-wide modifiers */}
      {!isCollapsed && (
        <ArmyWideModifiers
          armyOverrides={armyOverrides || {}}
          onUpdate={onArmyOverrideUpdate}
          onReset={onArmyOverrideReset}
        />
      )}

      {/* Unit groups */}
      {!isCollapsed && (
        <div className="space-y-4">
          {units.map((unit, unitIndex) => {
            const startIndex = globalProfileIndex;
            globalProfileIndex += unit.profiles.length;

            return (
              <UnitGroup
                key={unit.id}
                unit={unit}
                unitIndex={unitIndex}
                globalProfileStartIndex={startIndex}
                onUpdateProfile={onProfileUpdate}
                expandedProfiles={expandedProfiles}
                onToggleExpand={toggleExpand}
                // Unit-level modifiers
                unitOverrides={unitOverrides?.[unit.id] || {}}
                onUnitOverrideUpdate={onUnitOverrideUpdate}
                onUnitOverrideReset={onUnitOverrideReset}
                isUnitModsExpanded={expandedUnitMods.has(unit.id)}
                onToggleUnitMods={() => toggleUnitMods(unit.id)}
                // Army-level modifiers (for inheritance display)
                armyOverrides={armyOverrides || {}}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SelectedUnitsEditor;
