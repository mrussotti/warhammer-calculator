import { useState } from 'react';
import { WeaponProfileCard } from '../weapons';
import { PROFILE_COLORS } from '../../utils/constants';
import WeaponFinder from './WeaponFinder';

function UnitCard({ 
  unit, 
  unitIndex,
  onUpdateUnit, 
  onRemoveUnit, 
  onDuplicateUnit,
  onAddProfile,
  onSetProfiles,
  onUpdateProfile,
  onRemoveProfile,
  canRemove,
  globalProfileIndex = 0,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showWeaponFinder, setShowWeaponFinder] = useState(false);
  
  const totalModels = unit.profiles.reduce((sum, p) => sum + (p.modelCount || 1), 0);
  const totalAttacks = unit.profiles.reduce((sum, p) => {
    const atk = typeof p.attacks === 'number' ? p.attacks : parseFloat(p.attacks) || 1;
    return sum + atk * (p.modelCount || 1);
  }, 0);
  
  const unitColor = PROFILE_COLORS[unitIndex % PROFILE_COLORS.length];
  
  // Parse weapon keywords to extract abilities
  const parseWeaponKeywords = (keywordStr) => {
    if (!keywordStr) return {};
    const kw = keywordStr.toLowerCase();
    const abilities = {};
    
    if (kw.includes('lethal hits')) abilities.lethalHits = true;
    if (kw.includes('devastating wounds')) abilities.devastatingWounds = true;
    if (kw.includes('torrent')) abilities.torrent = true;
    if (kw.includes('lance')) abilities.lance = true;
    if (kw.includes('heavy')) abilities.heavy = true;
    if (kw.includes('twin-linked')) abilities.rerollWounds = 'failed';
    
    const sustainedMatch = kw.match(/sustained hits\s*(\d+)?/);
    if (sustainedMatch) abilities.sustainedHits = parseInt(sustainedMatch[1]) || 1;
    
    const meltaMatch = kw.match(/melta\s*(\d+)?/);
    if (meltaMatch) abilities.melta = parseInt(meltaMatch[1]) || 2;
    
    const rapidMatch = kw.match(/rapid fire\s*(\d+)?/);
    if (rapidMatch) abilities.rapidFire = parseInt(rapidMatch[1]) || 1;
    
    const antiMatch = kw.match(/anti-(\w+)\s*(\d+)\+/);
    if (antiMatch) {
      abilities.antiKeyword = antiMatch[1].toUpperCase();
      abilities.antiValue = parseInt(antiMatch[2]);
    }
    
    return abilities;
  };

  const handleWeaponAdd = (weapon) => {
    onAddProfile({
      name: weapon.name,
      attacks: weapon.attacks,
      bs: weapon.bs,
      strength: weapon.strength,
      ap: weapon.ap,
      damage: weapon.damage,
      modelCount: 1,
      ...parseWeaponKeywords(weapon.keywords),
    });
  };

  const handleLoadoutReplace = (weapons) => {
    const profiles = weapons.map(w => ({
      name: w.name,
      attacks: w.attacks,
      bs: w.bs,
      strength: w.strength,
      ap: w.ap,
      damage: w.damage,
      modelCount: 1,
      ...parseWeaponKeywords(w.keywords),
    }));
    
    onSetProfiles ? onSetProfiles(profiles) : profiles.forEach(p => onAddProfile(p));
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div 
        className="px-4 py-3 border-b border-zinc-800"
        style={{ borderLeft: `4px solid ${unitColor.bg}` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <svg className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {isEditing ? (
              <input
                type="text"
                value={unit.name}
                onChange={(e) => onUpdateUnit({ name: e.target.value })}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                className="bg-zinc-800 text-white font-semibold px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 flex-1"
                autoFocus
              />
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-white font-semibold hover:text-orange-400 transition-colors truncate text-left"
              >
                {unit.name}
              </button>
            )}
            
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">{totalModels} models</span>
              <span className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">{unit.profiles.length} weapons</span>
              <span className="px-2 py-0.5 bg-orange-500/20 rounded text-orange-400 font-mono">~{totalAttacks.toFixed(0)} atk</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-3">
            <button
              onClick={() => setShowWeaponFinder(!showWeaponFinder)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showWeaponFinder 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showWeaponFinder ? 'Done' : 'Add Weapons'}
            </button>
            
            <div className="flex items-center gap-1">
              <button onClick={() => onDuplicateUnit()} className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded" title="Duplicate">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              {canRemove && (
                <button onClick={() => onRemoveUnit()} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded" title="Remove">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Weapon Finder Panel */}
      {showWeaponFinder && (
        <div className="border-b border-zinc-800 bg-zinc-800/30">
          <WeaponFinder
            unitName={unit.name}
            onWeaponAdd={handleWeaponAdd}
            onLoadoutReplace={handleLoadoutReplace}
            onUnitNameChange={(name) => onUpdateUnit({ name })}
            onClose={() => setShowWeaponFinder(false)}
          />
        </div>
      )}
      
      {/* Weapon Profiles */}
      {!isCollapsed && (
        <div className="p-4">
          {unit.profiles.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-zinc-500 mb-3">No weapons yet</p>
              <button
                onClick={() => setShowWeaponFinder(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg text-sm font-medium text-orange-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Weapons
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {unit.profiles.map((profile, idx) => (
                <WeaponProfileCard
                  key={profile.id}
                  profile={profile}
                  index={globalProfileIndex + idx}
                  color={PROFILE_COLORS[(globalProfileIndex + idx) % PROFILE_COLORS.length]}
                  onUpdate={(updated) => onUpdateProfile(profile.id, updated)}
                  onRemove={() => onRemoveProfile(profile.id)}
                  canRemove={unit.profiles.length > 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UnitCard;