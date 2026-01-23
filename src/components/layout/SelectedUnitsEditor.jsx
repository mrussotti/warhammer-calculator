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
function WeaponCard({ profile, index, color, onUpdate, isExpanded, onToggleExpand }) {
  // Count active modifiers
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
              <div className="flex items-center gap-2">
                <span className={`font-semibold truncate ${profile.active !== false ? 'text-white' : 'text-zinc-500'}`}>
                  {profile.name}
                </span>
                {activeModCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white" style={{ backgroundColor: color.bg }}>
                    {activeModCount} mod{activeModCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 font-mono">
                <span className="text-zinc-400">{formatStat(totalAttacks)}A</span>
                <span>·</span>
                <span>{profile.torrent ? 'Auto' : `${formatStat(profile.bs)}+`}</span>
                <span>·</span>
                <span>S{formatStat(profile.strength)}</span>
                <span>·</span>
                <span>AP-{formatStat(profile.ap)}</span>
                <span>·</span>
                <span>D{formatStat(profile.damage)}</span>
                {profile.modelCount > 1 && (
                  <>
                    <span>·</span>
                    <span className="text-zinc-400">{profile.modelCount} models</span>
                  </>
                )}
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

// Unit group containing multiple weapons
function UnitGroup({ unit, unitIndex, globalProfileStartIndex, onUpdateProfile, expandedProfiles, onToggleExpand }) {
  const totalModels = unit.profiles.reduce((sum, p) => sum + (p.modelCount || 1), 0);
  const activeProfiles = unit.profiles.filter(p => p.active !== false);
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Unit header */}
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: PROFILE_COLORS[unitIndex % PROFILE_COLORS.length].bg }} 
            />
            <div>
              <h3 className="text-sm font-semibold text-white">{unit.name}</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>{totalModels} model{totalModels !== 1 ? 's' : ''}</span>
                <span>·</span>
                <span>{activeProfiles.length}/{unit.profiles.length} weapons active</span>
              </div>
            </div>
          </div>
          
          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Expand all weapons in this unit
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
                // Collapse all weapons in this unit
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
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Main SelectedUnitsEditor component
 */
function SelectedUnitsEditor({ units, onProfileUpdate, onResetAll }) {
  const [expandedProfiles, setExpandedProfiles] = useState(new Set());
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
  
  // Calculate totals
  const totalWeapons = units.reduce((sum, u) => sum + u.profiles.length, 0);
  const activeWeapons = units.reduce((sum, u) => sum + u.profiles.filter(p => p.active !== false).length, 0);
  const totalModsApplied = units.reduce((sum, u) => {
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
          {totalModsApplied > 0 && (
            <span className="px-2 py-0.5 bg-orange-500/20 rounded text-xs text-orange-400">
              {totalModsApplied} modifier{totalModsApplied !== 1 ? 's' : ''} applied
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
          Click a weapon card to expand and edit modifiers (rerolls, sustained hits, etc.). 
          Changes update the damage calculation immediately.
        </p>
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
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SelectedUnitsEditor;
